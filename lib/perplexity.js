export async function searchPerplexity(query) {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'Eres un investigador especializado en LegalTech, IA en gobierno, y transformación digital en Latinoamérica. Busca información real y actual. Responde en español.'
        },
        {
          role: 'user',
          content: `Busca las últimas noticias, artículos y tendencias sobre: "${query}". Enfocate en contenido de las últimas 2-4 semanas. Para cada hallazgo incluí título, resumen breve y por qué es relevante para el sector LegalTech en Latinoamérica.`
        }
      ],
      search_recency_filter: 'month',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Perplexity error ${res.status}: ${err}`);
  }

  const data = await res.json();

  return {
    content: data.choices?.[0]?.message?.content || '',
    citations: data.citations || [],
    search_results: data.search_results || [],
  };
}
