import { NextResponse } from 'next/server';
import { searchPerplexity } from '../../../lib/perplexity';
import { askGemini } from '../../../lib/gemini';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Falta la keyword' }, { status: 400 });
    }

    // PASO 1: Buscar datos REALES con Perplexity Sonar
    const perplexityData = await searchPerplexity(query);

    // PASO 2: Analizar con Gemini usando los datos reales
    const geminiPrompt = `Sos un estratega de contenido LinkedIn especializado en LegalTech.
Te doy datos REALES encontrados por Perplexity sobre: "${query}"

DATOS REALES DE INTERNET:
${perplexityData.content}

FUENTES VERIFICADAS:
${perplexityData.citations.map((url, i) => `[${i + 1}] ${url}`).join('\n')}

PERFIL DEL USUARIO: Lucas Vega, Abogado Tech, proyecto #DigestIA (chatbot municipal con IA para consulta de 172 ordenanzas municipales, sirve a 25,000+ vecinos de Montecarlo, Misiones, Argentina). Ex concejal con 189 proyectos legislativos. Stack: Claude + Gemini + Supabase + Vercel. Pilares: 35% DigestIA, 25% LegalTech, 20% IA gobierno, 15% Aprendizaje, 5% Personal.

Basándote EXCLUSIVAMENTE en los datos reales proporcionados, generá un JSON con este schema exacto:
{
  "trends": [
    {
      "title": "string título conciso",
      "description": "string 2-3 oraciones basadas en datos reales",
      "relevance_score": 8,
      "saturation": "low",
      "lucas_angle": "string cómo Lucas puede cubrir esto con DigestIA",
      "suggested_pillar": "DigestIA",
      "suggested_format": "carrusel",
      "source_url": "string URL real"
    }
  ],
  "unique_angles": [
    {
      "angle": "string",
      "why_only_lucas": "string",
      "potential_virality": "medium"
    }
  ],
  "content_gaps": [
    {
      "topic": "string",
      "demand_signal": "string",
      "suggested_approach": "string"
    }
  ]
}

Generá exactamente 5 trends, 3 unique_angles, 2 content_gaps.
Para saturation usá solo: "low", "medium", "high"
Para suggested_pillar solo: "DigestIA", "LegalTech", "IA_gobierno", "Aprendizaje", "Personal"
Para suggested_format solo: "carrusel", "texto_imagen", "video", "encuesta", "solo_texto"
Para potential_virality solo: "low", "medium", "high"
Respondé SOLO con el JSON, sin texto adicional, sin backticks markdown.`;

    const geminiAnalysis = await askGemini(geminiPrompt);

    // PASO 3: Guardar en Supabase
    try {
      await supabase.from('analyses').insert({
        query,
        perplexity_data: perplexityData,
        gemini_analysis: geminiAnalysis,
        sources: perplexityData.citations,
      });
    } catch (dbErr) {
      console.error('Supabase save error:', dbErr);
    }

    // PASO 4: Devolver resultado combinado
    return NextResponse.json({
      ...geminiAnalysis,
      sources: perplexityData.citations,
      search_results: perplexityData.search_results,
      related_questions: perplexityData.related_questions,
    });

  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
