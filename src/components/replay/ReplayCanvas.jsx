'use client';

import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MapPlane } from './MapPlane';
import { Champion } from './Champion';
import { useReplayEngine, useReplayTimeAdvance } from './useReplayEngine';

function ReplayScene({
  timelineFrames,
  matchDurationMs,
  currentTime,
  setCurrentTime,
  isPlaying,
  speed,
}) {
  useReplayTimeAdvance(isPlaying, speed, matchDurationMs, setCurrentTime);
  const interpolatedPlayers = useReplayEngine(timelineFrames, currentTime);
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[0, 10000, 0]} intensity={1} />
      <MapPlane />
      {interpolatedPlayers.map((p) => (
        <Champion
          key={p.participantId}
          x={p.x}
          y={p.y}
          teamId={p.teamId}
        />
      ))}
      <OrbitControls />
    </>
  );
}

export function ReplayCanvas({ timelineFrames, matchDurationMs, initialTimeMs = 0 }) {
  const [currentTime, setCurrentTime] = useState(() =>
    Math.min(Math.max(0, initialTimeMs), matchDurationMs || 0)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const handleSliderChange = useCallback((e) => {
    setCurrentTime(Number(e.target.value));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-800/50 border border-slate-700/50 px-4 py-3">
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Speed</span>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`rounded px-3 py-1 text-sm ${
                speed === s
                  ? 'bg-amber-500/90 text-slate-900'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <div className="flex flex-1 min-w-[120px] items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {Math.floor(currentTime / 60000)}:{(Math.floor(currentTime / 1000) % 60).toString().padStart(2, '0')}
          </span>
          <input
            type="range"
            min={0}
            max={matchDurationMs}
            value={currentTime}
            onChange={handleSliderChange}
            className="flex-1 h-2 rounded-full bg-slate-700 accent-amber-500"
          />
        </div>
      </div>
      <div
        className="rounded-xl overflow-hidden border-2 border-amber-500/50 bg-slate-900"
        style={{ width: '100%', minWidth: 320, height: 420, position: 'relative' }}
      >
        <Canvas
          frameloop="always"
          dpr={[1, 2]}
          camera={{ position: [0, 12000, 12000], fov: 45, near: 10, far: 25000 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor('#0f172a');
            camera.lookAt(0, 0, 0);
          }}
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          <ReplayScene
            timelineFrames={timelineFrames}
            matchDurationMs={matchDurationMs}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            isPlaying={isPlaying}
            speed={speed}
          />
        </Canvas>
      </div>
    </div>
  );
}
