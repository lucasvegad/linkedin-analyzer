import { NextResponse } from 'next/server';
import { generateWithGemini, askGemini } from '../../../lib/gemini';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const { hook, trend } = await request.json();
    if (!hook || !trend) {
      return NextResponse.json({ error: 'Faltan hook y trend' }, { status: 400 });
    }

    const prompt = `Escribi un post de LinkedIn para Lucas Vega.

Hook: "${hook.text}"
Pilar: ${trend.suggested_pillar}
Contexto: "${trend.description}"
Angulo: "${trend.lucas_angle}"
Valor para el lector: "${trend.reader_takeaway || 'Informacion util y accionable'}"

=== PERFIL LUCAS VEGA ===
Cargo: Secretario del Digesto Juridico & Modernizacion, Montecarlo, Misiones (25,981 hab).
Ex concejal (2021-2025). 189 proyectos legislativos. +10 anos legal.
DigestIA: chatbot IA legislativo EN DESARROLLO 2026, no implementado.
Digesto certificado: 176 normas vigentes. Lucas NO digitalizo las ordenanzas.

=== ESTRATEGIA SEGUN PILAR ===

Si pilar es "Tendencias_LegalTech":
- El post CURA informacion real. Lucas es el filtro inteligente entre la noticia y el lector.
- Estructura: Dato impactante -> Contexto -> Por que importa -> Que significa para el sector -> Pregunta
- Lucas opina como profesional del sector, no promociona su proyecto
- DigestIA puede mencionarse BREVEMENTE como ejemplo si es natural, nunca como tema central

Si pilar es "Educativo":
- El post ENSENA algo practico. El lector se va con una herramienta, tecnica, o conocimiento nuevo.
- Estructura: Problema comun -> Solucion paso a paso -> Ejemplo concreto -> Pregunta
- Lucas comparte desde su experiencia, como alguien que esta aprendiendo y comparte el camino
- Tono: "Esto me funciono" no "Yo soy experto"

Si pilar es "IA_gobierno":
- El post ANALIZA un caso real de OTRA institucion/gobierno. Lucas aporta perspectiva critica.
- Estructura: Caso real -> Datos -> Analisis critico -> Leccion aplicable -> Pregunta
- Lucas conecta con su experiencia en gobierno municipal como contexto, no como protagonista

Si pilar es "Proceso_personal":
- AQUI si puede hablar de DigestIA y su experiencia directa.
- Estructura: Situacion/obstaculo -> Que aprendio -> Dato concreto -> Pregunta
- Tono vulnerable y honesto: "La primera vez que probe X, fallo", "Todavia no lo logramos pero..."
- NUNCA presentar como exito, siempre como proceso

=== VOZ CALIBRADA ===
- Primera persona plural: "Descubrimos", "Aprendimos", "Encontramos"
- DATOS como protagonista, no Lucas
- NUNCA autoproclamarse: sin "pionero", "visionario", "lider"
- Preguntas genuinas al cierre dirigidas a audiencia especifica
- Lo personal aparece tarde, no al inicio
- 70% valor educativo + 20% proceso + 10% logros

PROHIBIDO: "DigestIA sirve a X vecinos", "soy concejal", "digitalice ordenanzas", "35,000 hab", "primer municipio con IA", humble bragging, superlativos, tono de marketing

=== ESTRUCTURA PAS (1,300-1,600 caracteres) ===
HOOK (210 chars max): Dato, pregunta, micro-historia. NUNCA "yo"
PROBLEMA/CONTEXTO: Realidad del LECTOR
INSIGHT/VALOR: Lo que el lector se lleva. Datos, herramientas, perspectiva
CTA: Pregunta genuina y especifica
HASHTAGS: 3-5 al final

=== IMAGEN CON BRANDING ===
Genera prompt en INGLES (80-150 palabras) para Google Imagen 3 con esta identidad:
- Colores: deep navy blue (#0B1931) dominante + emerald green (#00C17A) acentos
- Dark theme, estetica tech-legal, rim lighting verde
- Composicion limpia, profundidad de campo corta
- Si hay persona: hombre latinoamericano ~30 anos, profesional
- NO fondos blancos, NO stock corporativo, NO texto en imagen
- Terminologia fotografica (lente, ISO, etc.)

=== JSON ===
{
  "post_body": "string con \\n",
  "hashtags": ["#LegalTech", "#GovTech"],
  "first_comment": "string con link relevante",
  "best_posting_time": "Martes 8:00 AM GMT-3",
  "char_count": 1400,
  "engagement_prediction": "medium",
  "suggested_image": "string en espanol",
  "image_prompt": "string en INGLES 80-150 palabras con branding navy+green",
  "tone_check": "string explicando que valor se lleva el lector"
}

Solo JSON valido.`;

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

    const result = {
      post_body: data.post_body || '',
      hashtags: data.hashtags || ['#LegalTech', '#GovTech'],
      first_comment: data.first_comment || '',
      best_posting_time: data.best_posting_time || 'Martes 8:00 AM GMT-3',
      char_count: data.char_count || (data.post_body ? data.post_body.length : 0),
      engagement_prediction: data.engagement_prediction || 'medium',
      suggested_image: data.suggested_image || '',
      image_prompt: data.image_prompt || '',
      tone_check: data.tone_check || '',
    };

    try {
      await supabase.from('generated_posts').insert({
        hook: hook.text,
        post_body: result.post_body,
        hashtags: result.hashtags,
        pillar: trend.suggested_pillar,
      });
    } catch (dbErr) {
      console.error('Save post error:', dbErr);
    }

    return NextResponse.json(result);

  } catch (err) {
    console.error('Post error:', err);
    return NextResponse.json({ error: err.message || 'Error desconocido' }, { status: 500 });
  }
}
