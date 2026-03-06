'use client';

import { signOut } from 'next-auth/react';
import { LatestMatch } from '@/components/LatestMatch';

export function HomeContent({ user }) {
  const { puuid, gameName, tagLine } = user ?? {};

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans">
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400/95">
              LoL Match Lookup
            </h1>
            <p className="mt-1 text-slate-400 text-sm">
              Summoner stats and recent match data from Riot API
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            Sign out
          </button>
        </header>

        {user && (
          <>
            <section className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Summoner
              </h2>
              <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 sm:p-6 shadow-lg">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xl font-bold text-white">
                    {gameName ?? '—'}
                  </span>
                  <span className="text-slate-400">#{tagLine ?? '—'}</span>
                </div>
              </div>
            </section>

            <LatestMatch
              puuid={puuid}
              userGameName={gameName}
              userTagLine={tagLine}
            />
          </>
        )}
      </main>
    </div>
  );
}
