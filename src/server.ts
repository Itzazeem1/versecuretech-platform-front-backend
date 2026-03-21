import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import fs from 'node:fs';
import nodemailer from 'nodemailer';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json());
const angularApp = new AngularNodeAppEngine();

// --- Backend API ---
const allowedEmails = ['azeem.makhdum6@gmail.com', 'abbas585@gmail.com'];
const otps = new Map<string, { code: string, expires: number }>();

// Simple file-based DB
const DB_FILE = join(import.meta.dirname, 'data.json');
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ services: [], contacts: [] }));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function writeDB(data: unknown) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Nodemailer setup (mock/ethereal)
let transporter: nodemailer.Transporter;
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
  console.log('Ethereal Email account created. Check console for message URLs.');
}).catch(err => {
  console.error('Failed to create Ethereal account', err);
});

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
      const info = await transporter.sendMail({
        from: '"Contact Form" <noreply@versecuretech.com>',
        to: 'hello@versecuretech.com', // Admin email
        subject: `New Contact from ${firstName} ${lastName}`,
        text: `Name: ${firstName} ${lastName}\nEmail: ${email}\nService: ${service}\nMessage: ${message}`
      });
      console.log('Contact Email sent: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (e) {
    console.error('Contact email send failed', e);
  }

  res.json({ success: true });
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
  const port = process.env['PORT'] || 4000;
  const server = app.listen(port, () => {
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
