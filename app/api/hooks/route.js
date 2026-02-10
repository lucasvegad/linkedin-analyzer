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

=== SOBRE LUCAS (datos VERIFICABLES, no exagerar) ===
- Cargo actual: Secretario del Digesto Jurídico & Modernización, Montecarlo, Misiones
- Ex concejal (2021-2025, gestión finalizada el 10/12/2025) — 189 proyectos legislativos presentados
- Proyecto DigestIA: chatbot IA para consulta legislativa municipal — EN DESARROLLO para 2026, NO implementado aún
- El digesto tiene 172 ordenanzas (ya estaban digitalizadas, Lucas NO las digitalizó)
- Montecarlo tiene ~35,000 habitantes
- Se define como "Abogado Tech" y "Vibe Coder" — construye prototipos con IA sin ser programador
- Stack: Claude, Gemini, Supabase, Vercel

=== REGLAS ESTRICTAS PARA LOS HOOKS ===
- NO decir "implementamos DigestIA" ni "DigestIA atiende a 25K vecinos" (es un proyecto, no está en producción)
- NO decir "soy concejal" (ya terminó su gestión)
- NO decir "digitalicé 172 ordenanzas" (ya estaban digitalizadas)
- SÍ usar: "estoy desarrollando", "mi experiencia como ex concejal", "proyecto en desarrollo"
- SÍ usar datos reales: 189 proyectos legislativos, cargo de Secretario, "Abogado Tech"
- Tono: profesional, cercano, honesto. NUNCA grandilocuente ni exagerado
- Los hooks deben sonar como una persona real hablando, no como marketing corporativo

=== FÓRMULAS (exactamente 1 de cada) ===
1. Contraintuitivo: "[Creencia común] está mal. Esto es lo que aprendí."
2. Número específico: "[N] [resultado concreto] en [tiempo]"
3. Pregunta retórica: "¿[Pregunta que genera curiosidad]?"
4. Historia personal: "Hace [tiempo], [situación]. Hoy [resultado]."
5. Controversial: "[Opinión fuerte y directa sobre el nicho]"
6. Lista prometida: "[N] cosas que [resultado valioso]"

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
