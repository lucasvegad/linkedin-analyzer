import { NextResponse } from 'next/server';
import { searchPerplexity } from '../../../lib/perplexity';
import { generateWithGemini, askGemini } from '../../../lib/gemini';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Falta la keyword' }, { status: 400 });
    }

    // PASO 1: Buscar datos REALES con Perplexity Sonar
    let perplexityData;
    try {
      perplexityData = await searchPerplexity(query);
    } catch (pErr) {
      console.error('Perplexity error:', pErr);
      return NextResponse.json({ error: 'Error buscando tendencias: ' + pErr.message }, { status: 500 });
    }

    // PASO 2: Analizar con Gemini usando los datos reales
    const geminiPrompt = `Sos un estratega de contenido LinkedIn especializado en LegalTech.
Te doy datos REALES encontrados en internet sobre: "${query}"

DATOS REALES:
${perplexityData.content}

FUENTES:
${(perplexityData.citations || []).map((url, i) => '[' + (i+1) + '] ' + url).join('\n')}

=== PERFIL DE LUCAS VEGA (usar EXACTAMENTE esta info, NO exagerar) ===
CARGO ACTUAL: Secretario del Digesto Juridico & Modernizacion, Concejo Deliberante de Montecarlo, Misiones, Argentina.
EXPERIENCIA PASADA: Ex concejal de Montecarlo (2021-2025, gestion finalizada 10/12/2025). Presento 189 proyectos legislativos.
PROYECTO DigestIA: Chatbot IA para consulta legislativa municipal - EN DESARROLLO para 2026, NO implementado. Las 172 ordenanzas del digesto ya estaban digitalizadas antes (Lucas NO las digitalizo). El chatbot es un PROYECTO, no un producto en produccion.
IDENTIDAD: "Abogado Tech" y "Vibe Coder". Stack: Claude, Gemini, Supabase, Vercel.
PILARES: 35% DigestIA, 25% LegalTech, 20% IA gobierno, 15% Aprendizaje, 5% Personal.

PROHIBIDO: decir "es concejal", "digitalizo ordenanzas", "DigestIA sirve a 25K vecinos", "primer municipio con IA". 
CORRECTO: "ex concejal", "proyecto en desarrollo", "estamos planificando", framing honesto.

Genera un JSON con exactamente 5 trends, 3 unique_angles, 2 content_gaps:
{
  "trends": [
    {
      "title": "string",
      "description": "string 2-3 oraciones",
      "relevance_score": 8,
      "saturation": "low",
      "lucas_angle": "string desde experiencia REAL",
      "suggested_pillar": "DigestIA",
      "suggested_format": "carrusel",
      "source_url": "string URL real"
    }
  ],
  "unique_angles": [
    { "angle": "string", "why_only_lucas": "string", "potential_virality": "medium" }
  ],
  "content_gaps": [
    { "topic": "string", "demand_signal": "string", "suggested_approach": "string" }
  ]
}

saturation: "low"|"medium"|"high". suggested_pillar: "DigestIA"|"LegalTech"|"IA_gobierno"|"Aprendizaje"|"Personal". suggested_format: "carrusel"|"texto_imagen"|"video"|"encuesta"|"solo_texto". potential_virality: "low"|"medium"|"high".
Responde SOLO JSON valido, sin backticks ni texto extra.`;

    let geminiResult;
    try {
      geminiResult = await generateWithGemini(geminiPrompt);
    } catch (gErr) {
      console.error('Gemini error:', gErr);
      return NextResponse.json({ error: 'Error en analisis Gemini: ' + gErr.message }, { status: 500 });
    }

    // Handle parse errors from Gemini
    if (geminiResult._parseError) {
      console.error('Gemini returned non-JSON');
      return NextResponse.json({ error: 'Gemini no devolvio JSON valido. Intenta de nuevo.' }, { status: 500 });
    }

    // Ensure required fields exist with defaults
    const analysis = {
      trends: geminiResult.trends || [],
      unique_angles: geminiResult.unique_angles || [],
      content_gaps: geminiResult.content_gaps || [],
      sources: perplexityData.citations || [],
      search_results: perplexityData.search_results || [],
    };

    // PASO 3: Guardar en Supabase (non-blocking)
    try {
      await supabase.from('analyses').insert({
        query,
        perplexity_data: perplexityData,
        gemini_analysis: geminiResult,
        sources: perplexityData.citations,
      });
    } catch (dbErr) {
      console.error('Supabase save error (non-blocking):', dbErr);
    }

    return NextResponse.json(analysis);

  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json({ error: err.message || 'Error desconocido' }, { status: 500 });
  }
}
