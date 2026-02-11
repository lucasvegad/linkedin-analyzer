import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateWithGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const text = result.response.text();
  
  // Try direct parse first (responseMimeType should give clean JSON)
  try {
    return JSON.parse(text);
  } catch (e) {
    // Fallback: aggressive cleaning
  }

  // Clean markdown code fences
  let cleaned = text.trim();
  
  // Remove ```json ... ``` wrapping
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  // Remove ``` ... ``` wrapping  
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e2) {
    // Last resort: find JSON object in the text
  }

  // Extract first { ... } or [ ... ] block
  const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e3) {
      // Give up
    }
  }

  console.error('Gemini JSON parse failed. Raw text (first 1000 chars):', text.substring(0, 1000));
  return { response: text, _parseError: true };
}

// Alias for compatibility
export const askGemini = generateWithGemini;
