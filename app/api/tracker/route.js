export async function POST(request) {
  try {
    const { publishedPosts, profile } = await request.json();

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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Error de API: ${response.status}`);
    }

    const data = await response.json();

    return Response.json({
      suggestion: data.content[0].text,
    });
  } catch (error) {
    console.error('Error en tracker:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
