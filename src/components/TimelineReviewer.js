'use client';

function normalizeTag(t) {
  return (t ?? '').replace(/^#/, '').trim().toLowerCase();
}

function buildMinuteByMinute(frames, userParticipantId, enemyParticipantId, maxMinutes) {
  const list = [];
  for (let i = 0; i < maxMinutes && i < frames.length; i++) {
    const frame = frames[i];
    const participantFrames = frame?.participantFrames ?? {};
    const events = frame?.events ?? [];
    const userFrame = userParticipantId ? participantFrames[userParticipantId] : null;
    const enemyFrame = enemyParticipantId ? participantFrames[enemyParticipantId] : null;
    list.push({ minute: i, userFrame, enemyFrame, events });
  }
  return list;
}

/** Format minute as game time (0 → "0:00", 1 → "1:00", …) */
function formatGameTime(minute) {
  return `${minute}:00`;
}

function getEventLabels(events) {
  return events
    .filter((e) => ['CHAMPION_KILL', 'ELITE_MONSTER_KILL', 'BUILDING_KILL', 'TURRET_PLATE_DESTROYED'].includes(e?.type))
    .map((e) =>
      e.type === 'CHAMPION_KILL'
        ? 'Kill'
        : e.type === 'ELITE_MONSTER_KILL'
          ? (e.monsterType ?? 'Objetivo')
          : e.type === 'TURRET_PLATE_DESTROYED'
            ? 'Placa'
            : 'Torre'
    );
}

function buildMinuteNarrative(minute, userFrame, enemyFrame, events, userChampion, enemyChampion) {
  const userCs = userFrame?.minionsKilled ?? userFrame?.totalMinionsKilled ?? 0;
  const userGold = userFrame?.totalGold ?? 0;
  const userLevel = userFrame?.level ?? 0;
  const enemyCs = enemyFrame?.minionsKilled ?? enemyFrame?.totalMinionsKilled ?? 0;
  const enemyGold = enemyFrame?.totalGold ?? 0;
  const enemyLevel = enemyFrame?.level ?? 0;
  const eventLabels = getEventLabels(events);
  const userName = userChampion ?? 'Tu personaje';
  const rivalName = enemyChampion ?? 'el rival';

  if (minute === 0) {
    const eventsPhrase = eventLabels.length > 0 ? ` Eventos: ${eventLabels.join(', ')}.` : '';
    return `${userName} comenzó con ${userGold} de oro, ${userCs} minion${userCs !== 1 ? 's' : ''} asesinado${userCs !== 1 ? 's' : ''}, nivel ${userLevel}. ${rivalName} tenía ${enemyGold} de oro, ${enemyCs} minion${enemyCs !== 1 ? 's' : ''}, nivel ${enemyLevel}.${eventsPhrase}`;
  }

  const eventsPhrase = eventLabels.length > 0 ? ` Eventos en este minuto: ${eventLabels.join(', ')}.` : '';
  return `A ${formatGameTime(minute)}, ${userName} tenía ${userCs} CS, ${userGold} de oro, nivel ${userLevel}. ${rivalName}: ${enemyCs} CS, ${enemyGold} de oro, nivel ${enemyLevel}.${eventsPhrase}`;
}

export function TimelineReviewer({
  timelineData,
  participants = [],
  userGameName,
  userTagLine,
  timelineCompare = null,
}) {
  const timelineCompareMs = Math.max(0, parseInt(process.env.NEXT_PUBLIC_TIMELINE_COMPARE || '0', 10));
  const frames = timelineData?.info?.frames ?? [];
  const frameInterval = timelineData?.info?.frameInterval ?? 60000;
  const maxMinutes =
    timelineCompareMs > 0 ? Math.ceil(timelineCompareMs / frameInterval) : frames.length;

  const currentUser = participants.find((p) => {
    const g = (p.riotIdGameName ?? '').trim().toLowerCase();
    const t = normalizeTag(p.riotIdTagline);
    return userGameName && userTagLine
      ? g === userGameName.trim().toLowerCase() && t === normalizeTag(userTagLine)
      : g === (userGameName ?? '').trim().toLowerCase();
  });
  const userParticipantId = currentUser ? String(currentUser.participantId) : null;
  const userTeamId = currentUser?.teamId;
  const userRole = timelineCompare?.role ?? currentUser?.teamPosition ?? currentUser?.individualPosition;
  const enemyParticipant = participants.find(
    (p) =>
      (p.teamPosition || p.individualPosition) === userRole &&
      Number(p.teamId) !== Number(userTeamId)
  );
  const enemyParticipantId = enemyParticipant ? String(enemyParticipant.participantId) : null;
  const userChampion = timelineCompare?.userChampion ?? currentUser?.championName;
  const enemyChampion = timelineCompare?.enemyChampion ?? enemyParticipant?.championName;

  const minuteByMinute = buildMinuteByMinute(frames, userParticipantId, enemyParticipantId, maxMinutes);

  const comparison = timelineCompare?.comparison?.trim() || null;

  return (
    <div className="text-sm text-slate-400">
      {minuteByMinute.length === 0 ? (
        <p className="text-slate-500 text-xs">No hay frames de timeline para esta partida.</p>
      ) : (
        <div className="space-y-4 max-h-[50vh] overflow-auto">
          {minuteByMinute.map(({ minute, userFrame, enemyFrame, events }) => (
            <div key={minute}>
              <p className="font-mono font-medium text-slate-300 mb-1">
                {formatGameTime(minute)}
              </p>
              <p className="text-slate-400 leading-relaxed">
                {buildMinuteNarrative(minute, userFrame, enemyFrame, events, userChampion, enemyChampion)}
              </p>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-700/50">
            <p className="font-medium text-slate-300 mb-1">Recomendations:</p>
            <p className="text-slate-400 leading-relaxed whitespace-pre-line">
              {comparison ?? '…'}
            </p>
          </div>
        </div>
      )}
      {timelineCompare?.userFrame && timelineCompare?.enemyFrame && (
        <details className="mt-4">
          <summary className="text-xs text-slate-500 cursor-pointer">
            Ver datos crudos ({formatGameTime(timelineCompare.frameMinute ?? 0)})
          </summary>
          <pre className="mt-2 text-xs overflow-auto max-h-40 bg-slate-900/50 p-3 rounded">
            {JSON.stringify(
              { tú: timelineCompare.userFrame, rival: timelineCompare.enemyFrame },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
