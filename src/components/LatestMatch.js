'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchDdragonVersion } from '@/services/ddragon';
import { fetchMatchIds, fetchMatchDetails, fetchMatchTimeline, fetchTimelineCompare } from '@/services/match';
import { queryKeys } from '@/services/query-keys';
import { Participants } from '@/components/Participants';
import { TimelineReviewer } from '@/components/TimelineReviewer';

export function LatestMatch({ puuid, userGameName, userTagLine }) {
  const ddragonQuery = useQuery({
    queryKey: queryKeys.ddragon,
    queryFn: fetchDdragonVersion,
  });

  const matchIdsQuery = useQuery({
    queryKey: queryKeys.matchIds(puuid),
    queryFn: () => fetchMatchIds(puuid),
    enabled: !!puuid,
  });

  const firstMatchId = matchIdsQuery.data?.[0] ?? null;
  const matchDetailsEnabled = !!firstMatchId; // fetches Riot match data; OpenAI agent runs only if ENABLE_MATCH_AGENT=true in .env
  const matchDetailsQuery = useQuery({
    queryKey: queryKeys.matchDetails(firstMatchId),
    queryFn: () => fetchMatchDetails(firstMatchId),
    staleTime: 300000, // 5 minutes
    enabled: matchDetailsEnabled && !!firstMatchId,
  });

  const timelineQuery = useQuery({
    queryKey: queryKeys.matchTimeline(firstMatchId),
    queryFn: () => fetchMatchTimeline(firstMatchId),
    staleTime: 300000,
    enabled: !!firstMatchId,
  });

  const timelineCompareQuery = useQuery({
    queryKey: queryKeys.matchTimelineCompare(firstMatchId, userGameName, userTagLine),
    queryFn: () =>
      fetchTimelineCompare(firstMatchId, {
        gameName: userGameName,
        tagLine: userTagLine,
      }),
    staleTime: 300000,
    enabled: !!firstMatchId && !!userGameName,
  });

  const matchDetails = matchDetailsQuery.data;
  const timelineData = timelineQuery.data;
  const timelineCompare = timelineCompareQuery.data;

  const ddragonVersion = ddragonQuery.data;
  const error = matchIdsQuery.error ?? (matchDetailsEnabled ? matchDetailsQuery.error : null);
  const loading =
    matchIdsQuery.isPending ||
    (matchDetailsEnabled &&
      matchIdsQuery.isSuccess &&
      matchIdsQuery.data?.length > 0 &&
      matchDetailsQuery.isPending);

  if (!puuid) return null;
  if (loading && !error) {
    return (
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Latest match
        </h2>
        <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 border border-slate-700/60 px-6 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-slate-300">Loading match details…</span>
        </div>
      </section>
    );
  }
  if (error) {
    return (
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Latest match
        </h2>
        <div className="rounded-xl bg-red-950/40 border border-red-800/60 px-6 py-4 text-red-200">
          <p className="font-medium">Failed to load match</p>
          <p className="mt-1 text-sm text-red-300/90">
            {error?.status?.message ?? error?.message ?? JSON.stringify(error)}
          </p>
        </div>
      </section>
    );
  }
  if (!matchDetails) return null;

  const participants = matchDetails?.info?.participants ?? [];
  const contextSummary = matchDetails?.analysis?.context ?? null;
  const gameDuration = matchDetails?.info?.gameDuration ?? 0;
  const gameDurationMin = Math.floor(gameDuration / 60);
  const gameDurationSec = gameDuration % 60;

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
        Latest match
      </h2>
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden shadow-lg">
        {/* Match header */}
        <div className="px-5 py-4 sm:px-6 border-b border-slate-700/50 flex flex-wrap items-center gap-4">
          <span className="text-slate-400 text-sm">
            {gameDurationMin}m {gameDurationSec}s
          </span>
          <span
            className="text-xs text-slate-500 font-mono truncate max-w-[180px] sm:max-w-none"
            title={matchDetails?.metadata?.matchId}
          >
            {matchDetails?.metadata?.matchId}
          </span>
          {firstMatchId && (
            <Link
              href={`/replay?matchId=${encodeURIComponent(firstMatchId)}`}
              className="ml-auto text-sm font-medium text-amber-400 hover:text-amber-300"
            >
              View 2.5D replay
            </Link>
          )}
        </div>
        <Participants
          participants={participants}
          ddragonVersion={ddragonVersion}
          currentUserGameName={userGameName}
          currentUserTagLine={userTagLine}
        />
      </div>
      {contextSummary && (
        <div className="mt-6 rounded-xl bg-slate-800/50 border border-slate-700/50 px-5 py-4 sm:px-6 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">
            Contexto de la partida (agente)
          </h3>
          <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
            {contextSummary}
          </p>
        </div>
      )}
      {timelineCompare && (
        <div className="mt-6 rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden shadow-lg">
          <div className="px-5 py-4 sm:px-6 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Match Reviewer
            </h3>
            <p className="text-xs text-slate-500">
              {timelineCompare.userChampion} ({timelineCompare.role}) vs {timelineCompare.enemyChampion}
            </p>
          </div>
          <div className="px-5 py-4 sm:px-6">
            <TimelineReviewer
              timelineData={timelineData}
              participants={participants}
              userGameName={userGameName}
              userTagLine={userTagLine}
              timelineCompare={timelineCompare}
            />
          </div>
        </div>
      )}
    </section>
  );
}
