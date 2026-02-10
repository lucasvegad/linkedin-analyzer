import { NextResponse } from 'next/server';
import { generateWithGemini, askGemini } from '../../../lib/gemini';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const { hook, trend } = await request.json();
    if (!hook || !trend) {
      return NextResponse.json({ error: 'Faltan hook y trend' }, { status: 400 });
    }

    const prompt = `Escribi un post COMPLETO de LinkedIn para Lucas Vega.

Hook: "${hook.text}"
Pilar: ${trend.suggested_pillar}
Contexto: "${trend.description}"
Angulo: "${trend.lucas_angle}"

=== PERFIL VERIFICABLE (NO inventar ni exagerar) ===
Cargo ACTUAL: Secretario del Digesto Juridico & Modernizacion, Concejo Deliberante de Montecarlo, Misiones.
Ex concejal (2021-2025, gestion terminada 10/12/2025). 189 proyectos legislativos presentados.
DigestIA: chatbot IA para consulta legislativa - PROYECTO EN DESARROLLO 2026, NO implementado.
172 ordenanzas en el digesto (ya estaban digitalizadas, Lucas NO las digitalizo).
Montecarlo tiene ~35,000 habitantes.
+10 anos experiencia legal. "Abogado Tech" y "Vibe Coder".

=== PROHIBIDO ===
- "DigestIA atiende/sirve a 25K vecinos" (no esta en produccion)
- "soy concejal" o "como concejal" (ya no lo es)
- "digitalice 172 ordenanzas" (ya estaban digitalizadas)
- "primer municipio de Argentina con IA" (no verificable)
- Tono de marketing corporativo o frases grandilocuentes
- "Hoy quiero compartir..." o "Les cuento que..."

=== CORRECTO ===
- "En mi gestion como concejal (2021-2025) presente 189 proyectos..."
- "Estoy desarrollando DigestIA, un proyecto de chatbot IA para..."
- "Como Secretario del Digesto, trabajo en modernizar..."
- Tono de persona real contando su experiencia

ESTRUCTURA:
Linea 1: Hook exacto
[linea en blanco]
Lineas 3-5: Contexto/problema desde experiencia real
Lineas 6-10: Desarrollo con valor y aprendizajes
Lineas 11-13: Dato verificable como prueba
[linea en blanco]
Ultima linea: CTA con pregunta genuina

REGLAS: 150-200 palabras. NO links en cuerpo. Max 3 emojis. Saltos de linea frecuentes.

JSON exacto:
{
  "post_body": "string con \\n para saltos",
  "hashtags": ["#DigestIA", "#LegalTech", "#IAenGobierno"],
  "first_comment": "string para 1er comentario",
  "best_posting_time": "Martes 8:00 AM GMT-3",
  "word_count": 175,
  "engagement_prediction": "high",
  "suggested_image": "string descripcion del visual"
}

engagement_prediction: "low"|"medium"|"high"
best_posting_time: "Martes 8:00 AM GMT-3" o "Miercoles 8:00 AM GMT-3" o "Jueves 8:00 AM GMT-3"
hashtags: 3-5 items, siempre incluir #DigestIA y #LegalTech
Responde SOLO JSON valido.`;

    let data;
    try {
      data = await generateWithGemini(prompt);
    } catch (gErr) {
      console.error('Gemini post error:', gErr);
      return NextResponse.json({ error: 'Error generando post: ' + gErr.message }, { status: 500 });
    }

    if (data._parseError) {
      return NextResponse.json({ error: 'Gemini no devolvio JSON valido. Intenta de nuevo.' }, { status: 500 });
    }

    // Ensure structure
    const result = {
      post_body: data.post_body || '',
      hashtags: data.hashtags || ['#DigestIA', '#LegalTech'],
      first_comment: data.first_comment || '',
      best_posting_time: data.best_posting_time || 'Martes 8:00 AM GMT-3',
      word_count: data.word_count || 0,
      engagement_prediction: data.engagement_prediction || 'medium',
      suggested_image: data.suggested_image || '',
    };

    // Save to Supabase (non-blocking)
    try {
      await supabase.from('generated_posts').insert({
        hook: hook.text,
        post_body: result.post_body,
        hashtags: result.hashtags,
        pillar: trend.suggested_pillar,
      });
    } catch (dbErr) {
      console.error('Save post error (non-blocking):', dbErr);
    }

    return NextResponse.json(result);

  } catch (err) {
    console.error('Post error:', err);
    return NextResponse.json({ error: err.message || 'Error desconocido' }, { status: 500 });
  }
}
