'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAccount } from '@/services/account';
import { queryKeys } from '@/services/query-keys';
import { LatestMatch } from '@/components/LatestMatch';

export default function Home() {
  const accountQuery = useQuery({
    queryKey: queryKeys.account,
    queryFn: fetchAccount,
  });

  const accountData = accountQuery.data;
  const puuid = accountData?.puuid ?? null;
  const error = accountQuery.error;
  const loading = accountQuery.isPending;

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans">
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400/95">
            LoL Match Lookup
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Summoner stats and recent match data from Riot API
          </p>
        </header>

        {/* Loading */}
        {loading && !error && (
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 border border-slate-700/60 px-6 py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-slate-300">Loading summoner data…</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-950/40 border border-red-800/60 px-6 py-4 text-red-200">
            <p className="font-medium">Something went wrong</p>
            <p className="mt-1 text-sm text-red-300/90">
              {error?.status?.message ?? error?.message ?? JSON.stringify(error)}
            </p>
          </div>
        )}

        {/* Account card */}
        {accountData && !error && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Summoner
            </h2>
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 sm:p-6 shadow-lg">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xl font-bold text-white">
                  {accountData.gameName ?? '—'}
                </span>
                <span className="text-slate-400">#{accountData.tagLine ?? '—'}</span>
              </div>
            </div>
          </section>
        )}

        {/* Latest match - fetches its own data */}
        {accountData && !error && <LatestMatch puuid={puuid} />}
      </main>
    </div>
  );
}
