import { NextResponse } from 'next/server';
import { generateWithGemini, askGemini } from '../../../lib/gemini';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const { hook, trend } = await request.json();
    if (!hook || !trend) {
      return NextResponse.json({ error: 'Faltan hook y trend' }, { status: 400 });
    }

    const prompt = `Escribi un post de LinkedIn para Lucas Vega. Tu trabajo es escribir como escribiria un profesional real contando su proceso, NO como un copywriter de marketing.

Hook seleccionado: "${hook.text}"
Pilar: ${trend.suggested_pillar}
Formato: ${hook.best_format}
Contexto del trend: "${trend.description}"
Angulo de Lucas: "${trend.lucas_angle}"

=============================================
PERFIL VERIFICABLE DE LUCAS VEGA
(Solo usar estos datos. No inventar, no inflar.)
=============================================

CARGO ACTUAL (dic 2025 - presente):
- Secretario del Digesto Juridico & Modernizacion, Concejo Deliberante de Montecarlo, Misiones, Argentina

EXPERIENCIA PASADA (terminada):
- Ex concejal de Montecarlo (2021-2025, gestion finalizada 10/12/2025)
- Presento 189 proyectos legislativos durante su gestion
- +10 anos de experiencia legal (litigio privado + gestion publica)

PROYECTO DigestIA:
- Chatbot IA para consulta de legislacion municipal
- Estado: EN DESARROLLO, roadmap 2026. NO esta implementado, NO esta en produccion
- Base: Digesto Juridico certificado (4ta Consolidacion, nov 2025), 176 normas vigentes a partir del 1/1/2026
- Lucas NO digitalizo las ordenanzas — el Digesto ya existia certificado
- Stack tecnico: Claude API, Gemini, Supabase, Vercel

DATOS DEMOGRAFICOS:
- Montecarlo ciudad: 25,981 habitantes (Censo 2022 INDEC). NO usar 35,000 (eso es el departamento completo)

IDENTIDAD PROFESIONAL:
- Se posiciona como profesional tecnico que comparte su proceso
- NO usar "Vibe Coder" ni "Abogado Tech" como etiquetas — esas son autodescripciones informales, no titulos
- El expertise se DEMUESTRA con datos y proceso, no se ANUNCIA con etiquetas

=============================================
REGLAS DE VOZ "LUCAS CALIBRADO"
(Basadas en benchmark de referentes LegalTech: Corvalan, Colin Levy, Federico Ast)
=============================================

FORMULA DE CONTENIDO: 70% valor educativo + 20% proceso personal + 10% logros propios

1. PRIMERA PERSONA PLURAL siempre que sea posible:
   - SI: "Descubrimos que...", "Estamos trabajando en...", "Aprendimos que..."
   - NO: "Yo implemente...", "Yo soy el que..."

2. DATOS COMO PROTAGONISTA (no Lucas como protagonista):
   - SI: "Redujimos de 3 dias a 15 minutos la busqueda normativa"
   - NO: "Soy un innovador que transformo la legislacion"

3. VULNERABILIDAD CONTROLADA — compartir obstaculos y errores:
   - SI: "La primera vez que intentamos X, fue un desastre. Esto tuvimos que cambiar..."
   - SI: "Todavia no lo logramos, pero esto es lo que estamos probando..."
   - NO: Presentar todo como exito sin fisuras

4. NUNCA AUTOPROCLAMARSE:
   - PROHIBIDO: "pionero", "visionario", "lider", "revolucionario", "primer municipio con IA"
   - PROHIBIDO: "estoy transformando", "estoy revolucionando"
   - El experto se demuestra, no se anuncia

5. CONTEXTO DE MUNICIPIO CHICO COMO VENTAJA (no como limitacion):
   - SI: "Lo que funciona en un municipio de 25,000 habitantes puede escalar a cualquier gobierno local"
   - NO: tono de victima o de heroe contra las circunstancias

6. PREGUNTAS GENUINAS AL CIERRE (no genericas):
   - SI: "¿Otros municipios estan usando herramientas similares? Me interesa escuchar experiencias"
   - SI: "¿Trabajas en GovTech? ¿Como manejan [problema especifico]?"
   - NO: "¿Que opinan?", "¿Que piensan?", "¿Estan de acuerdo?"

7. LO PERSONAL APARECE TARDE, NO AL PRINCIPIO:
   - El hook es un dato, pregunta, o micro-historia universal
   - La experiencia personal de Lucas aparece recien en el 3er o 4to parrafo
   - Y siempre como "nosotros/estamos trabajando", no como "yo logre"

=============================================
PROHIBICIONES ABSOLUTAS
=============================================
- "DigestIA atiende/sirve a 25K vecinos" (no esta en produccion)
- "Soy concejal" o "como concejal" en presente (ya termino)
- "Digitalice/digitalizamos 172 ordenanzas" (ya estaban digitalizadas, y son 176)
- "Primer municipio de Argentina con IA" (no verificable)
- "35,000 habitantes" (son 25,981 en la ciudad)
- Empezar con "Hoy quiero compartir...", "Les cuento que...", "Yo creo que..."
- Tono de marketing corporativo, comunicado de prensa, o manifiesto visionario
- Humble bragging (es peor percibido que presumir directamente segun Harvard)
- Emojis decorativos excesivos (maximo 2-3 en todo el post, y solo si aportan)

=============================================
ESTRUCTURA DEL POST (formato PAS + Storytelling)
=============================================

HOOK (primeros 210 caracteres, ANTES del "ver mas"):
- Dato concreto, pregunta provocadora, o micro-historia
- NUNCA empezar con "yo"
- Debe generar curiosidad para que hagan clic en "ver mas"

[linea en blanco]

PROBLEMA/CONTEXTO (2-3 oraciones):
- Anclar en la realidad del LECTOR, no en la de Lucas
- Usar datos reales y verificables
- Que el lector piense "esto me pasa a mi tambien"

[linea en blanco]

INSIGHT/PROCESO (el corazon del post):
- Lo que se aprendio, con datos especificos
- Si aplica: lista numerada de 2-3 puntos (no mas)
- Aqui puede aparecer la experiencia personal, en plural, como caso de estudio

[linea en blanco]

CTA (cierre):
- Pregunta genuina y especifica que invite al dialogo
- Dirigida a un publico concreto ("¿Trabajas en GovTech?", "¿Otros municipios...")
- NO preguntas vacias como "¿Que opinan?"

HASHTAGS (separados al final, en linea aparte):
- 3-5 maximo
- Siempre incluir #LegalTech y #GovTech
- #DigestIA solo si el post habla del proyecto

=============================================
ESPECIFICACIONES TECNICAS
=============================================
- Longitud total: entre 1,300 y 1,600 caracteres (este es el sweet spot verificado para engagement)
- NO links en el cuerpo del post (van en primer comentario)
- Saltos de linea frecuentes — maximo 2 oraciones por bloque visual
- Sin hashtags dentro del texto
- El post debe poder leerse en 60-90 segundos

=============================================
RESPONDE EN JSON CON ESTE SCHEMA EXACTO:
=============================================
{
  "post_body": "string completo del post con \\n para saltos de linea",
  "hashtags": ["#LegalTech", "#GovTech", "#DigestIA"],
  "first_comment": "string para publicar como primer comentario (incluir link relevante si aplica, y un complemento que aporte valor adicional)",
  "best_posting_time": "Martes 8:00 AM GMT-3",
  "char_count": 1400,
  "engagement_prediction": "medium",
  "suggested_image": "string descripcion del visual que deberia acompanar el post",
  "tone_check": "string breve explicando por que este post NO es grandilocuente y SI aporta valor"
}

engagement_prediction: "low"|"medium"|"high"
best_posting_time: elegir entre "Martes 8:00 AM GMT-3", "Martes 9:00 AM GMT-3", "Jueves 8:00 AM GMT-3", "Jueves 9:00 AM GMT-3"
hashtags: 3-5 items
char_count: debe estar entre 1300 y 1600
Responde SOLO JSON valido, sin backticks ni texto adicional.`;

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

    // Ensure structure with defaults
    const result = {
      post_body: data.post_body || '',
      hashtags: data.hashtags || ['#LegalTech', '#GovTech'],
      first_comment: data.first_comment || '',
      best_posting_time: data.best_posting_time || 'Martes 8:00 AM GMT-3',
      char_count: data.char_count || (data.post_body ? data.post_body.length : 0),
      engagement_prediction: data.engagement_prediction || 'medium',
      suggested_image: data.suggested_image || '',
      tone_check: data.tone_check || '',
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
