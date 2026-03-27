import express from 'express';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

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
    // 1. Admin Alert
    await transporter.sendMail({
      from: '"Versecure Priority" <hello.versecure@gmail.com>',
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

    // 2. Premium Vercel-style User Confirmation
    await transporter.sendMail({
      from: '"Versecure Tech" <hello.versecure@gmail.com>',
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
    console.log("Custom Ultra-Premium Email Blasted Successfully!");
  } catch (e) {
    console.error("Email send failed:", e);
  }
  
  res.json({ success: true });
});

// Serve the static Angular frontend
const browserPath = join(__dirname, 'dist', 'app', 'browser');
app.use(express.static(browserPath));

// Send all other requests to index.html so Angular's router takes over
app.get('/(.*)', (req, res) => {
  res.sendFile(join(browserPath, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Versecure Standalone Server listening on port ' + PORT);
});
