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
Contexto: "${trend.description}"
Pilar: ${trend.suggested_pillar}
Angulo: "${trend.lucas_angle}"
Valor para lector: "${trend.reader_takeaway || 'Informacion util'}"

=== PERFIL (datos verificables) ===
Secretario del Digesto Juridico, Montecarlo, Misiones (25,981 hab).
Ex concejal (2021-2025). 189 proyectos legislativos.
DigestIA: chatbot IA EN DESARROLLO 2026, no implementado.
Digesto: 176 normas vigentes.

=== REGLAS ===
- NUNCA empezar con "yo"
- Max 210 caracteres (lo visible antes de "ver mas")
- El hook debe prometer VALOR AL LECTOR, no hablar del proyecto de Lucas
- Si el pilar es "Tendencias_LegalTech" o "Educativo": el hook abre con dato o pregunta sobre el SECTOR
- Si el pilar es "Proceso_personal": ahi si puede ser mas personal
- Sonar como persona real, no copywriter
- NO autoproclamarse, NO superlativos, NO humble bragging
- PROHIBIDO: "DigestIA sirve a X vecinos", "soy concejal", "digitalice ordenanzas"

BUENOS EJEMPLOS (valor para el lector):
- "El 73% de los estudios juridicos en LATAM no usa ninguna herramienta de IA. Los datos de por que."
- "3 herramientas gratuitas de IA legal que podes probar hoy. Las probe todas."
- "Meta prohibio chatbots de IA en WhatsApp. Esto cambia todo para servicios gubernamentales."
- "Brasil acaba de regular la IA. Que significa para abogados en Argentina."
- "Tutorial rapido: como usar Claude para analizar contratos en 5 minutos."

MALOS EJEMPLOS (hablan de Lucas, no aportan valor):
- "Estoy desarrollando DigestIA para modernizar la legislacion"
- "Como ex concejal, creo que la IA va a transformar el gobierno"
- "Mi proyecto DigestIA esta cambiando como se consulta la ley"

Formulas (1 de cada):
1. Contraintuitivo: dato que desafia creencia comun
2. Numero: cifra concreta + resultado
3. Pregunta provocadora (NO "¿Que opinan?")
4. Micro-historia: situacion -> cambio
5. Controversial: opinion fuerte sobre el sector
6. Lista: N cosas que el lector puede usar

JSON:
{
  "hooks": [
    {
      "text": "string max 210 chars",
      "formula_type": "contraintuitivo",
      "estimated_engagement": "high",
      "best_format": "texto_imagen",
      "follow_up_angle": "string de que va el post"
    }
  ],
  "recommended_top3": [0, 2, 4]
}

formula_type: "contraintuitivo"|"numero"|"pregunta"|"historia"|"controversial"|"lista"
estimated_engagement: "low"|"medium"|"high"|"viral"
best_format: "carrusel"|"texto_imagen"|"video"|"solo_texto"
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

    return NextResponse.json({
      hooks: data.hooks || [],
      recommended_top3: data.recommended_top3 || [0, 1, 2],
    });

  } catch (err) {
    console.error('Hooks error:', err);
    return NextResponse.json({ error: err.message || 'Error desconocido' }, { status: 500 });
  }
}
