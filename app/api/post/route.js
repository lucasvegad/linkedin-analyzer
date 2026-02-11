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
- Montecarlo ciudad: 25,981 habitantes (Censo 2022 INDEC). NO usar 35,000

IDENTIDAD PROFESIONAL:
- Profesional tecnico que comparte su proceso
- El expertise se DEMUESTRA con datos y proceso, no se ANUNCIA con etiquetas

=============================================
REGLAS DE VOZ "LUCAS CALIBRADO"
=============================================

FORMULA: 70% valor educativo + 20% proceso personal + 10% logros propios

1. PRIMERA PERSONA PLURAL: "Descubrimos...", "Estamos trabajando...", "Aprendimos..."
2. DATOS COMO PROTAGONISTA: No Lucas como protagonista
3. VULNERABILIDAD CONTROLADA: Compartir obstaculos y errores
4. NUNCA AUTOPROCLAMARSE: Prohibido "pionero", "visionario", "lider", "revolucionario"
5. MUNICIPIO CHICO COMO VENTAJA: "Lo que funciona en 25,000 hab puede escalar"
6. PREGUNTAS GENUINAS: "¿Trabajas en GovTech? ¿Como manejan X?"
7. LO PERSONAL APARECE TARDE: Hook es dato/pregunta. Lucas aparece en 3er-4to parrafo

PROHIBIDO: "DigestIA sirve a X vecinos", "soy concejal", "digitalice ordenanzas", "35,000 hab", "primer municipio con IA", "Hoy quiero compartir...", humble bragging, superlativos

=============================================
ESTRUCTURA PAS (1,300-1,600 caracteres)
=============================================

HOOK (210 chars max, antes del "ver mas"):
- Dato, pregunta provocadora, o micro-historia. NUNCA "yo"

[linea en blanco]

PROBLEMA/CONTEXTO (2-3 oraciones):
- Realidad del LECTOR, no de Lucas

[linea en blanco]

INSIGHT/PROCESO:
- Lo que se aprendio con datos. Lista 2-3 puntos si aplica
- Experiencia personal en plural como caso de estudio

[linea en blanco]

CTA: Pregunta genuina y especifica

HASHTAGS: 3-5 al final. Siempre #LegalTech y #GovTech

=============================================
IMAGEN CON BRANDING — PROMPT PROFESIONAL
=============================================

Genera un prompt profesional en INGLES para crear la imagen del post con Google Imagen 3 (Nano Banana Pro).

El prompt DEBE seguir la ARQUITECTURA DE 7 CAPAS en narrativa fluida (80-150 palabras):

CAPA 1 - SUJETO: Que aparece (persona, objeto, escena). Ser especifico.
CAPA 2 - CONTEXTO: Donde ocurre.
CAPA 3 - LIGHTING: Tipo de iluminacion.
CAPA 4 - ESTILO: Estilo visual.
CAPA 5 - COMPOSICION: Angulo y encuadre.
CAPA 6 - MOOD: Emocion/atmosfera.
CAPA 7 - QUALITY: Tecnica fotografica.

=== IDENTIDAD VISUAL "LUCAS VEGA BRAND" (OBLIGATORIO en cada prompt) ===

La imagen DEBE reflejar esta identidad de marca:

PALETA DE COLORES (incorporar siempre):
- Color dominante: deep navy blue (#0B1931) — fondos, sombras, ambiente general
- Acento principal: emerald green (#00C17A) — highlights, bordes de luz, elementos que llaman atencion
- Acento secundario: muted gold (#886E1B) — solo para detalles minimos de prestigio
- Textos/elementos claros: white y soft gray (#9EA6C1)
- REGLA: La combinacion navy + emerald green SIEMPRE debe ser visible en la imagen

ATMOSFERA VISUAL:
- Dark theme predominante — fondos oscuros navy, iluminacion dramatica
- Estilo tech-institucional: mezcla de tecnologia moderna con seriedad legal/gubernamental
- Elementos tech sutiles: pantallas con codigo o interfaces, luz de monitor, teclados, terminales
- Elementos legales sutiles: libros de derecho, documentos oficiales, sellos, carpetas
- Fusion de ambos mundos: nunca puramente tech ni puramente legal
- Estetica limpia y minimalista, nunca recargada

ILUMINACION CARACTERISTICA:
- Rim lighting o edge lighting en emerald green (contorno verde en sujetos/objetos)
- Luz principal suave y direccional (no plana)
- Glow teal/verde sutil en pantallas o elementos tecnologicos
- Contraste alto: fondos muy oscuros con highlights brillantes

COMPOSICION PREFERIDA:
- Profundidad de campo corta (fondo desenfocado)
- Composicion limpia con espacio negativo
- Si hay persona: hombre latinoamericano de ~30 anos, profesional, ropa formal pero moderna (no traje estricto), expresion segura y cercana

LO QUE NO DEBE TENER LA IMAGEN:
- Fondos blancos o claros genericos (eso NO es la marca)
- Estetica de stock photo corporativo (gente sonriendo forzado, oficinas genericas)
- Colores calidos dominantes (naranja, rojo, amarillo) — la marca es fria: navy + green
- Texto o letras en la imagen (text rendering es impredecible)
- Mas de 5 objetos especificos (numerical reasoning debil)
- Escenas demasiado complejas o recargadas

BUENOS EJEMPLOS de prompts con branding Lucas Vega:
- "A Latin American professional in his early 30s sitting at a dark navy workspace, laptop open with code interface glowing in emerald green light. Legal documents and a small Argentine flag on the desk. Dramatic rim lighting in teal-green outlining his silhouette against the deep navy background. Professional editorial photography, cinematic mood. Medium close-up, rule of thirds, shallow depth of field with soft bokeh. Confident and focused expression. Shot on Sony A7IV, 85mm f/1.4 lens, ISO 400, moody color grading emphasizing navy blues and emerald greens, 8K resolution."
- "Overhead flat lay of a dark navy wooden desk. A laptop showing a chatbot interface with emerald green UI elements. Stack of Argentine legal code books with dark leather covers. A coffee cup, minimalist pen, and small succulent plant. Soft directional light from upper left creating long shadows. Emerald green LED strip glow along desk edge. Clean minimalist tech-legal aesthetic. Professional product photography, 35mm lens, f/2.8, high dynamic range, dark moody color palette with navy and green accents, 4K resolution."
- "Abstract close-up of a computer screen displaying legal document text, bathed in emerald green monitor glow. Deep navy blue reflections on the glass surface. Blurred bokeh lights in green and gold in the background. Atmospheric and contemplative mood. Macro photography style, extremely shallow depth of field. Shot on Canon EOS R5, 100mm macro f/2.8, ISO 200, cinematic color grading, 8K resolution."

REGLAS TECNICAS DEL PROMPT:
- SIEMPRE en INGLES
- 80-150 palabras, narrativa descriptiva fluida
- NO negative prompts
- Describir positivamente
- Terminologia fotografica profesional
- Relevante al contenido del post

=============================================
RESPONDE EN JSON:
=============================================
{
  "post_body": "string completo del post con \\n para saltos",
  "hashtags": ["#LegalTech", "#GovTech", "#DigestIA"],
  "first_comment": "string para 1er comentario con link relevante",
  "best_posting_time": "Martes 8:00 AM GMT-3",
  "char_count": 1400,
  "engagement_prediction": "medium",
  "suggested_image": "string breve en espanol describiendo que imagen usar",
  "image_prompt": "string COMPLETO en INGLES del prompt para Imagen 3/Nano Banana Pro. DEBE incluir navy blue + emerald green como colores dominantes, dark theme, rim lighting verde, estetica tech-legal. 80-150 palabras, narrativa fluida, 7 capas.",
  "tone_check": "string breve explicando por que este post NO es grandilocuente"
}

engagement_prediction: "low"|"medium"|"high"
best_posting_time: "Martes 8:00 AM GMT-3"|"Martes 9:00 AM GMT-3"|"Jueves 8:00 AM GMT-3"|"Jueves 9:00 AM GMT-3"
hashtags: 3-5 items
char_count: entre 1300 y 1600
image_prompt: OBLIGATORIO, en ingles, 80-150 palabras, con branding navy+green
Solo JSON valido, sin backticks.`;

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
      image_prompt: data.image_prompt || '',
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
