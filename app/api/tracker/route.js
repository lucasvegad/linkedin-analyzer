export async function POST(request) {
  try {
    const { publishedPosts, profile } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY no está configurada');
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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // ✅ Modelo actualizado
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error Groq:', errorData);
      throw new Error(`Error Groq: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

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
