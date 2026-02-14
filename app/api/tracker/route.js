import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { publishedPosts, profile } = await request.json();

    const prompt = `Eres un estratega de contenido de LinkedIn.

PERFIL:
${profile}

POSTS PUBLICADOS:
${publishedPosts.map((p, i) => `${i + 1}. [${p.pilar}] "${p.titulo}" - ${p.fecha}`).join('\n')}

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

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    return Response.json({
      suggestion: message.content[0].text,
    });
  } catch (error) {
    console.error("Error en tracker:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
