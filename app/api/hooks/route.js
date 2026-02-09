import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

export async function POST(request) {
  try {
    const { trend, query } = await request.json();
    if (!trend) {
      return NextResponse.json({ error: 'Falta el trend' }, { status: 400 });
    }

    const prompt = `Generá 6 hooks de LinkedIn para Lucas Vega.

Tema: "${trend.title}"
Contexto real: "${trend.description}"
Pilar: ${trend.suggested_pillar}
Ángulo de Lucas: "${trend.lucas_angle}"
Keyword original: "${query}"

Usá estas fórmulas (exactamente 1 de cada):
1. Contraintuitivo: "[Creencia común] está mal. Esto es lo que aprendí."
2. Número específico: "[N] [resultado concreto] en [tiempo]"
3. Pregunta retórica: "¿[Pregunta que genera curiosidad]?"
4. Historia personal: "Hace [tiempo], [situación]. Hoy [resultado]."
5. Controversial: "[Opinión fuerte y directa sobre el nicho]"
6. Lista prometida: "[N] cosas que [resultado valioso]"

Datos reales de Lucas para hacer los hooks creíbles:
- 172 ordenanzas municipales digitalizadas en un chatbot IA
- 25,000+ vecinos de Montecarlo con acceso 24/7
- 189 proyectos legislativos como concejal
- Primer municipio de Argentina con IA aplicada a legislación
- Stack: Claude + Gemini + Supabase + Vercel
- Abogado que construye apps sin saber programar ("Vibe Coder")

JSON schema exacto:
{
  "hooks": [
    {
      "text": "string hook exacto listo para publicar en LinkedIn",
      "formula_type": "contraintuitivo",
      "estimated_engagement": "high",
      "best_format": "texto_imagen",
      "follow_up_angle": "string dirección del post completo"
    }
  ],
  "recommended_top3": [0, 2, 4]
}

Para formula_type solo: "contraintuitivo", "numero", "pregunta", "historia", "controversial", "lista"
Para estimated_engagement solo: "low", "medium", "high", "viral"
Para best_format solo: "carrusel", "texto_imagen", "video", "solo_texto"
recommended_top3 es un array de 3 índices (0-5) de los mejores hooks.
Respondé SOLO con JSON válido.`;

    const data = await askGemini(prompt);
    return NextResponse.json(data);

  } catch (err) {
    console.error('Hooks error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
