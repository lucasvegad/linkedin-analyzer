import { NextResponse } from 'next/server';
import { searchPerplexity } from '../../../lib/perplexity';
import { generateWithGemini } from '../../../lib/gemini';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Falta la keyword' }, { status: 400 });
    }

    console.log('=== INICIANDO ANÁLISIS ===');
    console.log('Query:', query);

    // PASO 1: Buscar datos con Perplexity
    let perplexityData;
    try {
      console.log('Llamando a Perplexity...');
      perplexityData = await searchPerplexity(query);
      console.log('Perplexity OK - content length:', perplexityData?.content?.length);
    } catch (pErr) {
      console.error('Perplexity error:', pErr);
      return NextResponse.json({ 
        error: 'Error buscando tendencias: ' + pErr.message 
      }, { status: 500 });
    }

    // Validar datos de Perplexity
    if (!perplexityData?.content) {
      console.error('Perplexity sin contenido:', perplexityData);
      return NextResponse.json({ 
        error: 'Perplexity no devolvió contenido válido' 
      }, { status: 500 });
    }

    // PASO 2: Preparar y enviar prompt a Gemini
    const citationsText = (perplexityData.citations || [])
      .map((url, i) => `[${i + 1}] ${url}`)
      .join('\n');

    const geminiPrompt = `Sos un estratega de contenido LinkedIn especializado en LegalTech y GovTech.
Te doy datos REALES encontrados en internet sobre: "${query}"

DATOS REALES:
${perplexityData.content}

FUENTES:
${citationsText}

=== PERFIL DE LUCAS VEGA (datos verificados) ===
CARGO ACTUAL: Secretario del Digesto Juridico & Modernizacion, Concejo Deliberante de Montecarlo, Misiones.
EXPERIENCIA: Ex concejal (2021-2025, gestion finalizada 10/12/2025). 189 proyectos legislativos. +10 anos experiencia legal.
PROYECTO DigestIA: Chatbot IA para consulta legislativa municipal — EN DESARROLLO 2026, NO en produccion. Base: Digesto certificado (4ta Consolidacion, nov 2025), 176 normas vigentes. Lucas NO digitalizo las ordenanzas.
CIUDAD: Montecarlo, 25,981 habitantes (Censo 2022 INDEC). NO usar 35,000.
STACK: Claude API, Gemini, Supabase, Vercel.
PILARES: 35% DigestIA, 25% LegalTech, 20% IA gobierno, 15% Aprendizaje, 5% Personal.

VOZ CALIBRADA: Profesional tecnico que comparte su proceso. 70% valor educativo, 20% proceso, 10% logros. Primera persona plural. Datos como protagonista. Sin autoproclamarse.

PROHIBIDO: "es concejal", "digitalizo ordenanzas", "DigestIA sirve a X vecinos", "35,000 hab", "pionero", "visionario", "primer municipio con IA".

Genera un JSON con 5 trends, 3 unique_angles, 2 content_gaps:
{
  "trends": [
    {
      "title": "string titulo conciso",
      "description": "string 2-3 oraciones basadas en datos reales",
      "relevance_score": 8,
      "saturation": "low",
      "lucas_angle": "string como Lucas puede cubrir esto desde su experiencia REAL y verificable, usando voz calibrada (proceso, no logros grandilocuentes)",
      "suggested_pillar": "DigestIA",
      "suggested_format": "carrusel",
      "source_url": "string URL real de las fuentes"
    }
  ],
  "unique_angles": [
    { "angle": "string", "why_only_lucas": "string basado en datos verificables", "potential_virality": "medium" }
  ],
  "content_gaps": [
    { "topic": "string", "demand_signal": "string", "suggested_approach": "string" }
  ]
}

saturation: "low"|"medium"|"high"
suggested_pillar: "DigestIA"|"LegalTech"|"IA_gobierno"|"Aprendizaje"|"Personal"
suggested_format: "carrusel"|"texto_imagen"|"video"|"encuesta"|"solo_texto"
potential_virality: "low"|"medium"|"high"
Solo JSON valido, sin backticks ni texto adicional.`;

    let geminiResult;
    try {
      console.log('Llamando a Gemini...');
      geminiResult = await generateWithGemini(geminiPrompt);
      console.log('Gemini OK - keys:', Object.keys(geminiResult));
    } catch (gErr) {
      console.error('Gemini error:', gErr);
      return NextResponse.json({ 
        error: 'Error en analisis Gemini: ' + gErr.message 
      }, { status: 500 });
    }

    // Validar estructura de respuesta
    if (!geminiResult || typeof geminiResult !== 'object') {
      console.error('Gemini no devolvió objeto:', geminiResult);
      return NextResponse.json({ 
        error: 'Respuesta de Gemini no es un objeto válido' 
      }, { status: 500 });
    }

    const analysis = {
      trends: geminiResult.trends || [],
      unique_angles: geminiResult.unique_angles || [],
      content_gaps: geminiResult.content_gaps || [],
      sources: perplexityData.citations || [],
      search_results: perplexityData.search_results || [],
    };

    // Guardar en Supabase (no bloqueante)
    try {
      await supabase.from('analyses').insert({
        query,
        perplexity_data: perplexityData,
        gemini_analysis: geminiResult,
        sources: perplexityData.citations,
      });
      console.log('Guardado en Supabase OK');
    } catch (dbErr) {
      console.error('Supabase error (no bloqueante):', dbErr);
    }

    console.log('=== ANÁLISIS COMPLETADO ===');
    return NextResponse.json(analysis);

  } catch (err) {
    console.error('Error general en analyze:', err);
    return NextResponse.json({ 
      error: err.message || 'Error desconocido' 
    }, { status: 500 });
  }
}
