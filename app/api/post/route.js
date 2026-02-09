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

ESTRUCTURA DEL POST:
Línea 1: El hook exacto (copiá tal cual)
[línea en blanco]
Líneas 3-5: Contexto o problema que resuelve
Líneas 6-10: Desarrollo con valor real y aprendizajes
Líneas 11-13: Dato concreto como prueba (usar datos reales de Lucas)
[línea en blanco]
Última línea: CTA con pregunta genuina que invite a comentar

REGLAS ESTRICTAS:
- Entre 150 y 200 palabras total
- NO poner links en el cuerpo del post
- NO empezar con "Hoy quiero compartir..." ni frases genéricas
- Máximo 3 emojis en TODO el post (no más)
- Saltos de línea frecuentes (máximo 2 oraciones por párrafo)
- Usar al menos 1 dato real: 172 ordenanzas, 25K vecinos, 189 proyectos, primer municipio IA Argentina
- Tono: profesional pero cercano, como hablando con un colega
- NO usar hashtags dentro del texto, van separados al final

JSON schema exacto:
{
  "post_body": "string con saltos usando \\n",
  "hashtags": ["#DigestIA", "#LegalTech", "#IAenGobierno"],
  "first_comment": "string texto para publicar como primer comentario",
  "best_posting_time": "Martes 8:00 AM GMT-3",
  "word_count": 175,
  "engagement_prediction": "high",
  "suggested_image": "string descripción del visual que debería acompañar el post"
}

Para engagement_prediction solo: "low", "medium", "high"
Para best_posting_time elegí entre: "Martes 8:00 AM GMT-3", "Martes 12:00 PM GMT-3", "Miércoles 8:00 AM GMT-3", "Miércoles 17:00 PM GMT-3", "Jueves 8:00 AM GMT-3", "Jueves 12:00 PM GMT-3"
hashtags debe tener entre 3 y 5 elementos, siempre incluir #DigestIA y #LegalTech
Respondé SOLO con JSON válido.`;

    const data = await askGemini(prompt);

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
