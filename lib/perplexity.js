// lib/perplexity.js
export async function searchPerplexity(query) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar', // ← Cambiado a modelo válido
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that searches for current trends and news.'
        },
        {
          role: 'user',
          content: query
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Perplexity response:', data);
    throw new Error('Invalid response format from Perplexity');
  }
  
  return data.choices[0].message.content;
}
