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

Hook elegido: "${hook.text}"
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
- El post CURA informacion real. Lucas filtra la noticia para el lector.
- Estructura: Dato impactante -> Contexto -> Por que importa -> Que significa -> Pregunta
- DigestIA puede mencionarse BREVEMENTE como ejemplo si es natural, nunca como centro

Si pilar es "Educativo":
- El post ENSENA algo practico. El lector se va con algo que puede usar HOY.
- Estructura: Problema comun -> Solucion paso a paso -> Ejemplo -> Pregunta
- Tono: "Esto me funciono" no "Soy experto"

Si pilar es "IA_gobierno":
- El post ANALIZA un caso real de OTRA institucion. Lucas aporta perspectiva critica.
- Estructura: Caso real -> Datos -> Analisis -> Leccion aplicable -> Pregunta

Si pilar es "Proceso_personal":
- ACA si puede hablar de DigestIA y su experiencia directa.
- Tono vulnerable: "La primera vez que probe X, fallo", "Todavia no lo logramos pero..."
- NUNCA presentar como exito, siempre como proceso

=== VOZ CALIBRADA ===
- Primera persona plural: "Descubrimos", "Aprendimos"
- DATOS como protagonista, no Lucas
- NUNCA autoproclamarse: sin "pionero", "visionario", "lider"
- Lo personal aparece tarde, no al inicio
- 70% valor educativo + 20% proceso + 10% logros

PROHIBIDO: "DigestIA sirve a X vecinos", "soy concejal", "digitalice ordenanzas", "35,000 hab", "primer municipio con IA", humble bragging, superlativos

========================================
=== REGLAS DE COPYWRITING LINKEDIN ===
========================================

ESTO ES LO MAS IMPORTANTE DEL PROMPT. El post puede tener buen contenido pero si es DENSO e ILEGIBLE pierde todo el engagement. Segui estas reglas al pie de la letra:

REGLA 1 - GANCHO EN 3 SEGUNDOS:
El primer parrafo debe tener MAXIMO 2 lineas.
Dato concreto o pregunta simple. Nada mas.
Si el lector no entiende el gancho en una respiracion, abandona.
EJEMPLO MALO: "Si los expertos eticos renuncian de grandes IA por giros comerciales, quien garantizara la confianza publica en LegalTech gubernamental?"
EJEMPLO BUENO: "Tres expertos eticos renunciaron a OpenAI en 2025.\\nSu razon: giro comercial sobre seguridad."

REGLA 2 - PARRAFOS DE MAXIMO 3 LINEAS:
LinkedIn penaliza bloques de texto. El ojo humano se cansa.
NUNCA escribir un parrafo de mas de 3 lineas.
Si un parrafo tiene 4+ lineas, DIVIDILO en dos.
Dejar SIEMPRE una linea en blanco entre parrafos (usar \\n\\n).

REGLA 3 - UNA IDEA = UN PARRAFO:
No mezclar conceptos. Cada bloque se lee independientemente.
EJEMPLO MALO: "Las renuncias generan presion sobre gobiernos. La pregunta es crucial: quien auditara? Observamos como esto frena la adopcion de LegalTech."
EJEMPLO BUENO: "Esto no pasa solo en Silicon Valley.\\nAfecta a gobiernos de Chile, Colombia y Argentina.\\n\\nLa pregunta real:\\nQuien auditara la IA que tu municipio esta por contratar?"

REGLA 4 - SHOW, DON'T TELL:
Por cada afirmacion abstracta, dar un EJEMPLO CONCRETO.
MALO: "Esta erosion de confianza frena la adopcion"
BUENO: "Un municipio quiere un chatbot para consultas ciudadanas.\\nPero sin reglas claras, el proyecto se congela."
PREGUNTATE: "Como se ve esto en la practica?" y escribi ESO.

REGLA 5 - LENGUAJE CONVERSACIONAL B2B:
Somos expertos, no academicos. Hablar como en videollamada con un alcalde.
PROHIBIDO: "erosion de confianza", "marcos robustos", "auditoria etica integral", "paradigma", "ecosistema", "sinergia"
USAR: "desconfianza", "reglas claras", "checklist antes de firmar", "que pasa si", "en la practica"
TEST: Si suena como paper academico, SIMPLIFICAR.

REGLA 6 - TRANSICIONES FLUIDAS:
Cada parrafo conecta naturalmente con el siguiente.
Usar: "Esto no pasa solo en...", "La pregunta real:", "Un ejemplo concreto:", "El resultado:", "Desde nuestra experiencia:"
NO usar transiciones genericas como "En este sentido", "Cabe destacar", "Es importante mencionar"

REGLA 7 - FORMATEO VISUAL:
Usar flechas (→) para bullets cortos (max 1 linea cada uno)
Max 3 bullets seguidos, no mas
Espacios en blanco generosos (\\n\\n entre cada bloque)
Negritas con moderacion (1-2 por post maximo, usando **texto**)

REGLA 8 - ESTRUCTURA VISUAL OBLIGATORIA:
El post DEBE verse asi (con las lineas en blanco):

[GANCHO - max 2 lineas]
(dato impactante o pregunta directa)
\\n\\n
[CONTEXTO - 2-3 lineas]
(por que importa ahora)
\\n\\n
[PROBLEMA CONCRETO - ejemplo real]
(caso especifico o situacion)
\\n\\n
[VALOR/INSIGHT - lo que el lector se lleva]
(accionable: herramienta, framework, checklist)
\\n\\n
[CTA - pregunta especifica]
(invitacion a interactuar)
\\n\\n
#Hashtags

REGLA 9 - CTA ACCIONABLE:
El CTA no es una pregunta generica. Es una invitacion concreta.
MALO: "Que opinan?" "Que piensan de esto?"
BUENO: "Tu municipio tiene un checklist de IA? Compartilo en comentarios"
BUENO: "Cuantas herramientas de IA probaste este mes? Yo voy 3"
BUENO: "Si queres el framework completo, pedimelo en comentarios"

REGLA 10 - LARGO TOTAL:
Entre 900 y 1,400 caracteres. Ni mas ni menos.
Posts mas largos NO se leen completos en LinkedIn.
Si te pasas de 1,400: cortá lo menos importante.

========================================
=== IMAGEN CON BRANDING ===
========================================
Genera prompt en INGLES (80-150 palabras) para Google Imagen 3:
- Colores: deep navy blue (#0B1931) dominante + emerald green (#00C17A) acentos
- Dark theme, estetica tech-legal, rim lighting verde esmeralda
- Composicion limpia, profundidad de campo corta
- Si hay persona: hombre latinoamericano ~30 anos, profesional
- NO fondos blancos, NO stock corporativo, NO texto en imagen
- Terminologia fotografica (lente, ISO, color grading)

=== JSON DE SALIDA ===
{
  "post_body": "string con \\n para saltos de linea. RESPETAR las reglas de formato.",
  "hashtags": ["#LegalTech", "#GovTech"],
  "first_comment": "string con link o recurso adicional para primer comentario",
  "best_posting_time": "Martes 8:00 AM GMT-3",
  "char_count": 1200,
  "engagement_prediction": "medium",
  "suggested_image": "descripcion en espanol de la imagen sugerida",
  "image_prompt": "string en INGLES 80-150 palabras con branding navy+green",
  "tone_check": "que valor concreto se lleva el lector",
  "copy_check": "VERIFICACION: parrafo mas largo tiene X lineas, total X caracteres, CTA es accionable: si/no"
}

IMPORTANTE: En post_body usa \\n\\n para separar parrafos (linea en blanco entre cada uno). Usa \\n para salto de linea dentro del mismo parrafo.
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
      copy_check: data.copy_check || '',
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
