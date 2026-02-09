// lib/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Función principal
export async function generateWithGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini error:', error);
    throw error;
  }
}

// Alias para compatibilidad con el frontend
export const askGemini = generateWithGemini;
