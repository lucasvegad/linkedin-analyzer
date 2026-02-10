import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateWithGemini(prompt) {
  // Validar API key
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada en variables de entorno');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    const text = result.response.text();
    console.log('=== RAW GEMINI RESPONSE ===');
    console.log(text.substring(0, 1000));
    console.log('===========================');

    // Limpiar markdown fences
    let cleaned = text.trim();
    
    // Remover ```json o ``` al inicio
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    
    // Remover ``` al final
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    
    cleaned = cleaned.trim();

    // Si no empieza con { o [, buscar el JSON dentro del texto
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
      const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
        console.log('JSON extraído con regex:', cleaned.substring(0, 200));
      }
    }

    try {
      const parsed = JSON.parse(cleaned);
      console.log('JSON parseado exitosamente');
      return parsed;
    } catch (parseError) {
      console.error('Error parseando JSON:', parseError.message);
      console.error('Texto limpio que falló:', cleaned.substring(0, 500));
      throw new Error('Gemini devolvió respuesta inválida: ' + parseError.message);
    }

  } catch (error) {
    console.error('Error en generateWithGemini:', error);
    throw error;
  }
}

export const askGemini = generateWithGemini;
