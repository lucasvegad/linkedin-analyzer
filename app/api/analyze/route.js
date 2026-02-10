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
      console.log('Perplexity result:', perplexityResult);
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
      "source_url": "https://example.com",
      "relevance_score": 8,
      "suggested_pillar": "LegalTech",
      "saturation": "medium",
      "lucas_angle": "Your unique angle"
    }
  ],
  "unique_angles": [
    {
      "angle": "Unique angle description",
      "why_only_lucas": "Why this is unique to you",
      "potential_virality": "high"
    }
  ],
  "content_gaps": [
    {
      "topic": "Gap topic",
      "demand_signal": "Why people want this",
      "suggested_approach": "How to approach it"
    }
  ],
  "sources": ["https://source1.com", "https://source2.com"]
}

Data to analyze: ${perplexityResult}`;

    let parsedResult;
    try {
      // generateWithGemini ahora devuelve el objeto parseado directamente
      parsedResult = await generateWithGemini(prompt);
      console.log('Parsed result:', parsedResult);
    } catch (error) {
      console.error('Gemini error:', error);
      return Response.json({ 
        error: 'Error analyzing trends: ' + error.message 
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
}
