import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { profile } = await request.json();

    const prompt = `Eres un experto en tendencias de LinkedIn y content strategy.

PERFIL DEL USUARIO:
${profile}

TAREA:
Identifica las 5 tendencias MÁS RELEVANTES en LinkedIn ahora mismo que este profesional debería aprovechar para crear contenido. Para cada tendencia:

1. **Nombre de la tendencia** (max 6 palabras)
2. **Por qué es relevante ahora** (1-2 líneas)
3. **Hook específico para post** (el gancho emocional/intelectual para abrir el post)
4. **3 puntos clave** (bullet points concretos para desarrollar)
5. **Call-to-action sugerido** (cómo cerrar el post)

FORMATO EXACTO:
---
### [Nombre Tendencia]
**Relevancia:** [explicación breve]
**Hook:** "[frase inicial del post]"
**Desarrollo:**
- [punto 1]
- [punto 2]
- [punto 3]
**CTA:** [cierre sugerido]
---

Sé específico, accionable y enfocado en el nicho del usuario.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    return Response.json({
      trends: message.content[0].text,
    });
  } catch (error) {
    console.error("Error en discover:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
