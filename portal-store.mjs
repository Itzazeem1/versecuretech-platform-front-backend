import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const portalStorePath = join(__dirname, 'portal-data.json');
export const uploadsDir = join(__dirname, 'public', 'uploads', 'portal');

export const PROJECT_STATUSES = new Set(['queued', 'in_progress', 'review', 'done']);
export const TICKET_STATUSES = new Set(['open', 'in_progress', 'resolved', 'closed']);
export const TICKET_PRIORITIES = new Set(['normal', 'high', 'urgent']);

export function normalizeEmail(value = '') {
  return String(value || '').toLowerCase().trim();
}

export function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sortByUpdatedDesc(a, b) {
  return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''));
}

function decodeUtfBuffer(buf) {
  const looksUtf16Le =
    (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) ||
    (buf.length >= 4 && buf[0] === 0x7b && buf[1] === 0x00) ||
    (buf.length >= 4 && buf[1] === 0x00 && buf[3] === 0x00 && buf[0] !== 0x00);
  if (looksUtf16Le) {
    const text = (buf[0] === 0xff && buf[1] === 0xfe ? buf.slice(2) : buf).toString('utf16le');
    return { text: text.replace(/^\uFEFF/, '').trim(), needsUtf8Rewrite: true };
  }
  return { text: buf.toString('utf8').replace(/^\uFEFF/, '').trim(), needsUtf8Rewrite: false };
}

function defaultStore() {
  return { projects: [], tickets: [] };
}

function ensureUploadsDir() {
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
}

export function normalizeTicket(raw = {}) {
  const now = new Date().toISOString();
  const messages = Array.isArray(raw.messages) ? [...raw.messages] : [];
  if (!messages.length) {
    if (raw.message) {
      messages.push({
        id: randomUUID(),
        authorEmail: normalizeEmail(raw.clientEmail),
        authorRole: 'client',
        body: String(raw.message || ''),
        createdAt: raw.createdAt || now
      });
    }
    if (raw.adminReply) {
      messages.push({
        id: randomUUID(),
        authorEmail: 'admin',
        authorRole: 'admin',
        body: String(raw.adminReply || ''),
        createdAt: raw.updatedAt || now
      });
    }
  }
  const lastAdmin = [...messages].reverse().find((m) => m.authorRole === 'admin');
  const firstClient = messages.find((m) => m.authorRole === 'client');
  return {
    id: raw.id || randomUUID(),
    clientEmail: normalizeEmail(raw.clientEmail),
    subject: String(raw.subject || '').trim(),
    priority: TICKET_PRIORITIES.has(raw.priority) ? raw.priority : 'normal',
    status: TICKET_STATUSES.has(raw.status) ? raw.status : 'open',
    message: firstClient?.body || String(raw.message || ''),
    adminReply: lastAdmin?.body || String(raw.adminReply || ''),
    messages,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now
  };
}

function readJsonStore() {
  try {
    if (!existsSync(portalStorePath)) {
      const initial = defaultStore();
      writeJsonStore(initial);
      return initial;
    }
    const decoded = decodeUtfBuffer(readFileSync(portalStorePath));
    const parsed = JSON.parse(decoded.text || '{}');
    const store = {
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      tickets: (Array.isArray(parsed.tickets) ? parsed.tickets : []).map(normalizeTicket)
    };
    if (decoded.needsUtf8Rewrite) writeJsonStore(store);
    return store;
  } catch (error) {
    console.warn('Portal JSON store reset:', error.message);
    const empty = defaultStore();
    writeJsonStore(empty);
    return empty;
  }
}

function backupPortalStore() {
  try {
    if (!existsSync(portalStorePath)) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    writeFileSync(join(__dirname, `portal-data.backup.${stamp}.json`), readFileSync(portalStorePath));
  } catch (error) {
    console.warn('Portal backup failed:', error.message);
  }
}

function writeJsonStore(store) {
  backupPortalStore();
  const payload = JSON.stringify(
    {
      projects: Array.isArray(store.projects) ? store.projects : [],
      tickets: (Array.isArray(store.tickets) ? store.tickets : []).map(normalizeTicket)
    },
    null,
    2
  );
  writeFileSync(portalStorePath, Buffer.from(payload + '\n', 'utf8'));
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function mapProjectRow(row) {
  return {
    id: row.id,
    clientEmail: normalizeEmail(row.client_email || row.clientEmail),
    title: row.title,
    status: row.status,
    progress: Number(row.progress) || 0,
    notes: row.notes || '',
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

async function loadTicketBundle(sb, row) {
  const ticketId = row.id;
  const [{ data: messages }, { data: attachments }] = await Promise.all([
    sb.from('portal_ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }),
    sb.from('portal_attachments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true })
  ]);
  return normalizeTicket({
    id: row.id,
    clientEmail: row.client_email,
    subject: row.subject,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages: (messages || []).map((m) => ({
      id: m.id,
      authorEmail: m.author_email,
      authorRole: m.author_role,
      body: m.body,
      createdAt: m.created_at
    })),
    attachments: (attachments || []).map((a) => ({
      id: a.id,
      fileName: a.file_name,
      mimeType: a.mime_type,
      byteSize: a.byte_size,
      url: a.url,
      uploadedBy: a.uploaded_by,
      messageId: a.message_id,
      createdAt: a.created_at
    }))
  });
}


export async function uploadFileToStorage(localFilePath, { fileName, mimeType } = {}) {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  try {
    const buf = readFileSync(localFilePath);
    const safe = String(fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const objectPath = `${Date.now()}-${randomUUID().slice(0, 8)}-${safe}`;
    const { error } = await sb.storage.from('portal-uploads').upload(objectPath, buf, {
      contentType: mimeType || 'application/octet-stream',
      upsert: false
    });
    if (error) {
      console.warn('Supabase storage upload failed:', error.message);
      return null;
    }
    const { data } = sb.storage.from('portal-uploads').getPublicUrl(objectPath);
    return data?.publicUrl || null;
  } catch (error) {
    console.warn('Supabase storage upload error:', error.message);
    return null;
  }
}

export function createPortalStore() {
  ensureUploadsDir();
  const sb = getSupabaseAdmin();

  async function listProjects(clientEmail) {
    const email = normalizeEmail(clientEmail);
    if (sb) {
      try {
        let query = sb.from('portal_projects').select('*').order('updated_at', { ascending: false });
        if (email) query = query.eq('client_email', email);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(mapProjectRow);
      } catch (error) {
        console.warn('Supabase listProjects fallback:', error.message);
      }
    }
    const store = readJsonStore();
    const projects = [...store.projects].sort(sortByUpdatedDesc);
    return email ? projects.filter((p) => normalizeEmail(p.clientEmail) === email) : projects;
  }

  async function saveProject(input = {}) {
    const clientEmail = normalizeEmail(input.clientEmail);
    const title = String(input.title || '').trim().slice(0, 160);
    let status = String(input.status || 'queued').toLowerCase();
    if (!PROJECT_STATUSES.has(status)) status = 'queued';
    let progress = Number(input.progress);
    if (!Number.isFinite(progress)) progress = 0;
    progress = Math.max(0, Math.min(100, Math.round(progress)));
    const notes = String(input.notes || '').trim().slice(0, 4000);
    const id = String(input.id || '').trim();
    if (!isValidEmail(clientEmail)) throw new Error('Valid client email required');
    if (!title) throw new Error('Title required');
    const now = new Date().toISOString();

    if (sb) {
      try {
        const row = { client_email: clientEmail, title, status, progress, notes, updated_at: now };
        let data;
        if (id) {
          const res = await sb.from('portal_projects').update(row).eq('id', id).select('*').single();
          if (res.error) throw res.error;
          data = res.data;
        } else {
          const res = await sb.from('portal_projects').insert({ ...row, created_at: now }).select('*').single();
          if (res.error) throw res.error;
          data = res.data;
        }
        return { project: mapProjectRow(data), projects: await listProjects() };
      } catch (error) {
        console.warn('Supabase saveProject fallback:', error.message);
      }
    }

    const store = readJsonStore();
    let project;
    if (id) {
      const idx = store.projects.findIndex((p) => p.id === id);
      if (idx < 0) throw new Error('Project not found');
      project = { ...store.projects[idx], clientEmail, title, status, progress, notes, updatedAt: now };
      store.projects[idx] = project;
    } else {
      project = { id: randomUUID(), clientEmail, title, status, progress, notes, createdAt: now, updatedAt: now };
      store.projects.unshift(project);
    }
    writeJsonStore(store);
    return { project, projects: [...store.projects].sort(sortByUpdatedDesc) };
  }

  async function deleteProject(id) {
    if (!id) throw new Error('Project id required');
    let clientEmail = '';
    let found = false;

    // Resolve client email from either backend before deleting
    if (sb) {
      try {
        const { data } = await sb.from('portal_projects').select('*').eq('id', id).maybeSingle();
        if (data) {
          clientEmail = normalizeEmail(data.client_email);
          found = true;
        }
      } catch {}
    }
    const jsonStore = readJsonStore();
    const jsonHit = jsonStore.projects.find((p) => p.id === id);
    if (jsonHit) {
      clientEmail = clientEmail || normalizeEmail(jsonHit.clientEmail);
      found = true;
    }
    if (!found) throw new Error('Project not found');

    if (sb) {
      try {
        const { error } = await sb.from('portal_projects').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.warn('Supabase deleteProject warning:', error.message);
      }
    }

    // Always clear local JSON too (avoids ghost projects unlocking tickets)
    jsonStore.projects = jsonStore.projects.filter((p) => p.id !== id);
    writeJsonStore(jsonStore);

    const remaining = clientEmail
      ? (await listProjects(clientEmail)).length
      : 0;
    return {
      projects: await listProjects(),
      clientEmail,
      remainingForClient: remaining,
      ticketsLocked: remaining === 0
    };
  }

  async function listTickets(clientEmail) {
    const email = normalizeEmail(clientEmail);
    if (sb) {
      try {
        let query = sb.from('portal_tickets').select('*').order('updated_at', { ascending: false });
        if (email) query = query.eq('client_email', email);
        const { data, error } = await query;
        if (error) throw error;
        const tickets = [];
        for (const row of data || []) tickets.push(await loadTicketBundle(sb, row));
        return tickets;
      } catch (error) {
        console.warn('Supabase listTickets fallback:', error.message);
      }
    }
    const store = readJsonStore();
    const tickets = store.tickets.map(normalizeTicket).sort(sortByUpdatedDesc);
    return email ? tickets.filter((t) => normalizeEmail(t.clientEmail) === email) : tickets;
  }

  async function createTicket({ email, subject, message, priority = 'normal' }) {
    const clientEmail = normalizeEmail(email);
    const cleanSubject = String(subject || '').trim().slice(0, 160);
    const body = String(message || '').trim().slice(0, 4000);
    let cleanPriority = String(priority || 'normal').toLowerCase();
    if (!TICKET_PRIORITIES.has(cleanPriority)) cleanPriority = 'normal';
    if (!isValidEmail(clientEmail)) throw new Error('Valid email required');
    if (!cleanSubject || !body) throw new Error('Subject and message required');
    const now = new Date().toISOString();
    const messageId = randomUUID();
    const ticketId = randomUUID();

    if (sb) {
      try {
        const { data: ticketRow, error } = await sb
          .from('portal_tickets')
          .insert({
            id: ticketId,
            client_email: clientEmail,
            subject: cleanSubject,
            priority: cleanPriority,
            status: 'open',
            created_at: now,
            updated_at: now
          })
          .select('*')
          .single();
        if (error) throw error;
        const { error: msgError } = await sb.from('portal_ticket_messages').insert({
          id: messageId,
          ticket_id: ticketId,
          author_email: clientEmail,
          author_role: 'client',
          body,
          created_at: now
        });
        if (msgError) throw msgError;
        return { ticket: await loadTicketBundle(sb, ticketRow), tickets: await listTickets() };
      } catch (error) {
        console.warn('Supabase createTicket fallback:', error.message);
      }
    }

    const ticket = normalizeTicket({
      id: ticketId,
      clientEmail,
      subject: cleanSubject,
      priority: cleanPriority,
      status: 'open',
      messages: [{ id: messageId, authorEmail: clientEmail, authorRole: 'client', body, createdAt: now }],
      createdAt: now,
      updatedAt: now
    });
    const store = readJsonStore();
    store.tickets.unshift(ticket);
    writeJsonStore(store);
    return { ticket, tickets: [...store.tickets].sort(sortByUpdatedDesc) };
  }

  async function addTicketMessage({ ticketId, authorEmail, authorRole, body, status }) {
    const id = String(ticketId || '').trim();
    const email = normalizeEmail(authorEmail);
    const role = authorRole === 'admin' ? 'admin' : 'client';
    const text = String(body || '').trim().slice(0, 4000);
    if (!id) throw new Error('Ticket id required');
    const now = new Date().toISOString();
    const message = {
      id: randomUUID(),
      authorEmail: email || 'admin',
      authorRole: role,
      body: text,
      createdAt: now
    };

    if (sb) {
      try {
        const { data: existing, error: findError } = await sb.from('portal_tickets').select('*').eq('id', id).single();
        if (findError) throw findError;
        if (text) {
          const { error: msgError } = await sb.from('portal_ticket_messages').insert({
            id: message.id,
            ticket_id: id,
            author_email: message.authorEmail,
            author_role: role,
            body: text,
            created_at: now
          });
          if (msgError) throw msgError;
        }
        const patch = { updated_at: now };
        if (status && TICKET_STATUSES.has(status)) patch.status = status;
        const { data: updated, error: upError } = await sb.from('portal_tickets').update(patch).eq('id', id).select('*').single();
        if (upError) throw upError;
        return { ticket: await loadTicketBundle(sb, updated || existing), tickets: await listTickets() };
      } catch (error) {
        console.warn('Supabase addTicketMessage fallback:', error.message);
      }
    }

    const store = readJsonStore();
    const idx = store.tickets.findIndex((t) => t.id === id);
    if (idx < 0) throw new Error('Ticket not found');
    const current = normalizeTicket(store.tickets[idx]);
    if (text) current.messages.push(message);
    if (status && TICKET_STATUSES.has(status)) current.status = status;
    current.updatedAt = now;
    const lastAdmin = [...current.messages].reverse().find((m) => m.authorRole === 'admin');
    current.adminReply = lastAdmin?.body || current.adminReply || '';
    store.tickets[idx] = current;
    writeJsonStore(store);
    return { ticket: current, tickets: store.tickets.map(normalizeTicket).sort(sortByUpdatedDesc) };
  }

  async function addAttachment({ ticketId, messageId, fileName, mimeType, byteSize, url, uploadedBy }) {
    const attachment = {
      id: randomUUID(),
      fileName,
      mimeType: mimeType || 'application/octet-stream',
      byteSize: byteSize || 0,
      url,
      uploadedBy: normalizeEmail(uploadedBy),
      messageId: messageId || null,
      createdAt: new Date().toISOString()
    };
    if (sb) {
      try {
        const { error } = await sb.from('portal_attachments').insert({
          id: attachment.id,
          ticket_id: ticketId,
          message_id: messageId || null,
          file_name: attachment.fileName,
          mime_type: attachment.mimeType,
          byte_size: attachment.byteSize,
          url: attachment.url,
          uploaded_by: attachment.uploadedBy,
          created_at: attachment.createdAt
        });
        if (error) throw error;
        const tickets = await listTickets();
        return { attachment, ticket: tickets.find((t) => t.id === ticketId), tickets };
      } catch (error) {
        console.warn('Supabase addAttachment fallback:', error.message);
      }
    }
    const store = readJsonStore();
    const idx = store.tickets.findIndex((t) => t.id === ticketId);
    if (idx < 0) throw new Error('Ticket not found');
    const ticket = normalizeTicket(store.tickets[idx]);
    ticket.attachments.push(attachment);
    ticket.updatedAt = new Date().toISOString();
    store.tickets[idx] = ticket;
    writeJsonStore(store);
    return { attachment, ticket, tickets: store.tickets.map(normalizeTicket).sort(sortByUpdatedDesc) };
  }

  return {
    backend: sb ? 'supabase+json-fallback' : 'json',
    uploadsDir,
    listProjects,
    saveProject,
    deleteProject,
    listTickets,
    createTicket,
    addTicketMessage,
    addAttachment
  };
}
