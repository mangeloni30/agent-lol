'use client';

import Image from 'next/image';
import { useState, useEffect } from "react";
import { DATA_DRAGON_BASE } from '@/constants/ddragon';

// Data Dragon uses champion id (no spaces), e.g. "Aurelion Sol" -> "AurelionSol"
const championImageId = (championName) => {
  if (!championName || typeof championName !== 'string') return null;
  return championName.replace(/\s+/g, '');
}

export default function Home() {
  const [puuid, setPuuid] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [matchIds, setMatchIds] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [ddragonVersion, setDdragonVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data Dragon: get latest game version for asset URLs (via API route)
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch('/api/ddragon/version');
        const data = await res.json();
        if (res.ok && data.version) {
          setDdragonVersion(data.version);
        }
      } catch (e) {
        console.warn('Data Dragon version fetch failed:', e);
      }
    };
    fetchVersion();
  }, []);

  useEffect(() => {
    const getPuuid = async () => {
      try {
        // Get PUUID using gameName and tagLine from .env
        const response = await fetch('/api/riot/account/get-puuid');

        const data = await response.json();
        console.log('=== FIRST API Response (get-puuid) ===');
        console.log('Response:', data);
        if (!response.ok) {
          setError(data);
          setLoading(false);
          return;
        }

        // Store full account response for UI and puuid for next requests
        setPuuid(data?.puuid);
        if (data?.puuid) setAccountData(data);
      } catch (err) {
        console.error('Error getting puuid:', err);
        setError({ message: err.message });
        setLoading(false);
      }
    };

    getPuuid();
  }, []);

  useEffect(() => {
    // Call match IDs API when puuid is available
    if (puuid) {
      const getMatchIds = async () => {
        try {
          console.log('=== Making API Request: Get Match IDs ===');
          console.log('Using puuid:', puuid);
          const response = await fetch(`/api/riot/match/by-puuid/ids?puuid=${puuid}`);
          
          const data = await response.json();
          console.log('=== API Response: Match IDs ===');
          console.log('Response:', data);
          console.log('==========================================');

          if (!response.ok) {
            console.error('Error fetching match IDs:', data);
            setError(data);
          } else {
            setMatchIds(data);
          }
          setLoading(false);
        } catch (err) {
          console.error('Error fetching match IDs:', err);
          setError({ message: err.message });
          setLoading(false);
        }
      };

      getMatchIds();
    }
  }, [puuid]);

  useEffect(() => {
    // Call match details API when matchIds are available
    if (matchIds && Array.isArray(matchIds) && matchIds.length > 0) {
      const getMatchDetails = async () => {
        try {
          // Use the first match ID from the list
          const firstMatchId = matchIds[0];
          console.log('=== Making API Request: Get Match Details ===');
          console.log('Using match ID:', firstMatchId);
          const response = await fetch(`/api/riot/match/matchId?matchId=${firstMatchId}`);
          
          const data = await response.json();
          console.log('=== API Response: Match Details ===');
          console.log('Response:', data);
          console.log('==========================================');

          if (!response.ok) {
            console.error('Error fetching match details:', data);
            setError(data);
          } else {
            setMatchDetails(data);
          }
        } catch (err) {
          console.error('Error fetching match details:', err);
          setError({ message: err.message });
        }
      };

      getMatchDetails();
    }
  }, [matchIds]);

  const participants = matchDetails?.info?.participants ?? [];
  const gameDuration = matchDetails?.info?.gameDuration ?? 0;
  const gameDurationMin = Math.floor(gameDuration / 60);
  const gameDurationSec = gameDuration % 60;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans">
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
            <span className="text-slate-300">Loading summoner and match data…</span>
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

        {/* Match IDs */}
        {matchIds && Array.isArray(matchIds) && matchIds.length > 0 && !error && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Recent match IDs ({matchIds.length})
            </h2>
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 sm:p-6 shadow-lg">
              <ul className="flex flex-wrap gap-2">
                {matchIds.slice(0, 12).map((id, i) => (
                  <li
                    key={id}
                    className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-mono text-slate-300 truncate max-w-[200px] sm:max-w-[280px]"
                    title={id}
                  >
                    {id}
                  </li>
                ))}
              </ul>
              {matchIds.length > 12 && (
                <p className="mt-3 text-xs text-slate-500">+{matchIds.length - 12} more</p>
              )}
            </div>
          </section>
        )}

        {/* Match details (latest match) */}
        {matchDetails && !error && (
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
                <span className="text-xs text-slate-500 font-mono truncate max-w-[180px] sm:max-w-none" title={matchDetails?.metadata?.matchId}>
                  {matchDetails?.metadata?.matchId}
                </span>
              </div>
              {/* Participants */}
              <div className="divide-y divide-slate-700/40">
                {participants.map((p, i) => {
                  const championName = p.championName ?? null;
                  const cid = championImageId(championName);
                  const championIconUrl = ddragonVersion && cid
                    ? `${DATA_DRAGON_BASE}/cdn/${ddragonVersion}/img/champion/${cid}.png`
                    : null;
                  return (
                    <div
                      key={p.puuid ?? i}
                      className="px-5 py-3 sm:px-6 flex flex-wrap items-center gap-3 sm:gap-4"
                    >
                      {championIconUrl && (
                        <Image
                          src={championIconUrl}
                          alt={championName ?? 'Champion'}
                          title={championName ?? undefined}
                          width={40}
                          height={40}
                          className="rounded-lg object-cover border border-slate-600/60 flex-shrink-0"
                        />
                      )}
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          p.win ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/40 text-red-300'
                        }`}
                      >
                        {p.win ? 'Win' : 'Loss'}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {p.summonerName ?? p.riotIdGameName ?? 'Unknown'}
                      </span>
                      <span className="text-slate-500 text-sm">
                        {p.championName ?? `Champion ${p.championId ?? '?'}`}
                      </span>
                      <span className="text-slate-400 text-sm tabular-nums">
                        {p.kills ?? 0} / {p.deaths ?? 0} / {p.assists ?? 0} KDA
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
