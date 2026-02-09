import { searchPerplexity } from '../../../lib/perplexity';
import { generateWithGemini } from '../../../lib/gemini';

export async function POST(request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. Buscar en Perplexity
    let perplexityResult;
    try {
      perplexityResult = await searchPerplexity(query);
      console.log('Perplexity result:', perplexityResult); // ← MOVIDO ANTES del return
    } catch (error) {
      console.error('Perplexity error:', error);
      return Response.json({ 
        error: 'Error searching trends: ' + error.message 
      }, { status: 500 });
    }

    // 2. Procesar con Gemini
    const prompt = `Analyze these trends about "${query}" and return a JSON with this structure:
    {
      "trends": [
        {
          "title": "Trend title",
          "description": "Brief description",
          "source": "URL source"
        }
      ],
      "angles": ["angle1", "angle2", "angle3"],
      "contentGaps": ["gap1", "gap2"]
    }
    
    Data to analyze: ${perplexityResult}`;

    let geminiResult;
    try {
      geminiResult = await generateWithGemini(prompt);
      console.log('Gemini result:', geminiResult); // ← MOVIDO ANTES del return
    } catch (error) {
      console.error('Gemini error:', error);
      return Response.json({ 
        error: 'Error analyzing trends: ' + error.message 
      }, { status: 500 });
    }

    // 3. Parsear respuesta de Gemini
    let parsedResult;
    try {
      // Limpiar posible markdown de la respuesta
      const cleanJson = geminiResult.replace(/```json\n?|\n?```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
      console.log('Parsed result:', parsedResult); // ← MOVIDO ANTES del return
    } catch (error) {
      console.error('Parse error:', error);
      console.error('Gemini raw response:', geminiResult);
      return Response.json({ 
        error: 'Error parsing analysis result' 
      }, { status: 500 });
    }

    // Verificar que trends existe y es un array
    if (!parsedResult.trends || !Array.isArray(parsedResult.trends)) {
      console.error('Invalid result structure:', parsedResult);
      return Response.json({ 
        error: 'Invalid analysis result structure' 
      }, { status: 500 });
    }

    return Response.json(parsedResult);

  } catch (error) {
    console.error('General error:', error);
    return Response.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
} // ← FALTABA ESTA LLAVE DE CIERRE
