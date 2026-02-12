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

    let perplexityData;
    try {
      perplexityData = await searchPerplexity(query);
    } catch (pErr) {
      console.error('Perplexity error:', pErr);
      return NextResponse.json({ error: 'Error buscando tendencias: ' + pErr.message }, { status: 500 });
    }

    const geminiPrompt = `Sos un estratega de contenido LinkedIn para alguien que esta EMPEZANDO a construir autoridad en LegalTech (24 conexiones, perfil nuevo). Tu trabajo es encontrar tendencias donde Lucas pueda APORTAR VALOR INMEDIATO al lector, no promocionar su proyecto.

DATOS REALES DE INTERNET sobre "${query}":
${perplexityData.content}

FUENTES:
${(perplexityData.citations || []).map((url, i) => '[' + (i+1) + '] ' + url).join('\n')}

=== PERFIL DE LUCAS VEGA ===
Cargo: Secretario del Digesto Juridico & Modernizacion, Montecarlo, Misiones (25,981 hab).
Experiencia: Ex concejal (2021-2025). 189 proyectos legislativos. +10 anos legal.
Proyecto: DigestIA chatbot IA legislativo — EN DESARROLLO 2026, no implementado.
Base: Digesto certificado, 176 normas vigentes. Lucas NO digitalizo las ordenanzas.
Stack: Claude API, Gemini, Supabase, Vercel.

=== ESTRATEGIA: CURADOR DE VALOR (no promotor de proyecto) ===

Lucas esta en ETAPA INICIAL de LinkedIn. Con 24 conexiones, necesita APORTAR VALOR antes de hablar de su proyecto. La estrategia es:

1. CURAR TENDENCIAS (40%): Tomar datos reales de Perplexity y agregar analisis/opinion profesional. El lector se lleva algo util HOY.
2. EDUCAR (25%): Tutoriales, herramientas, explicaciones practicas que el lector pueda usar inmediatamente.
3. CONTEXTUALIZAR (15%): Casos reales de IA en gobierno/LegalTech de OTROS (Prometea, Boti, casos internacionales) con analisis critico.
4. COMPARTIR PROCESO (15%): La experiencia personal de Lucas como aprendizaje — DigestIA aparece ACA como subtema, no como pilar propio.
5. HUMANIZAR (5%): Reflexiones profesionales.

REGLA CLAVE: Cada trend debe responder la pregunta "¿que se lleva el lector despues de leer esto?" Si la respuesta es "conocer el proyecto de Lucas", NO sirve. Si la respuesta es "una herramienta nueva / un dato clave / una perspectiva util", SI sirve.

PROHIBIDO: trends que solo sirvan para hablar de DigestIA. DigestIA puede aparecer como ejemplo o contexto, NUNCA como tema central.

=== PILARES ACTUALIZADOS ===
"Tendencias_LegalTech" (40%): Noticias, datos, analisis de tendencias. El lector se informa.
"Educativo" (25%): Tutoriales, herramientas, como-hacer. El lector aprende algo practico.
"IA_gobierno" (15%): Casos reales de otros gobiernos/instituciones. El lector entiende el contexto.
"Proceso_personal" (15%): Experiencia de Lucas incluyendo DigestIA. El lector conecta con la persona.
"Personal" (5%): Reflexiones de carrera.

Genera JSON con 5 trends, 3 unique_angles, 2 content_gaps:
{
  "trends": [
    {
      "title": "string titulo enfocado en VALOR para el lector",
      "description": "string 2-3 oraciones basadas en datos reales",
      "relevance_score": 8,
      "saturation": "low",
      "lucas_angle": "string como Lucas puede aportar VALOR UNICO al lector con este tema (no como puede hablar de DigestIA)",
      "suggested_pillar": "Tendencias_LegalTech",
      "suggested_format": "carrusel",
      "source_url": "string URL real",
      "reader_takeaway": "string que se lleva el lector despues de leer este post"
    }
  ],
  "unique_angles": [
    { "angle": "string", "why_only_lucas": "string basado en experiencia real", "potential_virality": "medium" }
  ],
  "content_gaps": [
    { "topic": "string tema donde HAY DEMANDA y POCA OFERTA en espanol", "demand_signal": "string", "suggested_approach": "string enfocado en valor educativo" }
  ]
}

DISTRIBUCION OBLIGATORIA de los 5 trends:
- 2 deben ser "Tendencias_LegalTech" (curar datos reales)
- 1 debe ser "Educativo" (tutorial o herramienta practica)
- 1 debe ser "IA_gobierno" (caso real de otro gobierno/institucion)
- 1 debe ser "Proceso_personal" (experiencia de Lucas como aprendizaje)

saturation: "low"|"medium"|"high"
suggested_format: "carrusel"|"texto_imagen"|"video"|"encuesta"|"solo_texto"
potential_virality: "low"|"medium"|"high"
Solo JSON valido.`;

    let geminiResult;
    try {
      geminiResult = await generateWithGemini(geminiPrompt);
    } catch (gErr) {
      console.error('Gemini error:', gErr);
      return NextResponse.json({ error: 'Error en analisis Gemini: ' + gErr.message }, { status: 500 });
    }

    if (geminiResult._parseError) {
      return NextResponse.json({ error: 'Gemini no devolvio JSON valido. Intenta de nuevo.' }, { status: 500 });
    }

    const analysis = {
      trends: geminiResult.trends || [],
      unique_angles: geminiResult.unique_angles || [],
      content_gaps: geminiResult.content_gaps || [],
      sources: perplexityData.citations || [],
      search_results: perplexityData.search_results || [],
    };

    try {
      await supabase.from('analyses').insert({
        query,
        perplexity_data: perplexityData,
        gemini_analysis: geminiResult,
        sources: perplexityData.citations,
      });
    } catch (dbErr) {
      console.error('Supabase save error:', dbErr);
    }

    return NextResponse.json(analysis);

  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json({ error: err.message || 'Error desconocido' }, { status: 500 });
  }
}
