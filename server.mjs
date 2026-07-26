import 'dotenv/config';
import express from 'express';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import cors from 'cors';
import multer from 'multer';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { GoogleGenAI } from "@google/genai";
import { normalizeConversationHistory, buildChatMessages, buildForgeContextPayload } from './forge-ai-utils.mjs';
import {
  createPortalStore,
  isValidEmail,
  normalizeEmail,
  PROJECT_STATUSES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  uploadFileToStorage
} from './portal-store.mjs';
import { resolveRequestUser, requireMatchingUser, supabaseAuthConfigured, strictAuthRequired } from './auth-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

const developerEmails = ['azeem.makhdum6@gmail.com', 'abbas585@gmail.com'];
const accessStorePath = join(__dirname, 'forge-access.json');
/** Pack sizes from Pricing page */
const FORGE_BUNDLE_CREDITS = 100;
const ENTERPRISE_CREDITS = 500;
const portalStore = createPortalStore();
console.log('Portal data backend:', portalStore.backend);
console.log(
  'Portal auth mode:',
  supabaseAuthConfigured()
    ? strictAuthRequired()
      ? 'supabase-jwt (strict)'
      : 'supabase-jwt (available)'
    : strictAuthRequired()
      ? 'MISSING KEYS (strict required)'
      : 'relaxed-email (set SUPABASE_URL + key for strict auth)'
);

function defaultCreditsForPlan(plan = 'forge_bundle') {
  return plan === 'enterprise' ? ENTERPRISE_CREDITS : FORGE_BUNDLE_CREDITS;
}

function planLabel(plan = 'forge_bundle') {
  return plan === 'enterprise' ? 'Enterprise (custom)' : 'Forge Bundle';
}

function decodeAccessStoreBuffer(buf) {
  // Windows editors sometimes save this file as UTF-16 LE (null bytes between chars)
  const looksUtf16Le =
    (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) ||
    (buf.length >= 4 && buf[0] === 0x7b && buf[1] === 0x00) ||
    (buf.length >= 4 && buf[1] === 0x00 && buf[3] === 0x00 && buf[0] !== 0x00);
  if (looksUtf16Le) {
    const text = (buf[0] === 0xff && buf[1] === 0xfe ? buf.slice(2) : buf).toString('utf16le');
    return { text: text.replace(/^\uFEFF/, '').trim(), needsUtf8Rewrite: true };
  }
  return {
    text: buf.toString('utf8').replace(/^\uFEFF/, '').trim(),
    needsUtf8Rewrite: false
  };
}

function normalizeForgeAccessStore(parsed) {
  const allowedEmails = Array.isArray(parsed.allowedEmails)
    ? parsed.allowedEmails.map((email) => `${email}`.toLowerCase())
    : [];
  const extraDevelopers = Array.isArray(parsed.developerEmails)
    ? parsed.developerEmails.map((email) => `${email}`.toLowerCase())
    : [];
  const adminEmails = Array.isArray(parsed.adminEmails)
    ? parsed.adminEmails.map((email) => `${email}`.toLowerCase())
    : [];
  const clientMeta =
    parsed.clientMeta && typeof parsed.clientMeta === 'object' ? { ...parsed.clientMeta } : {};
  for (const email of allowedEmails) {
    if (!clientMeta[email]) {
      clientMeta[email] = {
        plan: 'forge_bundle',
        credits: FORGE_BUNDLE_CREDITS,
        purchases: 1
      };
    }
  }
  return { allowedEmails, developerEmails: extraDevelopers, adminEmails, clientMeta };
}

function defaultForgeAccessStore() {
  return {
    allowedEmails: ['test@example.com'],
    developerEmails: [],
    adminEmails: [],
    clientMeta: {
      'test@example.com': {
        plan: 'forge_bundle',
        credits: FORGE_BUNDLE_CREDITS,
        purchases: 1
      }
    }
  };
}

function backupCorruptAccessStore(reason) {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(__dirname, `forge-access.corrupt.${stamp}.json`);
    writeFileSync(backupPath, readFileSync(accessStorePath));
    console.warn(`Forge access store backup saved (${reason}):`, backupPath);
  } catch (backupError) {
    console.warn('Could not backup corrupt Forge access store:', backupError.message);
  }
}

function parseAccessStoreRaw(raw) {
  if (!raw || raw[0] !== '{') {
    throw new Error('Forge access store is empty or not JSON object');
  }
  return JSON.parse(raw);
}

function readForgeAccessStore() {
  const empty = { allowedEmails: [], developerEmails: [], adminEmails: [], clientMeta: {} };

  try {
    if (!existsSync(accessStorePath)) {
      const initial = defaultForgeAccessStore();
      writeForgeAccessStore(initial);
      return initial;
    }

    const buf = readFileSync(accessStorePath);
    let decoded = decodeAccessStoreBuffer(buf);
    let parsed;

    try {
      parsed = parseAccessStoreRaw(decoded.text);
    } catch (primaryError) {
      // Last-chance UTF-16 recovery if detection missed
      try {
        const fallbackText = buf.toString('utf16le').replace(/^\uFEFF/, '').trim();
        parsed = parseAccessStoreRaw(fallbackText);
        decoded = { text: fallbackText, needsUtf8Rewrite: true };
        console.warn('Forge access store recovered via UTF-16 fallback:', primaryError.message);
      } catch {
        throw primaryError;
      }
    }

    const store = normalizeForgeAccessStore(parsed);
    if (decoded.needsUtf8Rewrite) {
      console.warn('Rewriting forge-access.json as UTF-8');
      writeForgeAccessStore(store);
    }
    return store;
  } catch (error) {
    console.warn('Failed to read Forge access store:', error.message);
    if (existsSync(accessStorePath)) {
      backupCorruptAccessStore(error.message);
    }
    try {
      const initial = defaultForgeAccessStore();
      writeForgeAccessStore(initial);
      return initial;
    } catch {
      return empty;
    }
  }
}

function writeForgeAccessStore(store) {
  try {
    if (existsSync(accessStorePath)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      writeFileSync(join(__dirname, `forge-access.backup.${stamp}.json`), readFileSync(accessStorePath));
    }
  } catch (error) {
    console.warn('Forge access backup failed:', error.message);
  }

  const payload = JSON.stringify(
    {
      allowedEmails: store.allowedEmails || [],
      developerEmails: store.developerEmails || [],
      adminEmails: store.adminEmails || [],
      clientMeta: store.clientMeta || {}
    },
    null,
    2
  );
  // Explicit UTF-8 bytes — avoids Windows UTF-16 encoding surprises
  writeFileSync(accessStorePath, Buffer.from(`${payload}\n`, 'utf8'));
}

function isSystemDeveloper(email = '') {
  return developerEmails.includes(`${email}`.toLowerCase());
}

function isAdminEmail(email = '') {
  const normalized = `${email}`.toLowerCase();
  if (isSystemDeveloper(normalized)) return true;
  try {
    const store = readForgeAccessStore();
    return (store.adminEmails || []).includes(normalized);
  } catch {
    return false;
  }
}

function buildSeatsList(store) {
  const seats = [];
  const adminSet = new Set([...(store.adminEmails || []), ...developerEmails]);
  for (const email of developerEmails) {
    seats.push({
      email,
      role: 'developer',
      plan: null,
      credits: 999999,
      isAdmin: true,
      label: 'Developer · admin panel · unlimited credits',
      revocable: false
    });
  }
  for (const email of store.developerEmails || []) {
    if (isSystemDeveloper(email)) continue;
    seats.push({
      email,
      role: 'developer',
      plan: null,
      credits: 999999,
      isAdmin: adminSet.has(email),
      label: 'Developer · admin panel · unlimited credits',
      revocable: true
    });
  }
  for (const email of store.allowedEmails || []) {
    if (isSystemDeveloper(email) || (store.developerEmails || []).includes(email)) continue;
    const meta = store.clientMeta?.[email] || {
      plan: 'forge_bundle',
      credits: FORGE_BUNDLE_CREDITS,
      purchases: 1
    };
    const credits = Number.isFinite(meta.credits) ? meta.credits : defaultCreditsForPlan(meta.plan);
    const purchases = Number.isFinite(meta.purchases) ? meta.purchases : 1;
    seats.push({
      email,
      role: 'client',
      plan: meta.plan || 'forge_bundle',
      credits,
      purchases,
      isAdmin: false,
      label: `Paid · ${planLabel(meta.plan)} · ${credits} credits${purchases > 1 ? ` · ${purchases} packs` : ''}`,
      revocable: true
    });
  }
  return seats.sort((a, b) => a.email.localeCompare(b.email));
}

function getForgeAccessPayload(email = '', includeSeats = false) {
  const normalizedEmail = `${email}`.toLowerCase();
  const store = readForgeAccessStore();
  const isDeveloper =
    isSystemDeveloper(normalizedEmail) ||
    (store.developerEmails || []).includes(normalizedEmail);
  const isAdmin =
    isSystemDeveloper(normalizedEmail) ||
    (store.adminEmails || []).includes(normalizedEmail);
  const isClient = (store.allowedEmails || []).includes(normalizedEmail);
  const hasAccess = isDeveloper || isClient;
  const clientCredits = store.clientMeta?.[normalizedEmail]?.credits;
  const payload = {
    email: normalizedEmail,
    hasAccess,
    isDeveloper,
    isAdmin,
    role: isDeveloper ? 'developer' : isClient ? 'client' : 'none',
    plan: isClient ? store.clientMeta?.[normalizedEmail]?.plan || 'forge_bundle' : null,
    credits: isDeveloper
      ? 999999
      : isClient
        ? Number.isFinite(clientCredits)
          ? clientCredits
          : defaultCreditsForPlan(store.clientMeta?.[normalizedEmail]?.plan)
        : 0
  };
  if (includeSeats) {
    payload.seats = buildSeatsList(store);
    payload.adminEmails = Array.from(
      new Set([...developerEmails, ...(store.adminEmails || [])])
    ).sort();
    payload.allowedEmails = Array.from(
      new Set([
        ...developerEmails,
        ...(store.developerEmails || []),
        ...(store.allowedEmails || [])
      ])
    ).sort();
  }
  return payload;
}

// Hostinger business email (hello@versecuretech.com) — credentials via .env
const smtpUser = process.env.SMTP_USER || 'hello@versecuretech.com';
const smtpPass = process.env.SMTP_PASS || '';
const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpSecure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === 'true'
  : smtpPort === 465;
const contactFrom = process.env.CONTACT_FROM || `"Versecure Tech" <${smtpUser}>`;
const contactNotifyTo =
  process.env.CONTACT_NOTIFY_TO ||
  'hello@versecuretech.com,azeem.makhdum6@gmail.com,abbas585@gmail.com';

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: smtpPass
    ? {
        user: smtpUser,
        pass: smtpPass
      }
    : undefined
});

if (!smtpPass) {
  console.warn(
    'SMTP_PASS is not set. Contact form emails will fail until you add your Hostinger mailbox password to .env'
  );
}

// Routing for the Contact Form
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, service, message, company, preferredTime } = req.body;

  if (!smtpPass) {
    return res.status(500).json({
      error: 'Email is not configured. Set SMTP_PASS for hello@versecuretech.com in .env'
    });
  }

  try {
    // 1. Inbox alert to business email (+ optional team notify list)
    await transporter.sendMail({
      from: contactFrom,
      to: contactNotifyTo,
      replyTo: email,
      subject: `New Lead: ${firstName} ${lastName} - ${service}`,
      html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050505; color: #ffffff; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border-radius: 20px; border: 1px solid #1a1a1a; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
            <div style="padding: 24px; border-bottom: 1px solid #1a1a1a; background: linear-gradient(180deg, #111 0%, #0a0a0a 100%); text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.02em;">Versecure<span style="color: #3b82f6;">.</span> <span style="font-weight: 300; color: #666;">PRIORITY</span></h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #3b82f6; margin-bottom: 24px;">New Lead Captured</h2>
              
              <div style="margin-bottom: 32px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">Client Details</p>
                <p style="margin: 0; font-size: 16px; color: #fff;"><strong>${firstName} ${lastName}</strong> <span style="color: #6b7280; font-size: 14px;">(${email})</span></p>
              </div>

              <div style="margin-bottom: 32px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">Service Vertical</p>
                <p style="margin: 0; font-size: 16px; color: #fff;">${service}</p>
              </div>

              ${company ? `
              <div style="margin-bottom: 32px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">Company</p>
                <p style="margin: 0; font-size: 16px; color: #fff;">${company}</p>
              </div>` : ''}

              ${preferredTime ? `
              <div style="margin-bottom: 32px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">Preferred Time</p>
                <p style="margin: 0; font-size: 16px; color: #fff;">${preferredTime}</p>
              </div>` : ''}

              <div style="margin-bottom: 32px; padding: 24px; background-color: #111; border-radius: 12px; border: 1px solid #1a1a1a;">
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">Message Brief</p>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #d1d5db; font-style: italic;">"${message}"</p>
              </div>

              <a href="mailto:${email}" style="display: inline-block; padding: 12px 24px; background-color: #fff; color: #000; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; transition: all 0.2s;">Reply Instantly</a>
            </div>
            <div style="padding: 20px; background-color: #050505; border-top: 1px solid #1a1a1a; text-align: center;">
              <p style="margin: 0; font-size: 10px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.1em;">Delivered via ${smtpUser} &bull; Versecure Tech</p>
            </div>
          </div>
        </div>
      `
    });

    // 2. Confirmation to the visitor (sent from business email)
    await transporter.sendMail({
      from: contactFrom,
      to: email,
      replyTo: smtpUser,
      subject: `We received your request, ${firstName}`,
      html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050505; color: #ffffff; padding: 60px 20px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border-radius: 20px; border: 1px solid #1a1a1a; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); text-align: left;">
            <div style="padding: 40px; border-bottom: 1px solid #1a1a1a; background: linear-gradient(180deg, #111 0%, #0a0a0a 100%); text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: #fff;">Versecure<span style="color: #3b82f6;">.</span></h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #f3f4f6;">Hello ${firstName},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px;">
                We’ve received your inquiry regarding <span style="color: #fff; font-weight: 500;">${service}</span>. Our team is currently reviewing the details to ensure we provide the most strategic response.
              </p>
              <div style="padding: 24px; background-color: #111; border-radius: 12px; border: 1px solid #1a1a1a; margin-bottom: 32px;">
                <h3 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #4b5563;">Your Request</h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #d1d5db; font-style: italic;">"${message}"</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 40px;">
                Expect a follow-up from one of our engineers within the next 24 hours. We’re excited to explore how Versecure can elevate your technical execution.
              </p>
              <div style="padding-top: 32px; border-top: 1px solid #1a1a1a;">
                <p style="margin: 0; font-size: 14px; color: #9ca3af;">Best regards,</p>
                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #fff;">The Versecure Engineering Team</p>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #6b7280;">${smtpUser}</p>
              </div>
            </div>
            <div style="padding: 24px; background-color: #050505; border-top: 1px solid #1a1a1a; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">
                &copy; ${new Date().getFullYear()} Versecure Tech &bull; Staff-Level Engineering Partners
              </p>
            </div>
          </div>
        </div>
      `
    });
    console.log(`Contact emails sent via ${smtpUser}`);
    res.json({ success: true });
  } catch (e) {
    console.error("Email send failed:", e);
    res.status(500).json({ error: "Email delivery failed" });
  }
});

app.get('/api/forge/access', (req, res) => {
  const email = typeof req.query.email === 'string' ? req.query.email : '';
  return res.json(getForgeAccessPayload(email));
});

app.post('/api/admin/upgrade-session', (req, res) => {
  const email = `${req.body?.email || ''}`.toLowerCase();
  if (!isAdminEmail(email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return res.json({ credits: 999999, unlimited: true });
});

app.get('/api/admin/forge-access', async (req, res) => {
  const auth = await resolveRequestUser(req, { emailHints: [req.query?.adminEmail] });
  if (!auth.ok) return res.status(auth.status || 401).json({ error: auth.error });
  if (!isAdminEmail(auth.email)) return res.status(403).json({ error: 'Admin access required' });
  return res.json(getForgeAccessPayload(auth.email, true));
});

app.post('/api/admin/forge-access/grant', async (req, res) => {
  try {
  const auth = await resolveRequestUser(req, { emailHints: [req.body?.adminEmail] });
  if (!auth.ok) return res.status(auth.status || 401).json({ error: auth.error });
  const adminEmail = auth.email;
  const targetEmail = `${req.body?.email || ''}`.toLowerCase().trim();
  const role = `${req.body?.role || 'client'}`.toLowerCase();
  let plan = `${req.body?.plan || 'forge_bundle'}`.toLowerCase();
  if (plan !== 'enterprise' && plan !== 'forge_bundle') plan = 'forge_bundle';
  const packDefault = defaultCreditsForPlan(plan);
  const creditsRaw = Number(req.body?.credits);
  const packCredits = Number.isFinite(creditsRaw) && creditsRaw > 0 ? Math.floor(creditsRaw) : packDefault;

  if (!isAdminEmail(adminEmail)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  if (role !== 'developer' && role !== 'client') {
    return res.status(400).json({ error: 'Role must be developer or client' });
  }
  if (isSystemDeveloper(targetEmail)) {
    return res.status(400).json({ error: 'System developers already have unlimited access' });
  }

  const store = readForgeAccessStore();
  store.developerEmails = store.developerEmails || [];
  store.allowedEmails = store.allowedEmails || [];
  store.adminEmails = store.adminEmails || [];
  store.clientMeta = store.clientMeta || {};

  let grantResult = { refilled: false, added: 0, credits: 0, purchases: 0, plan: null };

  if (role === 'developer') {
    // Developer = Forge unlimited + Admin panel access
    store.developerEmails = Array.from(new Set([...store.developerEmails, targetEmail])).sort();
    store.adminEmails = Array.from(new Set([...store.adminEmails, targetEmail])).sort();
    store.allowedEmails = store.allowedEmails.filter((email) => email !== targetEmail);
    delete store.clientMeta[targetEmail];
    grantResult = {
      refilled: false,
      added: 0,
      credits: 999999,
      purchases: 0,
      plan: null,
      role: 'developer',
      isAdmin: true
    };
  } else {
    store.allowedEmails = Array.from(new Set([...store.allowedEmails, targetEmail])).sort();
    store.developerEmails = store.developerEmails.filter((email) => email !== targetEmail);
    store.adminEmails = store.adminEmails.filter((email) => email !== targetEmail);

    const existing = store.clientMeta[targetEmail];
    const prevCredits = Number.isFinite(existing?.credits) ? existing.credits : 0;
    const prevPurchases = Number.isFinite(existing?.purchases) ? existing.purchases : 0;
    // Re-grant / repurchase = refill by adding another pack onto remaining balance
    const refilled = !!existing;
    const nextCredits = refilled ? prevCredits + packCredits : packCredits;
    const nextPurchases = prevPurchases + 1;

    store.clientMeta[targetEmail] = {
      plan,
      credits: nextCredits,
      purchases: nextPurchases,
      lastPackCredits: packCredits,
      updatedAt: new Date().toISOString()
    };

    grantResult = {
      role: 'client',
      plan,
      refilled,
      added: packCredits,
      credits: nextCredits,
      purchases: nextPurchases,
      isAdmin: false
    };
  }

  writeForgeAccessStore(store);
  const payload = getForgeAccessPayload(adminEmail, true);
  payload.grant = grantResult;
  return res.json(payload);
  } catch (error) {
    console.error('Forge grant failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to grant Forge access' });
  }
});

app.post('/api/admin/forge-access/revoke', async (req, res) => {
  const auth = await resolveRequestUser(req, { emailHints: [req.body?.adminEmail] });
  if (!auth.ok) return res.status(auth.status || 401).json({ error: auth.error });
  const adminEmail = auth.email;
  const targetEmail = `${req.body?.email || ''}`.toLowerCase().trim();
  if (!isAdminEmail(adminEmail)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (isSystemDeveloper(targetEmail)) {
    return res.status(400).json({ error: 'System developer access cannot be revoked' });
  }
  const store = readForgeAccessStore();
  store.allowedEmails = (store.allowedEmails || []).filter((email) => email !== targetEmail);
  store.developerEmails = (store.developerEmails || []).filter((email) => email !== targetEmail);
  store.adminEmails = (store.adminEmails || []).filter((email) => email !== targetEmail);
  if (store.clientMeta) delete store.clientMeta[targetEmail];
  writeForgeAccessStore(store);
  return res.json(getForgeAccessPayload(adminEmail, true));
});

app.get('/api/admin/panel-access', async (req, res) => {
  const auth = await resolveRequestUser(req, { emailHints: [req.query?.email] });
  if (!auth.ok) return res.status(auth.status || 401).json({ error: auth.error });
  return res.json({
    email: auth.email,
    isAdmin: isAdminEmail(auth.email),
    isSystemAdmin: isSystemDeveloper(auth.email),
    authMode: auth.strict ? 'jwt' : 'relaxed'
  });
});


app.get('/api/health', async (_req, res) => {
  let supabaseOk = false;
  let storageMode = 'local-disk';
  try {
    if (portalStore.backend && String(portalStore.backend).includes('supabase')) {
      supabaseOk = true;
      storageMode = 'supabase+local-fallback';
    }
  } catch {}
  res.json({
    ok: true,
    time: new Date().toISOString(),
    portalBackend: portalStore.backend,
    authConfigured: supabaseAuthConfigured(),
    authStrict: strictAuthRequired(),
    supabaseOk,
    storageMode,
    smtpConfigured: !!smtpPass
  });
});

// --- Client portal: projects + priority support tickets ---
let portalIo = null;
function emitPortalUpdate(payload = {}) {
  if (portalIo) portalIo.emit('portal:update', payload);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, portalStore.uploadsDir),
    filename: (_req, file, cb) => {
      const safe = String(file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
      cb(null, `${Date.now()}-${randomUUID().slice(0, 8)}-${safe}`);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^(image\/|application\/pdf|text\/plain|application\/zip)/.test(file.mimetype || '');
    cb(ok ? null : new Error('Only images, PDF, text, or zip allowed'), ok);
  }
});

async function sendTicketMail({ to, subject, text, html, replyTo }) {
  if (!smtpPass || !to) return;
  try {
    await transporter.sendMail({ from: contactFrom, to, subject, text, html, replyTo });
  } catch (error) {
    console.warn('Portal mail failed:', error.message);
  }
}

async function resolveUploadUrl(file) {
  const localUrl = `/uploads/portal/${file.filename}`;
  try {
    const cloudUrl = await uploadFileToStorage(file.path, {
      fileName: file.originalname,
      mimeType: file.mimetype
    });
    return cloudUrl || localUrl;
  } catch {
    return localUrl;
  }
}

app.get('/api/portal/meta', (_req, res) => {
  res.json({ backend: portalStore.backend, statuses: [...PROJECT_STATUSES], ticketStatuses: [...TICKET_STATUSES] });
});


async function clientHasActiveService(email) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) return false;
  if (isAdminEmail(normalized)) return true;
  const projects = await portalStore.listProjects(normalized);
  return projects.length > 0;
}

async function requirePortalClient(req) {
  const requested = normalizeEmail(req.body?.email || req.query?.email);
  const auth = await requireMatchingUser(req, requested);
  if (!auth.ok) return auth;
  return { ...auth, email: auth.email };
}

async function requirePortalAdmin(req) {
  const requested = normalizeEmail(req.body?.adminEmail || req.query?.adminEmail);
  const auth = await resolveRequestUser(req, { emailHints: [requested] });
  if (!auth.ok) return auth;
  if (!isAdminEmail(auth.email)) {
    return { ok: false, status: 403, error: 'Admin access required' };
  }
  if (requested && requested !== auth.email) {
    return { ok: false, status: 403, error: 'Admin session does not match adminEmail' };
  }
  return auth;
}

app.get('/api/portal/projects', async (req, res) => {
  try {
    const auth = await requirePortalClient(req);
    if (!auth.ok) return res.status(auth.status || 401).json({ error: auth.error });
    const projects = await portalStore.listProjects(auth.email);
    const canUseTickets = projects.length > 0 || isAdminEmail(auth.email);
    return res.json({ projects, canUseTickets, authMode: auth.strict ? 'jwt' : 'relaxed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load projects' });
  }
});

app.get('/api/portal/tickets', async (req, res) => {
  try {
    const auth = await requirePortalClient(req);
    if (!auth.ok) return res.status(auth.status || 401).json({ error: auth.error });
    const canUseTickets = await clientHasActiveService(auth.email);
    const tickets = canUseTickets ? await portalStore.listTickets(auth.email) : [];
    return res.json({ tickets, canUseTickets, authMode: auth.strict ? 'jwt' : 'relaxed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load tickets' });
  }
});

app.post('/api/portal/tickets', async (req, res) => {
  try {
    const auth = await requirePortalClient(req);
    if (!auth.ok) return res.status(auth.status || 401).json({ error: auth.error });
    const email = auth.email;
    if (!(await clientHasActiveService(email))) {
      return res.status(403).json({
        error: 'Support tickets unlock after we assign you a service project. Use Contact for first inquiries.'
      });
    }
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    const priority = String(req.body?.priority || 'normal').toLowerCase();
    const result = await portalStore.createTicket({ email, subject, message, priority });
    const ticket = result.ticket;

    await sendTicketMail({
      to: contactNotifyTo,
      replyTo: email,
      subject: `[Priority Support] ${ticket.subject}`,
      text: `New support ticket from ${email}\nPriority: ${ticket.priority}\n\n${message}\n\nTicket ID: ${ticket.id}`,
      html: `<div style="font-family:sans-serif;line-height:1.5"><h2>Priority Support Ticket</h2><p><strong>From:</strong> ${email}</p><p><strong>Priority:</strong> ${ticket.priority}</p><p><strong>Subject:</strong> ${ticket.subject}</p><p style="white-space:pre-wrap">${message.replace(/</g,'&lt;')}</p><p style="color:#666;font-size:12px">Ticket ID: ${ticket.id}</p></div>`
    });

    emitPortalUpdate({ type: 'ticket_created', ticketId: ticket.id, clientEmail: email });
    return res.json({ success: true, ticket, tickets: result.tickets, canUseTickets: true });
  } catch (error) {
    console.error('Create ticket failed:', error);
    return res.status(400).json({ error: error.message || 'Failed to create ticket' });
  }
});

app.post('/api/portal/tickets/:id/messages', async (req, res) => {
  try {
    const auth = await requirePortalClient(req);
    if (!auth.ok) return res.status(auth.status || 401).json({ error: auth.error });
    const email = auth.email;
    const body = String(req.body?.body || '').trim();
    if (!body) return res.status(400).json({ error: 'Message required' });
    if (!(await clientHasActiveService(email))) {
      return res.status(403).json({ error: 'Support messaging is only available for active service clients.' });
    }
    const result = await portalStore.addTicketMessage({
      ticketId: req.params.id,
      authorEmail: email,
      authorRole: 'client',
      body
    });
    if (normalizeEmail(result.ticket.clientEmail) !== email) {
      return res.status(403).json({ error: 'Not your ticket' });
    }
    await sendTicketMail({
      to: contactNotifyTo,
      replyTo: email,
      subject: `[Ticket Reply] ${result.ticket.subject}`,
      text: `Client reply from ${email}\n\n${body}\n\nTicket ID: ${result.ticket.id}`,
      html: `<div style="font-family:sans-serif"><h2>Client Ticket Reply</h2><p><strong>From:</strong> ${email}</p><p style="white-space:pre-wrap">${body.replace(/</g,'&lt;')}</p></div>`
    });
    emitPortalUpdate({ type: 'ticket_message', ticketId: result.ticket.id, clientEmail: email });
    return res.json({ success: true, ticket: result.ticket, tickets: result.tickets });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Failed to add message' });
  }
});

app.post('/api/portal/tickets/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    const auth = await requirePortalClient(req);
    if (!auth.ok) return res.status(auth.status || 401).json({ error: auth.error });
    const email = auth.email;
    if (!(await clientHasActiveService(email))) {
      return res.status(403).json({ error: 'Support uploads are only available for active service clients.' });
    }
    if (!req.file) return res.status(400).json({ error: 'File required' });
    const tickets = await portalStore.listTickets(email);
    const owned = tickets.find((t) => t.id === req.params.id);
    if (!owned) return res.status(404).json({ error: 'Ticket not found' });
    const url = await resolveUploadUrl(req.file);
    const result = await portalStore.addAttachment({
      ticketId: req.params.id,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      byteSize: req.file.size,
      url,
      uploadedBy: email
    });
    emitPortalUpdate({ type: 'ticket_attachment', ticketId: req.params.id, clientEmail: email });
    return res.json({ success: true, attachment: result.attachment, ticket: result.ticket, tickets: result.tickets });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Upload failed' });
  }
});

app.get('/api/admin/portal/projects', async (req, res) => {
  const auth = await requirePortalAdmin(req);
  if (!auth.ok) return res.status(auth.status || 403).json({ error: auth.error });
  try {
    return res.json({ projects: await portalStore.listProjects() });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load projects' });
  }
});

app.post('/api/admin/portal/projects', async (req, res) => {
  try {
    const auth = await requirePortalAdmin(req);
    if (!auth.ok) return res.status(auth.status || 403).json({ error: auth.error });
    const isNew = !String(req.body?.id || '').trim();
    let previous = null;
    if (!isNew) {
      const all = await portalStore.listProjects();
      previous = all.find((p) => p.id === String(req.body.id).trim()) || null;
    }
    const result = await portalStore.saveProject({ ...req.body, adminEmail: auth.email });
    const project = result.project;

    const statusChanged = previous && (previous.status !== project.status || Number(previous.progress) !== Number(project.progress));
    if (isNew) {
      await sendTicketMail({
        to: project.clientEmail,
        subject: `Your project is live: ${project.title}`,
        text: `Hi,\n\nWe assigned a project to your Versecure client portal.\n\nProject: ${project.title}\nStatus: ${project.status}\nProgress: ${project.progress}%\n\nSign in to your portal to track progress and open support tickets.\n\n— Versecure Tech`,
        html: `<div style="font-family:sans-serif;line-height:1.5"><h2>Your project is live</h2><p><strong>${project.title}</strong></p><p>Status: ${project.status}<br/>Progress: ${project.progress}%</p><p>Sign in to your portal to track progress. Priority support tickets are now unlocked for your account.</p><p style="color:#666">— Versecure Tech</p></div>`
      });
    } else if (statusChanged) {
      await sendTicketMail({
        to: project.clientEmail,
        subject: `Project update: ${project.title}`,
        text: `Hi,\n\nYour project was updated.\n\nProject: ${project.title}\nStatus: ${project.status}\nProgress: ${project.progress}%\n\n— Versecure Tech`,
        html: `<div style="font-family:sans-serif;line-height:1.5"><h2>Project update</h2><p><strong>${project.title}</strong></p><p>Status: ${project.status}<br/>Progress: ${project.progress}%</p><p style="color:#666">— Versecure Tech</p></div>`
      });
    }

    emitPortalUpdate({ type: 'project_saved', clientEmail: project.clientEmail, projectId: project.id });
    return res.json({ success: true, project, projects: result.projects, created: isNew });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Failed to save project' });
  }
});

app.post('/api/admin/portal/projects/delete', async (req, res) => {
  try {
    const auth = await requirePortalAdmin(req);
    if (!auth.ok) return res.status(auth.status || 403).json({ error: auth.error });
    const result = await portalStore.deleteProject(String(req.body?.id || '').trim());
    emitPortalUpdate({ type: 'project_deleted' });
    return res.json({ success: true, projects: result.projects });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Failed to delete project' });
  }
});

app.get('/api/admin/portal/tickets', async (req, res) => {
  const auth = await requirePortalAdmin(req);
  if (!auth.ok) return res.status(auth.status || 403).json({ error: auth.error });
  try {
    let tickets = await portalStore.listTickets();
    const status = String(req.query.status || '').toLowerCase();
    const q = String(req.query.q || '').toLowerCase().trim();
    if (status && TICKET_STATUSES.has(status)) tickets = tickets.filter((t) => t.status === status);
    if (q) {
      tickets = tickets.filter((t) =>
        t.clientEmail.includes(q) || t.subject.toLowerCase().includes(q) || String(t.message || '').toLowerCase().includes(q)
      );
    }
    return res.json({ tickets });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load tickets' });
  }
});

app.post('/api/admin/portal/tickets', async (req, res) => {
  try {
    const auth = await requirePortalAdmin(req);
    if (!auth.ok) return res.status(auth.status || 403).json({ error: auth.error });
    const adminEmail = auth.email;
    const id = String(req.body?.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Ticket id required' });

    const status = req.body?.status != null ? String(req.body.status).toLowerCase() : undefined;
    const adminReply = req.body?.adminReply != null ? String(req.body.adminReply).trim() : '';
    const result = await portalStore.addTicketMessage({
      ticketId: id,
      authorEmail: adminEmail,
      authorRole: 'admin',
      body: adminReply,
      status
    });

    if (adminReply) {
      await sendTicketMail({
        to: result.ticket.clientEmail,
        subject: `Update on your support ticket: ${result.ticket.subject}`,
        text: `Hi,\n\nOur team replied to your ticket:\n\n${adminReply}\n\nStatus: ${result.ticket.status}\n\n— Versecure Tech`,
        html: `<div style="font-family:sans-serif;line-height:1.5"><h2>Ticket update</h2><p>Our team replied to <strong>${result.ticket.subject}</strong>.</p><p style="white-space:pre-wrap">${adminReply.replace(/</g,'&lt;')}</p><p>Status: ${result.ticket.status}</p><p style="color:#666">— Versecure Tech</p></div>`
      });
    } else if (status) {
      await sendTicketMail({
        to: result.ticket.clientEmail,
        subject: `Ticket status updated: ${result.ticket.subject}`,
        text: `Your ticket status is now: ${result.ticket.status}`,
        html: `<div style="font-family:sans-serif"><p>Your ticket <strong>${result.ticket.subject}</strong> is now <strong>${result.ticket.status}</strong>.</p></div>`
      });
    }

    emitPortalUpdate({ type: 'ticket_updated', ticketId: id, clientEmail: result.ticket.clientEmail });
    return res.json({ success: true, ticket: result.ticket, tickets: result.tickets });
  } catch (error) {
    console.error('Update ticket failed:', error);
    return res.status(400).json({ error: error.message || 'Failed to update ticket' });
  }
});

app.post('/api/admin/portal/tickets/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    const auth = await requirePortalAdmin(req);
    if (!auth.ok) return res.status(auth.status || 403).json({ error: auth.error });
    if (!req.file) return res.status(400).json({ error: 'File required' });
    const url = await resolveUploadUrl(req.file);
    const result = await portalStore.addAttachment({
      ticketId: req.params.id,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      byteSize: req.file.size,
      url,
      uploadedBy: auth.email
    });
    emitPortalUpdate({ type: 'ticket_attachment', ticketId: req.params.id, clientEmail: result.ticket?.clientEmail });
    return res.json({ success: true, attachment: result.attachment, ticket: result.ticket, tickets: result.tickets });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Upload failed' });
  }
});

async function researchWeb(query) {
  const cleanQuery = `${query || ''}`.replace(/\s+/g, ' ').trim().slice(0, 180);
  if (!cleanQuery) return '';
  try {
    const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 ForgeAIResearch/1.0' }
    });
    const html = await response.text();
    const results = [];
    const pattern = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = pattern.exec(html)) && results.length < 5) {
      results.push({
        title: match[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim(),
        url: match[1].replace(/&amp;/g, '&'),
        snippet: match[3].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()
      });
    }
    if (results.length === 0) return '';
    return results.map((result, index) => `${index + 1}. ${result.title}\n${result.snippet}\n${result.url}`).join('\n\n');
  } catch (error) {
    console.warn('Forge web research failed:', error.message);
    return '';
  }
}

// Secure Forge AI Proxy (Supports Groq, xAI/Grok, and Gemini)
app.post('/api/forge', async (req, res) => {
  try {
    const history = Array.isArray(req.body.history) ? req.body.history : [];
    const prompt = typeof req.body.prompt === 'string' ? req.body.prompt : '';
    const workspaceFiles = Array.isArray(req.body.workspaceFiles) ? req.body.workspaceFiles : [];
    const attachedFiles = Array.isArray(req.body.attachedFiles) ? req.body.attachedFiles : [];
    const context = req.body.context || {};
    const callerEmail = `${req.body.email || context.email || ''}`.toLowerCase().trim();
    const access = getForgeAccessPayload(callerEmail);
    if (!callerEmail || !access.hasAccess) {
      return res.status(403).json({ error: 'Forge access required' });
    }
    const normalizedHistory = normalizeConversationHistory(history, 12);
    const userText = prompt || req.body.contents?.flatMap((c) => c.parts)?.map((p) => p.text)?.join('\n') || '';
    const shouldResearch = /\b(research|internet|web|latest|current|trends?|competitors?|inspiration|benchmark)\b/i.test(userText);
    const researchContext = shouldResearch ? await researchWeb(userText) : '';
    const enrichedPrompt = buildForgeContextPayload({
      prompt: userText,
      systemPrompt: context.systemPrompt || '',
      projectSummary: [context.projectSummary, context.projectBrief, context.workflowSummary].filter(Boolean).join('\n\n'),
      conversationSummary: context.conversationSummary || '',
      recentMessages: context.recentMessages || [],
      workspaceFiles,
      currentFileTree: context.currentFileTree || [],
      selectedFile: context.selectedFile || null,
      pendingTasks: context.pendingTasks || [],
      recentEdits: [...(context.recentEdits || []), ...(context.repairHistory || [])],
      openTabs: context.openTabs || [],
      currentUserPrompt: userText
    });
    const promptWithResearch = researchContext
      ? `${enrichedPrompt}\n\nWEB RESEARCH CONTEXT:\n${researchContext}\n\nUse this research only as inspiration and cite no raw URLs in user-facing chat unless useful.`
      : enrichedPrompt;
    const combinedHistory = normalizedHistory.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n');
    
    console.log("AI Proxy: Received Request");
    console.log("User prompt length:", userText ? userText.length : 0);
    console.log("History length:", normalizedHistory.length);

    const systemInstruction = `You are Forge AI, an autonomous product builder for modern web applications.
Maintain persistent project memory across the conversation and never treat the request as a blank slate.
Before editing, understand the current project architecture, generated files, dependencies, routes, and recent changes.
Prefer targeted updates to existing files over regenerating entire projects.

CRITICAL — INTENT DETECTION:
First, classify the user's message intent before responding:
- If the message is a GREETING, SMALL TALK, or CASUAL CONVERSATION (e.g. "hi", "hello", "how are you", "what can you do", "thanks", "cool", "ok"), respond with a short, friendly conversational text reply. Do NOT generate files. Return JSON like: {"message":"Your friendly reply here","files":[],"routes":[]}
- If the message is a QUESTION about Forge AI's capabilities or how to use it, answer it conversationally in the "message" field. Return JSON like: {"message":"Your answer here","files":[],"routes":[]}
- Only generate files when the user clearly requests a website, app, page, feature, component, or improvement.

When the user asks for a feature, component, or UI update, create or update the relevant files directly.
When the user asks for a new project, create a coherent project structure and preserve the conversation context.
When the user asks to make the site more advanced, upgrade, improve, redesign, modernize, or make it premium, treat it as an in-place project enhancement. Preserve the current structure and return structured project changes or file operations rather than a chat-only explanation.
Quality standard: aim for premium builder output comparable to Lovable/Bolt/Replit-style demos. Prioritize a cohesive design system, strong typography, responsive layouts, meaningful content, accessible markup, SEO basics, polished micro-interactions, complete navigation, and obvious visible improvements on enhancement requests.
Return only valid JSON. For project changes, return this shape whenever possible:
{"message":"short user-facing summary","files":[{"path":"index.html","content":"..."}],"routes":[{"path":"index.html","title":"Home"},{"path":"about.html","title":"About"}],"warnings":[],"projectSummary":"...","conversationSummary":"...","pendingTasks":[],"completedTasks":[]}
For multi-page sites, every internal navigation link must point to a generated HTML file. Prefer simple static paths like index.html, about.html, services.html, contact.html.
Never create placeholder, empty, TODO, coming soon, or stub pages. If navigation references a route, build the real page with complete content and matching design. Never claim a project is multi-page unless all linked pages are included and complete.
If you modify files, prefer operations like {"type":"update","path":"index.html","content":"..."} or {"type":"create","path":"about.html","content":"..."}.`;

    // 1. Resolve Provider, API Key, and Model
    let provider = 'gemini'; // default fallback
    let apiKey = process.env.GEMINI_API_KEY;
    let model = 'gemini-1.5-flash-latest';

    // Check if Groq is explicitly configured
    if (process.env.GROQ_API_KEY && 
        process.env.GROQ_API_KEY !== 'gsk_your_groq_api_key_here' && 
        process.env.GROQ_API_KEY.trim() !== '') {
      provider = 'groq';
      apiKey = process.env.GROQ_API_KEY;
      model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    } 
    // Check if xAI / Grok is explicitly configured
    else if (process.env.XAI_API_KEY && process.env.XAI_API_KEY.trim() !== '') {
      provider = 'xai';
      apiKey = process.env.XAI_API_KEY;
      model = process.env.XAI_MODEL || 'grok-4.3';
    }

    // Check if FORGE_API_KEY is defined as a general override key
    const overrideKey = process.env.FORGE_API_KEY;
    if (overrideKey && overrideKey.trim() !== '') {
      const trimmedKey = overrideKey.trim();
      apiKey = trimmedKey;
      if (trimmedKey.startsWith('gsk_')) {
        provider = 'groq';
        model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      } else if (trimmedKey.startsWith('xai-')) {
        provider = 'xai';
        model = process.env.XAI_MODEL || 'grok-4.3';
      } else if (trimmedKey.startsWith('AIzaSy')) {
        provider = 'gemini';
        model = 'gemini-1.5-flash-latest';
      } else {
        // Unknown format, guess provider based on defined model envs or fallback to groq
        if (process.env.GROQ_MODEL) {
          provider = 'groq';
          model = process.env.GROQ_MODEL;
        } else if (process.env.XAI_MODEL) {
          provider = 'xai';
          model = process.env.XAI_MODEL;
        }
      }
    }

    console.log(`AI Proxy resolved provider: ${provider}, model: ${model}`);

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_') || apiKey.includes('xxxxxxxxxxxxx')) {
      console.error(`AI Proxy Error: API Key for provider '${provider}' is missing or placeholder.`);
      return res.status(500).json({ 
        error: `AI Service Not Configured. Please set the correct API key for '${provider}' in your environment variables / .env file.` 
      });
    }

    let generatedText = '';

    if (provider === 'gemini') {
      console.log("AI Proxy: Generating via @google/genai SDK...");
      const ai = new GoogleGenAI({ apiKey });
      const conversation = [combinedHistory, promptWithResearch].filter(Boolean).join('\n\n');
      const response = await ai.models.generateContent({
        model: model,
        contents: conversation || userText,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      generatedText = response.text || '';
    } else if (provider === 'groq') {
      console.log(`AI Proxy: Generating via Groq API (${model})...`);
      const messages = buildChatMessages({
        history,
        prompt: promptWithResearch,
        systemInstruction,
        provider
      });
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages,
          response_format: { type: "json_object" },
          max_tokens: 12000,
          temperature: 0.55
        })
      });

      console.log("Groq API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Groq API Full Error:", errorData);
        return res.status(response.status).json({ error: `Groq API error: ${response.status} - ${errorData}` });
      }

      const data = await response.json();
      generatedText = data.choices?.[0]?.message?.content || '';
    } else if (provider === 'xai') {
      console.log(`AI Proxy: Generating via xAI Grok API (${model})...`);
      const messages = buildChatMessages({
        history,
        prompt: promptWithResearch,
        systemInstruction,
        provider
      });
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages,
          response_format: { type: "json_object" },
          max_tokens: 12000,
          temperature: 0.55
        })
      });

      console.log("xAI API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("xAI API Full Error:", errorData);
        return res.status(response.status).json({ error: `xAI API error: ${response.status} - ${errorData}` });
      }

      const data = await response.json();
      generatedText = data.choices?.[0]?.message?.content || '';
    }

    console.log("AI Proxy: Success. Generated content length:", generatedText.length);
    
    return res.json({
      candidates: [{
        content: { parts: [{ text: generatedText }], role: 'model' }
      }]
    });

  } catch (error) {
    console.error("AI Proxy Critical Error:", error.message || error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({ error: error.message || "AI Service Unavailable" });
  }
});

// Serve email logo + other public assets at site root (needed for email <img> URLs)
app.use(express.static(join(__dirname, 'public'), {
  maxAge: '7d',
  setHeaders(res, filePath) {
    if (filePath.endsWith('email-logo.png')) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

// Serve the static Angular frontend (long-cache hashed assets; HTML stays fresh)
const browserPath = join(__dirname, 'dist', 'app', 'browser');
app.use(express.static(browserPath, {
  maxAge: '1y',
  immutable: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Send all other requests to index.html so Angular's router takes over
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(join(browserPath, 'index.html'));
});

const PORT = Number(process.env.PORT) || 4000;
const httpServer = createServer(app);
portalIo = new SocketServer(httpServer, {
  cors: { origin: true, credentials: true }
});
portalIo.on('connection', (socket) => {
  socket.on('portal:join', (email) => {
    const normalized = normalizeEmail(email);
    if (normalized) socket.join(`portal:${normalized}`);
  });
});

const server = httpServer.listen(PORT, () => {
  console.log('Versecure Standalone Server listening on port ' + PORT);
});

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Stop the other process, or set PORT to a free port.`
    );
  } else {
    console.error('Server failed to start:', error);
  }
  process.exit(1);
});
