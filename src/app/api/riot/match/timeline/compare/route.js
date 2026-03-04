import { NextResponse } from 'next/server';

const RIOT_MATCH_URL = (matchId) =>
  `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
const RIOT_TIMELINE_URL = (matchId) =>
  `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;

function normalizeTag(t) {
  return (t ?? '').replace(/^#/, '').trim().toLowerCase();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  const gameName = searchParams.get('gameName') || process.env.GAME_NAME;
  const tagLine = searchParams.get('tagLine') || process.env.TAG_LINE;

  const apiKey = process.env.API_KEY;
  const openaiKey = process.env.OPENAI_KEY;
  const agentEnabled = process.env.ENABLE_MATCH_AGENT === 'true';

  if (!apiKey) {
    return NextResponse.json({ error: 'API_KEY is missing' }, { status: 500 });
  }
  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  const userGame = (gameName ?? '').trim().toLowerCase();
  const userTag = normalizeTag(tagLine);

  try {
    const [matchRes, timelineRes] = await Promise.all([
      fetch(RIOT_MATCH_URL(matchId), {
        headers: { 'X-Riot-Token': apiKey },
        cache: 'no-store',
      }),
      fetch(RIOT_TIMELINE_URL(matchId), {
        headers: { 'X-Riot-Token': apiKey },
        cache: 'no-store',
      }),
    ]);

    const matchData = await matchRes.json();
    const timelineData = await timelineRes.json();

    if (!matchRes.ok) return NextResponse.json(matchData, { status: matchRes.status });
    if (!timelineRes.ok) return NextResponse.json(timelineData, { status: timelineRes.status });

    const participants = matchData?.info?.participants ?? [];
    const frames = timelineData?.info?.frames ?? [];
    // TIMELINE_COMPARE = milliseconds; convert to frame index (frames are every 1 min: 60000 ms)
    const compareMs = Math.max(0, parseInt(process.env.TIMELINE_COMPARE, 10) || 0);
    const frameIndex = Math.min(
      Math.floor(compareMs / 60000),
      Math.max(0, frames.length - 1)
    );
    const frameMinute = frameIndex;

    const currentUser = participants.find((p) => {
      const g = (p.riotIdGameName ?? '').trim().toLowerCase();
      const t = normalizeTag(p.riotIdTagline);
      return userGame && userTag ? g === userGame && t === userTag : g === userGame;
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found in match participants' },
        { status: 404 }
      );
    }

    const userParticipantId = String(currentUser.participantId);
    const userTeamId = currentUser.teamId;
    const userRole = currentUser.teamPosition || currentUser.individualPosition || 'UNKNOWN';
    const userChampion = currentUser.championName ?? 'Unknown';

    const enemySameRole = participants.find(
      (p) =>
        (p.teamPosition || p.individualPosition) === userRole &&
        Number(p.teamId) !== Number(userTeamId)
    );

    if (!enemySameRole) {
      return NextResponse.json(
        { error: 'No enemy found in the same role' },
        { status: 404 }
      );
    }

    const enemyParticipantId = String(enemySameRole.participantId);
    const enemyChampion = enemySameRole.championName ?? 'Unknown';

    // Build progression from minute 0 to frameMinute (inclusive) for both players
    const userFramesFromStart = [];
    const enemyFramesFromStart = [];
    for (let i = 0; i <= frameIndex && i < frames.length; i++) {
      const pf = frames[i]?.participantFrames ?? {};
      userFramesFromStart.push({ minute: i, ...(pf[userParticipantId] ?? {}) });
      enemyFramesFromStart.push({ minute: i, ...(pf[enemyParticipantId] ?? {}) });
    }

    const lastFrame = frames[frameIndex]?.participantFrames ?? {};
    const userFrame = lastFrame[userParticipantId] ?? null;
    const enemyFrame = lastFrame[enemyParticipantId] ?? null;

    let comparison = null;
    if (openaiKey && agentEnabled && userFramesFromStart.length && enemyFramesFromStart.length) {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.4,
            messages: [
              {
                role: 'system',
                content: `Eres un coach de League of Legends. Recibes la evolución minuto a minuto (desde el minuto 0 hasta el minuto ${frameMinute}) de dos jugadores en la misma posición/rol.
Analiza cómo fue la early game de cada uno: farm (minions), oro, nivel/XP a lo largo del tiempo. Responde en español, en 4-6 frases: quién se fue adelantando y en qué momento, tendencias (quién mejoró o empeoró), y una conclusión breve con qué podría mejorar el que va atrás. Sé directo y útil.`,
              },
              {
                role: 'user',
                content: `Rol/lane: ${userRole}.

Mi jugador (${userChampion}) - evolución desde min 0 hasta min ${frameMinute}:
${JSON.stringify(userFramesFromStart)}

Rival en la misma lane (${enemyChampion}) - evolución desde min 0 hasta min ${frameMinute}:
${JSON.stringify(enemyFramesFromStart)}

Dame feedback de la early game: cómo fue desde el inicio hasta el minuto ${frameMinute}.`,
              },
            ],
          }),
        });

        const openaiJson = await openaiRes.json();
        if (openaiRes.ok) {
          comparison = openaiJson?.choices?.[0]?.message?.content?.trim() ?? null;
        } else {
          console.error('OpenAI timeline compare error:', openaiJson);
        }
      } catch (err) {
        console.error('Error calling OpenAI for timeline compare:', err);
      }
    }

    return NextResponse.json({
      role: userRole,
      frameMinute,
      userChampion,
      enemyChampion,
      userFrame,
      enemyFrame,
      comparison,
    });
  } catch (error) {
    console.error('Error in timeline compare:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
