import { NextResponse } from 'next/server';
import { generateWithGemini, askGemini } from '../../../lib/gemini';

export async function POST(request) {
  try {
    const { trend, query } = await request.json();
    if (!trend) {
      return NextResponse.json({ error: 'Falta el trend' }, { status: 400 });
    }

    const prompt = `Genera 6 hooks de LinkedIn para Lucas Vega.

Tema: "${trend.title}"
Contexto: "${trend.description}"
Pilar: ${trend.suggested_pillar}
Angulo: "${trend.lucas_angle}"

=== SOBRE LUCAS (NO exagerar) ===
Cargo actual: Secretario del Digesto Juridico & Modernizacion, Montecarlo, Misiones.
Ex concejal (2021-2025, gestion terminada). 189 proyectos legislativos.
DigestIA: proyecto de chatbot IA EN DESARROLLO para 2026, NO implementado.
Las 172 ordenanzas ya estaban digitalizadas (el NO las digitalizo).
"Abogado Tech" y "Vibe Coder". Stack: Claude, Gemini, Supabase, Vercel.

PROHIBIDO: "soy concejal", "digitalice ordenanzas", "DigestIA sirve a 25K vecinos".
CORRECTO: "ex concejal", "proyecto en desarrollo", "estoy construyendo".

Formulas (1 de cada):
1. Contraintuitivo: "[Creencia comun] esta mal."
2. Numero: "[N] [resultado] en [tiempo]"
3. Pregunta retorica
4. Historia personal: "Hace [tiempo]..."
5. Controversial: Opinion fuerte
6. Lista: "[N] cosas que [resultado]"

Tono: persona real, cercano, honesto. NO marketing corporativo.

JSON exacto:
{
  "hooks": [
    {
      "text": "string hook listo para publicar",
      "formula_type": "contraintuitivo",
      "estimated_engagement": "high",
      "best_format": "texto_imagen",
      "follow_up_angle": "string direccion del post"
    }
  ],
  "recommended_top3": [0, 2, 4]
}

formula_type: "contraintuitivo"|"numero"|"pregunta"|"historia"|"controversial"|"lista"
estimated_engagement: "low"|"medium"|"high"|"viral"
best_format: "carrusel"|"texto_imagen"|"video"|"solo_texto"
Responde SOLO JSON valido.`;

    let data;
    try {
      data = await generateWithGemini(prompt);
    } catch (gErr) {
      console.error('Gemini hooks error:', gErr);
      return NextResponse.json({ error: 'Error generando hooks: ' + gErr.message }, { status: 500 });
    }

    if (data._parseError) {
      return NextResponse.json({ error: 'Gemini no devolvio JSON valido. Intenta de nuevo.' }, { status: 500 });
    }

    // Ensure structure
    const result = {
      hooks: data.hooks || [],
      recommended_top3: data.recommended_top3 || [0, 1, 2],
    };

    return NextResponse.json(result);

  } catch (err) {
    console.error('Hooks error:', err);
    return NextResponse.json({ error: err.message || 'Error desconocido' }, { status: 500 });
  }
}
