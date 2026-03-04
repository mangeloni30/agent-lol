'use client';

import Image from 'next/image';
import { DATA_DRAGON_BASE } from '@/constants/ddragon';

// Data Dragon uses champion id (no spaces), e.g. "Aurelion Sol" -> "AurelionSol"
const championImageId = (championName) => {
  if (!championName || typeof championName !== 'string') return null;
  return championName.replace(/\s+/g, '');
};

const normalizeTag = (t) => (t ?? '').replace(/^#/, '').trim();

export function Participants({ participants = [], ddragonVersion, currentUserGameName, currentUserTagLine }) {
  const userGame = (currentUserGameName ?? '').trim().toLowerCase();
  const userTag = normalizeTag(currentUserTagLine).toLowerCase();

  const currentUserParticipant = participants.find((participant) => {
    const g = (participant.riotIdGameName ?? '').trim().toLowerCase();
    const t = normalizeTag(participant.riotIdTagline).toLowerCase();
    return userGame && userTag ? g === userGame && t === userTag : g === userGame;
  });
  const currentUserTeamId = currentUserParticipant != null ? Number(currentUserParticipant.teamId) : null;

  return (
    <div className="divide-y divide-slate-700/40">
      {participants.map((p, i) => {
        const championName = p.championName ?? null;
        const cid = championImageId(championName);
        const championIconUrl =
          ddragonVersion && cid
            ? `${DATA_DRAGON_BASE}/cdn/${ddragonVersion}/img/champion/${cid}.png`
            : null;
        const participantGame = (p.riotIdGameName ?? '').trim().toLowerCase();
        const participantTag = normalizeTag(p.riotIdTagline).toLowerCase();
        const isCurrentUser = userGame && userTag
          ? participantGame === userGame && participantTag === userTag
          : participantGame === userGame;
        const isTeammate =
          currentUserTeamId != null &&
          Number(p.teamId) === currentUserTeamId &&
          !isCurrentUser;

        const rowHighlight = isCurrentUser
          ? 'bg-amber-950/30 border-l-4 border-l-amber-500'
          : isTeammate
            ? 'bg-sky-950/35 border-l-2 border-l-sky-500'
            : '';

        return (
          <div
            key={p.puuid ?? i}
            className={`px-5 py-3 sm:px-6 flex flex-wrap items-center gap-3 sm:gap-4 ${rowHighlight}`}
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
            {isCurrentUser && (
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-amber-600/80 text-amber-100 shrink-0">
                You
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                p.win ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/40 text-red-300'
              }`}
            >
              {p.win ? 'Win' : 'Loss'}
            </span>
            <span
              className={`text-sm font-medium ${
                isCurrentUser ? 'text-amber-100' : isTeammate ? 'text-slate-200' : 'text-white'
              }`}
            >
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
