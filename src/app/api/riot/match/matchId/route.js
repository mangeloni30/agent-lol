import { NextResponse } from 'next/server';
import { getRiotSessionOrFail } from '@/lib/auth-server';

export async function GET(request) {
  const { session, response } = await getRiotSessionOrFail(NextResponse, request);
  if (response) return response;

  const matchId = request.nextUrl.searchParams.get('matchId');
  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  const openaiKey = process.env.OPENAI_KEY;
  const agentEnabled = process.env.ENABLE_MATCH_AGENT === 'true';

  try {
    const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': session.apiKey },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });

    let contextSummary = null;
    if (openaiKey && agentEnabled) {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-5.1',
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
        if (openaiRes.ok) {
          contextSummary = openaiJson?.choices?.[0]?.message?.content?.trim() || null;
        } else {
          console.error('OpenAI API error:', openaiJson);
        }
      } catch (err) {
        console.error('Error calling OpenAI for match context:', err);
      }
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
