import { generateWithGemini } from '../../../lib/gemini';

export async function POST(request) {
  try {
    const { hook, trend } = await request.json();
    
    const prompt = `Escribí un post completo para LinkedIn de Lucas Vega.

Hook: "${hook.text}"
Tema: "${trend.title}"

PERFIL DE LUCAS (usar solo lo real):
✅ Legal Tech Lead en Digesto Jurídico (Montecarlo, Misiones)
✅ Concejal: 172 ordenanzas digitalizadas en chatbot IA
✅ 25,000+ vecinos con acceso 24/7 a normativa
✅ 189 proyectos legislativos presentados
✅ Stack: Claude + Gemini + Supabase + Vercel
✅ Abogado "Vibe Coder" (sin background técnico)

DIGESTIA - MUY IMPORTANTE:
⚠️ Es un PROYECTO EN PLANIFICACIÓN para 2026
⚠️ NO está implementado aún
⚠️ NO decir "tenemos DigestIA funcionando"
✅ SÍ decir: "estamos desarrollando", "próximo paso", "en roadmap", "planificación 2025"

ESTRUCTURA DEL POST:
1. Hook (enganchante)
2. Contexto personal (experiencia real con ordenanzas/chatbot)
3. Insight sobre el tema
4. CTA (llamado a la acción)

TONO: Profesional, humilde, construyendo en público.

Devolvé JSON:
{
  "post_body": "texto completo del post (150-200 palabras)",
  "hashtags": ["#LegalTech", "#DigestIA", "#Innovación", "#Municipios", "#IA"],
  "word_count": 175,
  "engagement_prediction": "high",
  "first_comment": "texto para primer comentario"
}`;

    const data = await generateWithGemini(prompt);
    return Response.json(data);

  } catch (err) {
    console.error('Post error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
