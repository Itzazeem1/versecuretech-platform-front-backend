import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key present:", !!apiKey);

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const contents = [{ parts: [{ text: "say hi" }] }];

try {
  const result = await model.generateContent({ contents });
  const response = await result.response;
  const text = response.text();
  console.log("SUCCESS:", text);
} catch (e) {
  console.error("FAILED:", e.message);
}
