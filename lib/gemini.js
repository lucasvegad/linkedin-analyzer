// lib/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Función principal
export async function generateWithGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Intentar parsear si es JSON
    try {
      const cleanJson = text.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      // Si no es JSON válido, devolver como objeto con la respuesta
      return { response: text };
    }
  } catch (error) {
    console.error('Gemini error:', error);
    throw error;
  }
}

// Alias para compatibilidad con hooks y post
export async function askGemini(prompt) {
  return generateWithGemini(prompt);
}
