export async function POST(request) {
  try {
    const { profile } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY no está configurada');
    }

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
        max_tokens: 2000,
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
      trends: text,
    });
  } catch (error) {
    console.error('Error en discover:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
