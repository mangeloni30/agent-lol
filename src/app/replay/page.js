'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchMatchDetails, fetchMatchTimeline } from '@/services/match';
import { queryKeys } from '@/services/query-keys';
import { ReplayCanvas } from '@/components/replay/ReplayCanvas';

function ReplayContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');

  const matchDetailsQuery = useQuery({
    queryKey: queryKeys.matchDetails(matchId),
    queryFn: () => fetchMatchDetails(matchId),
    enabled: !!matchId,
  });

  const timelineQuery = useQuery({
    queryKey: queryKeys.matchTimeline(matchId),
    queryFn: () => fetchMatchTimeline(matchId),
    enabled: !!matchId,
  });

  const matchDetails = matchDetailsQuery.data;
  const timelineData = timelineQuery.data;
  const frames = timelineData?.info?.frames ?? [];
  const gameDurationSec = matchDetails?.info?.gameDuration ?? 0;
  const matchDurationMs = gameDurationSec * 1000;
  const timelineCompareMs = Math.max(0, parseInt(process.env.NEXT_PUBLIC_TIMELINE_COMPARE || '0', 10));
  // Replay only runs for the timeline length (e.g. 3 min), not the full match
  const replayDurationMs =
    timelineCompareMs > 0
      ? Math.min(timelineCompareMs, matchDurationMs)
      : matchDurationMs;
  const initialTimeMs = 0;

  if (!matchId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <p className="text-slate-400">No match selected. Open replay from Latest match.</p>
      </div>
    );
  }

  if (matchDetailsQuery.isPending || timelineQuery.isPending) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <span className="text-slate-300">Loading replay…</span>
      </div>
    );
  }

  if (matchDetailsQuery.error || timelineQuery.error) {
    const err = matchDetailsQuery.error ?? timelineQuery.error;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="rounded-xl bg-red-950/40 border border-red-800/60 px-6 py-4 text-red-200">
          <p className="font-medium">Failed to load replay</p>
          <p className="mt-1 text-sm text-red-300/90">{err?.message ?? String(err)}</p>
        </div>
      </div>
    );
  }

  if (!frames.length) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <p className="text-slate-400">No timeline frames for this match.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-amber-400/95">
          2.5D Replay
        </h1>
        <p className="mt-1 text-slate-400 text-sm font-mono truncate max-w-full" title={matchId}>
          {matchId}
        </p>
      </header>
      <ReplayCanvas
        key={matchId}
        timelineFrames={frames}
        matchDurationMs={replayDurationMs}
        initialTimeMs={initialTimeMs}
      />
    </div>
  );
}

export default function ReplayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-slate-300">Loading…</span>
        </div>
      }
    >
      <ReplayContent />
    </Suspense>
  );
}
