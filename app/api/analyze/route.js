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

=== PERFIL DE LUCAS VEGA (usar EXACTAMENTE esta información) ===

CARGO ACTUAL (2025-presente):
- Secretario del Digesto Jurídico & Modernización del Concejo Deliberante de Montecarlo, Misiones, Argentina
- Responsable de la modernización legislativa y digitalización de procesos

EXPERIENCIA PASADA (ya terminada):
- Ex concejal de Montecarlo (2021-2025), período finalizado el 10/12/2025
- Durante su gestión presentó 189 proyectos legislativos
- NO decir "es concejal" sino "fue concejal" o "ex concejal"

PROYECTO DigestIA (EN DESARROLLO, NO IMPLEMENTADO):
- DigestIA es un PROYECTO EN DESARROLLO previsto para 2026
- Concepto: chatbot municipal con IA para consulta de legislación local
- El digesto municipal tiene 172 ordenanzas (ya estaban digitalizadas ANTES de Lucas, él NO las digitalizó)
- El chatbot IA es un PLAN/PROYECTO, NO un producto en producción
- NO decir "DigestIA funciona", "DigestIA sirve a 25K vecinos" ni "implementamos DigestIA"
- SÍ decir "estamos desarrollando", "proyecto DigestIA", "planificamos lanzar"

STACK TECH: Claude, Gemini, Supabase, Vercel
IDENTIDAD: "Abogado Tech" y "Vibe Coder" — construye prototipos funcionales con IA sin ser programador tradicional
OBJETIVO: Posicionarse como referente LegalTech Argentina + empleo remoto USD 3K+/mes

PILARES DE CONTENIDO: 35% DigestIA, 25% LegalTech, 20% IA gobierno, 15% Aprendizaje, 5% Personal

=== REGLAS DE TONO ===
- Profesional pero cercano, como hablando con un colega
- NUNCA grandilocuente ni exagerado
- NO inventar logros que no existen
- Usar framing honesto: "estamos desarrollando", "mi experiencia como ex concejal me enseñó", "proyecto en fase de desarrollo"
- Los datos verificables son: 189 proyectos legislativos (gestión pasada), 172 ordenanzas en el digesto (preexistentes), cargo actual de Secretario
- Montecarlo tiene ~35,000 habitantes (no exagerar cifras)

=== INSTRUCCIÓN ===
Basándote EXCLUSIVAMENTE en los datos reales proporcionados, generá un JSON con este schema exacto:
{
  "trends": [
    {
      "title": "string título conciso",
      "description": "string 2-3 oraciones basadas en datos reales",
      "relevance_score": 8,
      "saturation": "low",
      "lucas_angle": "string cómo Lucas puede cubrir esto desde su experiencia REAL",
      "suggested_pillar": "DigestIA",
      "suggested_format": "carrusel",
      "source_url": "string URL real"
    }
  ],
  "unique_angles": [
    {
      "angle": "string",
      "why_only_lucas": "string basado en experiencia REAL verificable",
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

    let geminiAnalysis;
    try {
      geminiAnalysis = await askGemini(geminiPrompt);
    } catch (geminiErr) {
      console.error('Gemini error:', geminiErr);
      return NextResponse.json({ error: 'Error en análisis Gemini: ' + geminiErr.message }, { status: 500 });
    }

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
