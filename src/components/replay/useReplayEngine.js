'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { lerp } from './utils';

const FRAME_INTERVAL_MS = 60000;

function getFrameTime(frame, frameIndex) {
  return frame.timestamp ?? frameIndex * FRAME_INTERVAL_MS;
}

/** Find the frame index for currentTimeMs (pure, no ref). */
function findFrameIndex(frames, currentTimeMs) {
  let idx = Math.min(
    Math.floor(currentTimeMs / FRAME_INTERVAL_MS),
    Math.max(0, frames.length - 1)
  );
  while (idx + 1 < frames.length && getFrameTime(frames[idx + 1], idx + 1) <= currentTimeMs) {
    idx++;
  }
  while (idx > 0 && getFrameTime(frames[idx], idx) > currentTimeMs) {
    idx--;
  }
  return idx;
}

/**
 * Compute interpolated player positions for currentTime.
 * Pure function: no refs, safe to call during render.
 */
function computeInterpolatedPlayers(timelineFrames, currentTimeMs) {
  if (!timelineFrames?.length) return [];

  const frames = timelineFrames;
  const idx = findFrameIndex(frames, currentTimeMs);

  const frameA = frames[idx];
  const timeA = getFrameTime(frameA, idx);
  const frameB = frames[idx + 1];
  const timeB = frameB != null ? getFrameTime(frameB, idx + 1) : timeA;
  const progress =
    timeB > timeA ? (currentTimeMs - timeA) / (timeB - timeA) : 1;

  const pfA = frameA.participantFrames ?? {};
  const pfB = frameB?.participantFrames ?? {};
  const participantIds = Array.from(
    new Set([...Object.keys(pfA), ...Object.keys(pfB)])
  );

  const getFallbackPosition = (participantId, teamId) => {
    const idx = parseInt(participantId, 10) || 0;
    const spread = 800;
    const isRed = teamId === 200;
    const i = isRed ? Math.min(Math.max(0, idx - 6), 4) : Math.min(Math.max(0, idx - 1), 4);
    if (isRed) {
      return { x: 14500 - i * spread * 0.6, y: 14500 - i * spread * 0.4 };
    }
    return { x: 500 + i * spread * 0.6, y: 500 + i * spread * 0.4 };
  };

  const result = [];
  for (const participantId of participantIds) {
    const a = pfA[participantId];
    const b = pfB[participantId];
    const teamId = a?.teamId ?? b?.teamId ?? 100;
    const fallback = getFallbackPosition(participantId, teamId);
    const posA = a?.position ?? b?.position ?? fallback;
    const posB = b?.position ?? a?.position ?? posA;
    result.push({
      participantId,
      teamId,
      x: lerp(posA.x, posB.x, progress),
      y: lerp(posA.y, posB.y, progress),
    });
  }
  return result;
}

/**
 * Hook to compute interpolated player positions from timeline frames and current time.
 * Call from inside Canvas.
 */
export function useReplayEngine(timelineFrames, currentTimeMs) {
  return useMemo(
    () => computeInterpolatedPlayers(timelineFrames, currentTimeMs),
    [timelineFrames, currentTimeMs]
  );
}

/** Max seconds to advance per frame so one big delta (e.g. tab focus) doesn't jump to end of match. */
const MAX_DELTA_SEC = 0.25;

/**
 * Advance currentTime in useFrame when isPlaying. Use inside a component that's inside Canvas.
 */
export function useReplayTimeAdvance(isPlaying, speed, matchDurationMs, setCurrentTime) {
  useFrame((_, delta) => {
    if (!isPlaying) return;
    const cappedDelta = Math.min(delta, MAX_DELTA_SEC);
    setCurrentTime((prev) => {
      const next = prev + cappedDelta * 1000 * speed;
      return Math.min(Math.max(0, next), matchDurationMs);
    });
  });
}
