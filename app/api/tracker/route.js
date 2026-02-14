export async function POST(request) {
  try {
    const { publishedPosts, profile } = await request.json();

    if (!process.env.GEMINI_DISCOVER_KEY) {
      throw new Error('GEMINI_DISCOVER_KEY no está configurada');
    }

    const postsList = publishedPosts.map((p, i) => `${i + 1}. [${p.pilar}] "${p.titulo}" - ${p.fecha}`).join('\n');

    const prompt = `Eres un estratega de contenido de LinkedIn.

PERFIL:
${profile}

POSTS PUBLICADOS:
${postsList}

TAREA:
1. Analiza qué pilares de contenido están sobre-representados y cuáles están descuidados
2. Sugiere el PRÓXIMO PILAR a publicar para mantener balance
3. Da un hook concreto para ese pilar

FORMATO:
**Balance actual:**
[análisis breve de distribución]

**Próximo pilar recomendado:** [nombre del pilar]
**Razón:** [por qué ahora]
**Hook sugerido:** "[frase inicial]"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_DISCOVER_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error Gemini:', errorData);
      throw new Error(`Error Gemini: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Respuesta inválida de Gemini');
    }

    const text = data.candidates[0].content.parts[0].text;

    return Response.json({
      suggestion: text,
    });
  } catch (error) {
    console.error('Error en tracker:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
