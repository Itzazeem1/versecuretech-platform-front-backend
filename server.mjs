import express from 'express';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

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

// Secure Forge AI Proxy (Zero-Leak Strategy)
app.post('/api/forge', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY; 
  const contents = req.body.contents;

  console.log("AI Proxy: Received Request");
  if (!apiKey) {
    console.error("AI Proxy Error: GEMINI_API_KEY is missing from environment variables.");
    return res.status(500).json({ error: "AI Service Not Configured. Please set GEMINI_API_KEY in Hostinger Environment Variables." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Extract the user text from the contents array
    const userText = contents
      ?.flatMap((c) => c.parts)
      ?.map((p) => p.text)
      ?.join('\n') || '';
    
    console.log("AI Proxy: Generating via @google/genai SDK...");
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: userText,
    });

    const text = response.text;
    console.log("AI Proxy: Success.");
    
    res.json({
      candidates: [{
        content: { parts: [{ text }], role: 'model' }
      }]
    });
  } catch (error) {
    console.error("AI Proxy Critical Error:", error.message || error);
    res.status(500).json({ error: error.message || "AI Service Unavailable" });
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
