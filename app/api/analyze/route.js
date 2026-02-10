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
    const prompt = `Analyze these trends about "${query}" for Lucas Vega and return a JSON with this structure:

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

CONTEXT ABOUT LUCAS VEGA:
- Legal Tech Lead en Digesto Jurídico (Montecarlo, Misiones, Argentina)
- Concejal municipal con 189 proyectos legislativos presentados
- 172 ordenanzas municipales digitalizadas en chatbot IA accesible 24/7
- 25,000+ vecinos de Montecarlo con acceso a normativa vía chatbot
- En proceso de implementación de la IA aplicada a legislación municipal (chatbot de ordenanzas)
- Stack técnico: Claude + Gemini + Supabase + Vercel
- Abogado que construye apps sin saber programar ("Vibe Coder")

IMPORTANT - DIGESTIA STATUS:
- DigestIA is a PLANNED PROJECT for 2025 (roadmap, not yet implemented)
- Currently in conceptual development phase, NOT in production
- When suggesting angles, frame DigestIA as "upcoming project", "in planning", "roadmap 2025", or "next step" - NEVER as "currently running" or "implemented"
- Focus angles on existing achievements (172 ordinances chatbot, etc.) rather than DigestIA

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
