import { NextResponse } from 'next/server';
import { generateWithGemini, askGemini } from '../../../lib/gemini';

export async function POST(request) {
  try {
    const { trend, query } = await request.json();
    if (!trend) {
      return NextResponse.json({ error: 'Falta el trend' }, { status: 400 });
    }

    const prompt = `Genera 6 hooks de LinkedIn para Lucas Vega.

Tema: "${trend.title}"
Contexto real: "${trend.description}"
Pilar: ${trend.suggested_pillar}
Angulo: "${trend.lucas_angle}"
Keyword: "${query}"

=== PERFIL (solo datos verificables) ===
- Secretario del Digesto Juridico & Modernizacion, Montecarlo, Misiones (25,981 hab)
- Ex concejal (2021-2025). 189 proyectos legislativos
- DigestIA: chatbot IA para legislacion municipal — EN DESARROLLO 2026, no implementado
- Digesto certificado: 176 normas vigentes (4ta Consolidacion, nov 2025)
- Stack: Claude, Gemini, Supabase, Vercel

=== REGLAS PARA LOS HOOKS ===

Los hooks deben cumplir estas condiciones:
1. NUNCA empezar con "yo" — el hook debe abrir con un dato, pregunta, o situacion
2. Caber en los primeros 210 caracteres (lo que se ve antes de "ver mas")
3. Generar curiosidad genuina, no clickbait vacio
4. Sonar como una persona real, no como un copywriter de marketing
5. NO autoproclamarse: nada de "pionero", "visionario", "lider", "revolucionario"
6. NO ser grandilocuente ni usar superlativos ("increible", "impresionante", "historico")
7. Los mejores hooks usan: datos concretos, preguntas provocadoras, o micro-historias
8. Preferir primera persona plural ("descubrimos", "aprendimos") sobre singular

PROHIBIDO en hooks:
- "DigestIA sirve a X vecinos" (no esta en produccion)
- "Como concejal" en presente (ya no lo es)
- "Digitalice ordenanzas" (ya estaban digitalizadas)
- "35,000 habitantes" (son 25,981)
- Humble bragging disfrazado de pregunta

BUENOS EJEMPLOS de hooks calibrados:
- "Meta acaba de prohibir chatbots de IA en WhatsApp. La politica ya esta vigente."
- "176 normas vigentes. Un Digesto certificado. Y ninguna forma facil de consultarlo. Hasta ahora."
- "En un municipio de 25,000 habitantes, ¿tiene sentido invertir en IA? Esto es lo que encontramos."
- "3 dias para encontrar una ordenanza. 15 minutos con IA. El proceso que estamos probando."
- "189 proyectos legislativos en 4 anos. Lo que aprendi sobre por que la ley no llega al ciudadano."

=== FORMULAS (exactamente 1 de cada) ===
1. Contraintuitivo: Desafiar una creencia comun del sector con un dato
2. Numero especifico: Numero concreto + resultado medible + contexto temporal
3. Pregunta provocadora: Pregunta que el lector no pueda ignorar (NO "¿Que opinan?")
4. Micro-historia: "Hace [tiempo], [situacion concreta]. Hoy [cambio real]."
5. Controversial: Opinion profesional fuerte y defendible sobre el sector
6. Lista con promesa: "[N] cosas que [resultado especifico y creible]"

=== RESPONDE EN JSON ===
{
  "hooks": [
    {
      "text": "string hook completo listo para publicar (max 210 caracteres)",
      "formula_type": "contraintuitivo",
      "estimated_engagement": "high",
      "best_format": "texto_imagen",
      "follow_up_angle": "string de que iria el post completo"
    }
  ],
  "recommended_top3": [0, 2, 4]
}

formula_type: "contraintuitivo"|"numero"|"pregunta"|"historia"|"controversial"|"lista"
estimated_engagement: "low"|"medium"|"high"|"viral"
best_format: "carrusel"|"texto_imagen"|"video"|"solo_texto"
recommended_top3: indices de los 3 mejores hooks
Solo JSON valido.`;

    let data;
    try {
      data = await generateWithGemini(prompt);
    } catch (gErr) {
      console.error('Gemini hooks error:', gErr);
      return NextResponse.json({ error: 'Error generando hooks: ' + gErr.message }, { status: 500 });
    }

    if (data._parseError) {
      return NextResponse.json({ error: 'Gemini no devolvio JSON valido. Intenta de nuevo.' }, { status: 500 });
    }

    const result = {
      hooks: data.hooks || [],
      recommended_top3: data.recommended_top3 || [0, 1, 2],
    };

    return NextResponse.json(result);

  } catch (err) {
    console.error('Hooks error:', err);
    return NextResponse.json({ error: err.message || 'Error desconocido' }, { status: 500 });
  }
}
