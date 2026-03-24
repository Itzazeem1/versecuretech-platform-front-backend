import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import nodemailer from 'nodemailer';
import { GoogleGenAI, Type } from '@google/genai';
import 'dotenv/config';
import multer from 'multer';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json());
const angularApp = new AngularNodeAppEngine();

// --- Backend API ---
const allowedEmails = ['azeem.makhdum6@gmail.com', 'abbas585@gmail.com'];
// Simple file-based DB

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files
  }
});
const DB_FILE = join(os.tmpdir(), 'data.json');
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ services: [], contacts: [], forgeUsers: {} }));
    }
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (!data.forgeUsers) data.forgeUsers = {};
    return data;
  } catch (e) {
    console.error('Failed to read DB', e);
    return { services: [], contacts: [], forgeUsers: {} };
  }
}
function writeDB(data: unknown) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write DB', e);
  }
}

// Nodemailer setup
let transporter: nodemailer.Transporter;

if (process.env['SMTP_HOST'] && process.env['SMTP_USER'] && process.env['SMTP_PASS']) {
  transporter = nodemailer.createTransport({
    host: process.env['SMTP_HOST'],
    port: parseInt(process.env['SMTP_PORT'] || '587', 10),
    secure: process.env['SMTP_SECURE'] === 'true',
    auth: {
      user: process.env['SMTP_USER'],
      pass: process.env['SMTP_PASS'],
    },
  });
  console.log('Real SMTP Email account configured.');
} else {
  nodemailer.createTestAccount().then(account => {
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
    console.log('Ethereal Email account created. Check console for message URLs. (Set SMTP_HOST, SMTP_USER, SMTP_PASS for real emails)');
  }).catch(err => {
    console.error('Failed to create Ethereal account', err);
  });
}

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!allowedEmails.includes(email)) {
    res.status(403).json({ error: 'Unauthorized email' });
    return;
  }
  
  // Directly provide token
  res.json({ token: 'admin-token-12345' });
});

app.get('/api/data', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token !== 'admin-token-12345') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json(readDB());
});

app.post('/api/data', (req, res) => {
  const { token, data } = req.body;
  if (token !== 'admin-token-12345') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  writeDB(data);
  res.json({ success: true });
});

app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, service, message } = req.body;
  const db = readDB();
  db.contacts = db.contacts || [];
  db.contacts.push({ 
    name: `${firstName} ${lastName}`, 
    email, 
    service,
    message, 
    date: new Date().toISOString() 
  });
  writeDB(db);

  try {
    if (transporter) {
      // 1. Send email to Admins
      const adminInfo = await transporter.sendMail({
        from: '"Versecure Contact" <noreply@versecuretech.com>',
        to: 'azeem.makhdum6@gmail.com, abbas585@gmail.com',
        subject: `New Lead: ${firstName} ${lastName} - ${service}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Service Requested:</strong> ${service}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 4px solid #ccc; padding-left: 10px;">${message}</blockquote>
        `
      });

      // 2. Send decorative confirmation email to the User
      const userInfo = await transporter.sendMail({
        from: '"Versecure Tech" <hello@versecuretech.com>',
        to: email,
        subject: `We received your request, ${firstName}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
            <div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-bottom: 1px solid #333;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px; color: #fff;">Versecure<span style="color: #3b82f6;">.</span></h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="font-size: 22px; font-weight: 500; margin-top: 0; color: #f3f4f6;">Hello ${firstName},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px;">
                Thank you for reaching out to Versecure. We have received your inquiry regarding <strong>${service}</strong>.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 32px;">
                Our engineering team is reviewing your request and will get back to you shortly to discuss how we can bridge your vision and execution.
              </p>
              <div style="background-color: #111; padding: 24px; border-radius: 12px; border: 1px solid #222; margin-bottom: 32px;">
                <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 12px;">Your Message Summary</h3>
                <p style="margin: 0; font-size: 15px; color: #d1d5db; font-style: italic;">"${message}"</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin: 0;">
                Best regards,<br>
                <strong style="color: #fff;">The Versecure Team</strong>
              </p>
            </div>
            <div style="padding: 24px 40px; background-color: #050505; text-align: center; border-top: 1px solid #222;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                &copy; ${new Date().getFullYear()} Versecure Tech. All rights reserved.
              </p>
            </div>
          </div>
        `
      });

      if (!process.env['SMTP_HOST']) {
        console.log('Admin Email sent: %s', nodemailer.getTestMessageUrl(adminInfo));
        console.log('User Confirmation Email sent: %s', nodemailer.getTestMessageUrl(userInfo));
      }
    }
  } catch (e) {
    console.error('Contact email send failed', e);
  }

  res.json({ success: true });
});

// Secure Forge AI Endpoints
app.get('/api/forge/credits', (req, res) => {
  const sessionId = req.query['sessionId'] as string;
  if (!sessionId) {
    res.status(400).json({ error: 'Session ID required' });
    return;
  }
  const db = readDB();
  if (!db.forgeUsers[sessionId]) {
    db.forgeUsers[sessionId] = { credits: 100 };
    writeDB(db);
  }
  res.json({ credits: db.forgeUsers[sessionId].credits });
});

app.post('/api/forge/generate', upload.array('files', 5), async (req, res) => {
  const { sessionId, prompt } = req.body;
  const files = req.files as Express.Multer.File[];
  const { apiKey } = req.body;
  
  if (!sessionId || !prompt) {
    res.status(400).json({ error: 'Session ID and prompt required' });
    return;
  }

  const db = readDB();
  if (!db.forgeUsers[sessionId]) {
    db.forgeUsers[sessionId] = { credits: 100 };
  }

  const userCredits = db.forgeUsers[sessionId].credits;
  if (userCredits < 2) {
    res.status(403).json({ error: 'Insufficient credits. You need at least 2 credits.' });
    return;
  }

  const customKey = apiKey;
  const envKey = process.env['GEMINI_API_KEY'];
  const globalKey = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : undefined;
  
  const finalApiKey = customKey || envKey || globalKey;
  
  if (!finalApiKey || finalApiKey === 'YOUR_GEMINI_API_KEY' || finalApiKey === '${GEMINI_API_KEY}') {
    console.error('API Key Resolution Failed:', { hasCustom: !!customKey, hasEnv: !!envKey, hasGlobal: !!globalKey, globalVal: globalKey });
    res.status(500).json({ error: 'Server missing Gemini API key. Please check your environment variables.' });
    return;
  }
  
  // Don't log the actual key, just where it came from
  console.log('Using API Key from:', customKey ? 'custom' : (envKey ? 'env' : 'global'));

  // Add file context to the prompt if files are uploaded
  let enhancedPromptText = prompt;
  const parts: any[] = [];
  
  if (files && files.length > 0) {
    enhancedPromptText += '\n\nATTACHED FILES:\n';
    files.forEach((file, index) => {
      enhancedPromptText += `\n${index + 1}. ${file.originalname} (${file.mimetype}, ${Math.round(file.size / 1024)}KB)\n`;
      if (file.mimetype.startsWith('image/')) {
        enhancedPromptText += '[IMAGE FILE - Please analyze this image]\n';
        parts.push({
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype
          }
        });
      } else {
        enhancedPromptText += '[CODE FILE - Please review this code]\n';
        parts.push({
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype
          }
        });
      }
    });
  }
  
  parts.push({ text: enhancedPromptText });
  const contents = { parts };

  const ai = new GoogleGenAI({ apiKey: finalApiKey });
  
  const systemInstruction = `You are Forge AI, an advanced AI assistant and expert frontend developer.
Your behavior depends on the user's prompt:
1. If the user is just chatting, asking questions, or giving normal commands (e.g., "hello", "how are you", "explain this"), respond verbally in a helpful and conversational manner. DO NOT generate code files.
2. If the user explicitly asks you to build, create, or generate a web application, component, or UI (e.g., "build a calculator", "create a landing page"), you MUST generate a complete project.

WHEN GENERATING CODE:
- Generate a realistic project structure matching modern web development.
- For HTML files, include Tailwind CSS via CDN: <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
- Ensure the design is modern, responsive, and accessible.
- Use high-quality UI patterns and animations where appropriate.

OUTPUT FORMAT:
- If responding verbally, output a JSON object with a single "message" property containing your response string.
- If generating code, output a JSON object with a "files" property containing an array of file objects, and an optional "message" property explaining what you built.`;

  const config = {
    systemInstruction,
    temperature: 0.7,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING },
        files: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              path: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ["path", "content"]
          }
        }
      }
    }
  };

  // First test if the API key works at all
  try {
    console.log('Testing API key with countTokens...');
    const tokenCount = await ai.models.countTokens({
      model: 'gemini-3-flash-preview',
      contents: 'Hello world test'
    });
    console.log('API key works! Token count:', tokenCount.totalTokens);
  } catch (testError) {
    console.error('API key test failed:', testError);
    res.status(500).json({ error: 'API key validation failed: ' + (testError as Error).message });
    return;
  }

  try {
    let responseText = '';
    let usedModel = '';
    let cost = 0;

    if (userCredits >= 10) {
      try {
        console.log('Attempting to use model: gemini-3.1-pro-preview');
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents,
          config
        });
        responseText = response.text || '';
        usedModel = 'Pro';
        cost = 10;
      } catch (proError) {
        console.warn('Pro model failed, falling back to Flash...', proError);
        console.log('Attempting to use fallback model: gemini-3-flash-preview');
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents,
          config
        });
        responseText = response.text || '';
        usedModel = 'Flash';
        cost = 2;
      }
    } else {
      console.log('Using default model: gemini-3-flash-preview');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents,
        config
      });
      responseText = response.text || '';
      usedModel = 'Flash';
      cost = 2;
    }

    // Deduct credits
    db.forgeUsers[sessionId].credits -= cost;
    writeDB(db);

    res.json({
      success: true,
      text: responseText,
      usedModel,
      cost,
      remainingCredits: db.forgeUsers[sessionId].credits
    });

  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    const errorMessage = (error as Error).message || 'Failed to generate content';
    
    if (errorMessage.includes('API key not valid')) {
      const source = customKey ? 'custom API key' : 'server API key';
      res.status(500).json({ error: `The ${source} is not valid. Please check your settings and try again.` });
    } else {
      res.status(500).json({ error: errorMessage });
    }
  }
});
// --- End Backend API ---

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
import { Server } from 'socket.io';

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4200;
  const server = app.listen(port, () => {
    console.log('Starting server with build timestamp:', new Date().toISOString());
    console.log(`Node Express server listening on http://localhost:${port}`);
  });

  // Initialize Socket.io
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  let liveUsers = 0;
  // Global state cache to seed new clients
  let globalStateCache = {};

  io.on('connection', (socket) => {
    liveUsers++;
    io.emit('liveUserCount', liveUsers);
    
    // Send current state to new clients
    socket.emit('globalStateUpdate', globalStateCache);

    socket.on('disconnect', () => {
      liveUsers--;
      io.emit('liveUserCount', liveUsers);
    });

    // Admin updates global state
    socket.on('adminUpdateState', (newState) => {
      globalStateCache = { ...globalStateCache, ...newState };
      io.emit('globalStateUpdate', globalStateCache);
    });
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
