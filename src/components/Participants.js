'use client';

import Image from 'next/image';
import { DATA_DRAGON_BASE } from '@/constants/ddragon';

// Data Dragon uses champion id (no spaces), e.g. "Aurelion Sol" -> "AurelionSol"
const championImageId = (championName) => {
  if (!championName || typeof championName !== 'string') return null;
  return championName.replace(/\s+/g, '');
};

export function Participants({ participants = [], ddragonVersion }) {
  return (
    <div className="divide-y divide-slate-700/40">
      {participants.map((p, i) => {
        const championName = p.championName ?? null;
        const cid = championImageId(championName);
        const championIconUrl =
          ddragonVersion && cid
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
                className="rounded-lg object-cover border border-slate-600/60 shrink-0"
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
  );
}
