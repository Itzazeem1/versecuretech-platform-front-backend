import 'dotenv/config';
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

// Secure Forge AI Proxy (Supports Groq, xAI/Grok, and Gemini)
app.post('/api/forge', async (req, res) => {
  try {
    const contents = req.body.contents;
    // Extract the user text from the contents array
    const userText = contents
      ?.flatMap((c) => c.parts)
      ?.map((p) => p.text)
      ?.join('\n') || '';

    console.log("AI Proxy: Received Request");
    console.log("User prompt length:", userText ? userText.length : 0);

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
- If responding verbally, output a JSON object with a single "message" property containing your response string. Example: {"message": "Hello! How can I help you today?"}
- If generating code, output a JSON object with a "files" property containing an array of file objects, and an optional "message" property explaining what you built. Example: {"files": [{"path": "index.html", "content": "..."}], "message": "I built a calculator..."}`;

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
      const response = await ai.models.generateContent({
        model: model,
        contents: userText,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      generatedText = response.text || '';
    } else if (provider === 'groq') {
      console.log(`AI Proxy: Generating via Groq API (${model})...`);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userText }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4096,
          temperature: 0.7
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
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userText }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4096,
          temperature: 0.7
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
