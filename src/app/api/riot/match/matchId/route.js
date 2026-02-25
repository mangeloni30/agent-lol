import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  const apiKey = process.env.API_KEY;
  const openaiKey = process.env.OPENAI_KEY;
  console.log("+++++++++ openaiKey ", openaiKey)

  if (!apiKey) {
    return NextResponse.json({ error: 'API_KEY is missing' }, { status: 500 });
  }

  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  try {
    const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;

    console.log('=== Making API Request: Get Match Details ===');
    console.log('Match ID:', matchId);
    console.log('URL:', url);

    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': apiKey,
      },
      cache: 'no-store',
    });

    const data = await response.json();

    console.log('=== API Response: Match Details ===');
    console.log('Response:', data);
    console.log('==========================================');

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Optionally enrich the match data with a contextual summary from OpenAI
    let contextSummary = null;
    if (openaiKey) {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            temperature: 0.5,
            messages: [
              {
                role: 'system',
                content:
                  'Eres un coach experto de League of Legends. Tu tarea es describir solo el CONTEXTO de la partida (modo, duración, tipo de partida, ritmo general, dominio de equipos, objetivos clave), sin dar aún consejos individuales al jugador. Sé breve, claro y en español neutro, 3–6 frases máximo.',
              },
              {
                role: 'user',
                content:
                  'Usa estos datos crudos del endpoint MatchV5 de Riot para describir el contexto general de la partida, sin dar todavía recomendaciones personales:\n\n' +
                  JSON.stringify(data),
              },
            ],
          }),
        });

        const openaiJson = await openaiRes.json();

        if (!openaiRes.ok) {
          console.error('OpenAI API error:', openaiJson);
        } else {
          contextSummary =
            openaiJson?.choices?.[0]?.message?.content?.trim() || null;
        }
      } catch (err) {
        console.error('Error calling OpenAI for match context:', err);
      }
    } else {
      console.warn('OPENAI_KEY is not set; skipping contextual analysis.');
    }

    const enriched = contextSummary
      ? { ...data, analysis: { context: contextSummary } }
      : data;

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching match details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
