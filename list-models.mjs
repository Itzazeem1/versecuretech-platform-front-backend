import fetch from 'node-fetch';

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
  console.log("Listing models for key:", apiKey ? "EXISTS" : "MISSING");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Models:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("List failed:", e);
  }
}

listModels();
