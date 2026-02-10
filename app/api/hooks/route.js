import { askGemini } from '../../../lib/gemini';

export async function POST(request) {
  try {
    const { trend, query } = await request.json();
    
    if (!trend) {
      return Response.json({ error: 'Falta el trend' }, { status: 400 });
    }

    const prompt = `Generá 6 hooks de LinkedIn para Lucas Vega.

Tema: "${trend.title}"
Contexto: "${trend.description}"

SOBRE LUCAS:
- Legal Tech Lead en Digesto Jurídico (Montecarlo)
- Concejal con 172 ordenanzas digitalizadas, 25K+ vecinos
- Stack: Claude + Gemini + Supabase + Vercel
- Abogado "Vibe Coder" (construye apps sin programar)

SOBRE DIGESTIA:
- Es un PROYECTO EN PLANIFICACIÓN para 2026
- NO está en ejecución actualmente
- Objetivo: Aplicar IA a legislación municipal
- Estado: En desarrollo conceptual, no implementado

REGLAS IMPORTANTES:
- NO digas "DigestIA está funcionando" o "implementamos DigestIA"
- SÍ podés decir "estamos planificando DigestIA", "próximo proyecto", "roadmap 2026"
- Enfocá los hooks en lo que YA logró (189 proyectos presentados durante su gestión de concejal, aprobación de proyecto de chatbot, etc.)
- Si mencionás DigestIA, siempre como futuro/planificación

Usá estas fórmulas (exactamente 1 de cada):
1. Contraintuitivo: "[Creencia común] está mal. Esto es lo que aprendí."
2. Número específico: "[N] [resultado concreto] en [tiempo]"
3. Pregunta retórica: "¿[Pregunta que genera curiosidad]?"
4. Historia personal: "Hace [tiempo], [situación]. Hoy [resultado]."
5. Controversial: "[Opinión fuerte y directa sobre el nicho]"
6. Lista prometida: "[N] cosas que [resultado valioso]"

Devolvé SOLO un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
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
    return Response.json(data);

  } catch (err) {
    console.error('Hooks error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
