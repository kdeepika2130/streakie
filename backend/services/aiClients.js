import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in the .env file. AI features will be disabled.");
}

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : undefined;

export default genAI; // ✅ default export
