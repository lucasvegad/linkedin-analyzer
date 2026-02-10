import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateWithGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192, // AUMENTADO: el doble de tokens
      },
    });

    const text = result.response.text();
    console.log('Raw response length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
    console.log('Last 200 chars:', text.substring(text.length - 200));

    // Limpiar markdown
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/```\s*$/i, '');
    cleaned = cleaned.trim();

    // Intentar parsear directamente primero
    try {
      return JSON.parse(cleaned);
    } catch (directError) {
      console.log('Parseo directo falló, intentando reparar...');
    }

    // Si falla, intentar extraer JSON válido parcial
    const repaired = extractValidJSON(cleaned);
    if (repaired) {
      console.log('JSON reparado exitosamente');
      return repaired;
    }

    // Si todo falla, lanzar error con contexto
    console.error('No se pudo reparar el JSON. Texto limpio:', cleaned.substring(0, 1000));
    throw new Error('Respuesta de Gemini truncada o inválida. Intenta con una query más corta.');

  } catch (error) {
    console.error('Error en generateWithGemini:', error);
    throw error;
  }
}

// Función para extraer JSON válido incluso si está truncado
function extractValidJSON(text) {
  // Intentar encontrar el objeto JSON más completo posible
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let lastValidEnd = -1;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !inString) {
      inString = true;
    } else if (char === '"' && inString) {
      inString = false;
    } else if (!inString) {
      if (char === '{' || char === '[') {
        if (depth === 0) {
          // Inicio del JSON
        }
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
        if (depth === 0) {
          lastValidEnd = i;
        }
      }
    }
  }
  
  if (lastValidEnd > 0) {
    const validPart = text.substring(0, lastValidEnd + 1);
    try {
      return JSON.parse(validPart);
    } catch (e) {
      console.log('Extracción parcial también falló');
    }
  }
  
  return null;
}

export const askGemini = generateWithGemini;
