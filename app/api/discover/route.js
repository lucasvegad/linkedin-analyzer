export async function POST(request) {
  try {
    const { profile } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY no está configurada');
    }

    const prompt = `Eres un estratega de contenido de LinkedIn especializado en identificar tendencias.

PERFIL DEL USUARIO:
${profile}

TAREA:
Identifica las 5 tendencias MÁS RELEVANTES en LinkedIn ahora mismo para este profesional.

Para cada tendencia, genera un JSON con esta estructura EXACTA:

{
  "nombre": "Título corto (max 50 caracteres)",
  "relevancia": "Por qué es importante AHORA (1-2 líneas, max 150 caracteres)",
  "hook_sugerido": "Frase de apertura pegajosa para el post (max 100 caracteres)",
  "puntos_clave": [
    "Punto concreto 1 (max 80 caracteres)",
    "Punto concreto 2 (max 80 caracteres)",
    "Punto concreto 3 (max 80 caracteres)"
  ],
  "pilar_sugerido": "Nombre del pilar de contenido (ej: LegalTech, IA_gobierno, Educativo)",
  "angulo_personal": "Cómo este profesional puede aportar valor único en esta tendencia (max 100 caracteres)"
}

IMPORTANTE:
- Sé ESPECÍFICO al nicho del usuario
- Los hooks deben ser emocionales o sorprendentes
- Los puntos clave deben ser accionables
- El ángulo personal debe conectar con la experiencia del usuario

Devuelve un array JSON con las 5 tendencias. SOLO el JSON, sin texto adicional.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error Groq:', errorData);
      throw new Error(`Error Groq: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    let text = data.choices[0].message.content.trim();

    // Limpiar posibles markdown fences
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    let trends;
    try {
      trends = JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Raw text:', text);
      throw new Error('El modelo no devolvió JSON válido');
    }

    return Response.json({
      trends: Array.isArray(trends) ? trends : [trends],
    });
  } catch (error) {
    console.error('Error en discover:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
