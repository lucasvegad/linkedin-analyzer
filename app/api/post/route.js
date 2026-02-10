import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const { hook, trend } = await request.json();
    if (!hook || !trend) {
      return NextResponse.json({ error: 'Faltan hook y trend' }, { status: 400 });
    }

    const prompt = `Escribí un post COMPLETO de LinkedIn para Lucas Vega.

Hook seleccionado: "${hook.text}"
Pilar: ${trend.suggested_pillar}
Formato sugerido: ${hook.best_format}
Contexto del trend: "${trend.description}"
Ángulo de Lucas: "${trend.lucas_angle}"

=== PERFIL VERIFICABLE DE LUCAS (NO inventar ni exagerar) ===
- Cargo ACTUAL: Secretario del Digesto Jurídico & Modernización, Concejo Deliberante de Montecarlo, Misiones
- Ex concejal (2021-2025, gestión terminada el 10/12/2025) — presentó 189 proyectos legislativos
- Proyecto DigestIA: chatbot IA para consulta de legislación municipal — PROYECTO EN DESARROLLO para 2026
- Las 172 ordenanzas del digesto ya estaban digitalizadas (Lucas NO las digitalizó)
- Montecarlo tiene ~35,000 habitantes
- Se identifica como "Abogado Tech" y "Vibe Coder"
- Stack: Claude, Gemini, Supabase, Vercel
- +10 años de experiencia legal (litigio privado + gestión pública)

=== PROHIBICIONES ABSOLUTAS ===
- NO escribir "DigestIA atiende/sirve a 25K vecinos" (no está en producción)
- NO escribir "soy concejal" ni "como concejal" (ya no lo es)
- NO escribir "digitalicé/digitalizamos 172 ordenanzas" (ya estaban hechas)
- NO escribir "primer municipio de Argentina con IA" (no es verificable)
- NO usar tono de marketing corporativo ni frases grandilocuentes
- NO empezar con "Hoy quiero compartir..." ni "Les cuento que..."

=== SÍ USAR ===
- "En mi gestión como concejal (2021-2025) presenté 189 proyectos..."
- "Estoy desarrollando DigestIA, un proyecto de chatbot IA para..."
- "Como Secretario del Digesto, trabajo en modernizar..."
- "Mi experiencia en el sector público me enseñó que..."
- Tono de persona real contando su experiencia, no de influencer

=== ESTRUCTURA DEL POST ===
Línea 1: El hook exacto (copiá tal cual el proporcionado)
[línea en blanco]
Líneas 3-5: Contexto o problema (desde experiencia real)
Líneas 6-10: Desarrollo con valor (aprendizajes concretos)
Líneas 11-13: Dato verificable como prueba
[línea en blanco]
Última línea: CTA con pregunta genuina que invite a comentar

=== REGLAS DE FORMATO ===
- Entre 150 y 200 palabras total
- NO links en el cuerpo del post
- Máximo 3 emojis en TODO el post
- Saltos de línea frecuentes (máximo 2 oraciones por párrafo)
- NO hashtags dentro del texto, van separados al final
- Que suene como una persona real escribiendo, no como IA

JSON schema exacto:
{
  "post_body": "string con saltos usando \\n",
  "hashtags": ["#DigestIA", "#LegalTech", "#IAenGobierno"],
  "first_comment": "string texto para publicar como primer comentario (incluir link relevante si aplica)",
  "best_posting_time": "Martes 8:00 AM GMT-3",
  "word_count": 175,
  "engagement_prediction": "high",
  "suggested_image": "string descripción del visual que debería acompañar el post"
}

Para engagement_prediction solo: "low", "medium", "high"
Para best_posting_time elegí entre: "Martes 8:00 AM GMT-3", "Martes 12:00 PM GMT-3", "Miércoles 8:00 AM GMT-3", "Miércoles 17:00 PM GMT-3", "Jueves 8:00 AM GMT-3", "Jueves 12:00 PM GMT-3"
hashtags debe tener entre 3 y 5 elementos, siempre incluir #DigestIA y #LegalTech
Respondé SOLO con JSON válido.`;

    let data;
    try {
      data = await askGemini(prompt);
    } catch (geminiErr) {
      console.error('Gemini post error:', geminiErr);
      return NextResponse.json({ error: 'Error generando post: ' + geminiErr.message }, { status: 500 });
    }

    // Guardar post generado en Supabase
    try {
      await supabase.from('generated_posts').insert({
        hook: hook.text,
        post_body: data.post_body,
        hashtags: data.hashtags,
        pillar: trend.suggested_pillar,
      });
    } catch (dbErr) {
      console.error('Save post error:', dbErr);
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error('Post error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
