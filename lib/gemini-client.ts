import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiInstance: GoogleGenerativeAI | null = null;

function initGemini() {
  if (geminiInstance) return geminiInstance;

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY environment variable is not set");
  }

  geminiInstance = new GoogleGenerativeAI(apiKey);
  return geminiInstance;
}

export function getGeminiModel(systemInstruction?: string) {
  const gemini = initGemini();

  return gemini.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
  });
}
