import 'dotenv/config';
import express from 'express';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import { normalizeConversationHistory, buildChatMessages, buildForgeContextPayload } from './forge-ai-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

const developerEmails = ['azeem.makhdum6@gmail.com', 'abbas585@gmail.com'];
const accessStorePath = join(__dirname, 'forge-access.json');

function readForgeAccessStore() {
  try {
    if (!existsSync(accessStorePath)) {
      return { allowedEmails: ['test@example.com'] };
    }
    const parsed = JSON.parse(readFileSync(accessStorePath, 'utf8'));
    return {
      allowedEmails: Array.isArray(parsed.allowedEmails)
        ? parsed.allowedEmails.map((email) => `${email}`.toLowerCase())
        : []
    };
  } catch (error) {
    console.warn('Failed to read Forge access store:', error.message);
    return { allowedEmails: [] };
  }
}

function writeForgeAccessStore(store) {
  writeFileSync(accessStorePath, JSON.stringify(store, null, 2));
}

function isAdminEmail(email = '') {
  return developerEmails.includes(`${email}`.toLowerCase());
}

function getForgeAccessPayload(email = '', includeAllowedEmails = false) {
  const normalizedEmail = `${email}`.toLowerCase();
  const store = readForgeAccessStore();
  const isDeveloper = isAdminEmail(normalizedEmail);
  const hasAccess = isDeveloper || store.allowedEmails.includes(normalizedEmail);
  const payload = {
    email: normalizedEmail,
    hasAccess,
    isDeveloper,
    credits: isDeveloper ? 999999 : null
  };
  if (includeAllowedEmails) {
    payload.allowedEmails = Array.from(new Set([...developerEmails, ...store.allowedEmails])).sort();
  }
  return payload;
}

// Premium Email Configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: 'hello.versecure@gmail.com',
      pass: 'gvdnodqlrbyhlamb'
    }
});

// Routing for the Contact Form
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, service, message } = req.body;
  
  try {
    // 1. Admin Alert (Premium Theme)
    await transporter.sendMail({
      from: '"Versecure Priority" <hello.versecure@gmail.com>',
      to: 'azeem.makhdum6@gmail.com, abbas585@gmail.com',
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

              <div style="margin-bottom: 32px; padding: 24px; background-color: #111; border-radius: 12px; border: 1px solid #1a1a1a;">
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">Message Brief</p>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #d1d5db; font-style: italic;">"${message}"</p>
              </div>

              <a href="mailto:${email}" style="display: inline-block; padding: 12px 24px; background-color: #fff; color: #000; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; transition: all 0.2s;">Reply Instantly</a>
            </div>
            <div style="padding: 20px; background-color: #050505; border-top: 1px solid #1a1a1a; text-align: center;">
              <p style="margin: 0; font-size: 10px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.1em;">Internal Notification Only &bull; Versecure Tech</p>
            </div>
          </div>
        </div>
      `
    });

    // 2. Premium User Confirmation
    await transporter.sendMail({
      from: '"Versecure Tech" <hello.versecure@gmail.com>',
      to: email,
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
    console.log("Custom Ultra-Premium Email Blasted Successfully!");
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

app.get('/api/admin/forge-access', (req, res) => {
  const adminEmail = typeof req.query.adminEmail === 'string' ? req.query.adminEmail : '';
  if (!isAdminEmail(adminEmail)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return res.json(getForgeAccessPayload(adminEmail, true));
});

app.post('/api/admin/forge-access/grant', (req, res) => {
  const adminEmail = `${req.body?.adminEmail || ''}`.toLowerCase();
  const targetEmail = `${req.body?.email || ''}`.toLowerCase().trim();
  if (!isAdminEmail(adminEmail)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  const store = readForgeAccessStore();
  store.allowedEmails = Array.from(new Set([...store.allowedEmails, targetEmail])).sort();
  writeForgeAccessStore(store);
  return res.json(getForgeAccessPayload(adminEmail, true));
});

app.post('/api/admin/forge-access/revoke', (req, res) => {
  const adminEmail = `${req.body?.adminEmail || ''}`.toLowerCase();
  const targetEmail = `${req.body?.email || ''}`.toLowerCase().trim();
  if (!isAdminEmail(adminEmail)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (isAdminEmail(targetEmail)) {
    return res.status(400).json({ error: 'Developer access cannot be revoked' });
  }
  const store = readForgeAccessStore();
  store.allowedEmails = store.allowedEmails.filter((email) => email !== targetEmail);
  writeForgeAccessStore(store);
  return res.json(getForgeAccessPayload(adminEmail, true));
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

// Serve the static Angular frontend
const browserPath = join(__dirname, 'dist', 'app', 'browser');
app.use(express.static(browserPath));

// Send all other requests to index.html so Angular's router takes over
app.use((req, res) => {
  res.sendFile(join(browserPath, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Versecure Standalone Server listening on port ' + PORT);
});
