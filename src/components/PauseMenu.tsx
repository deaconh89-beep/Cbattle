/**
 * PauseMenu Component for Craft Royale
 * Clean in-game pause modal with Resume, Audio controls, and Match Restart.
 */
import React, { useState } from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Swords } from 'lucide-react';
import { sound } from '../game/sound';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onMainMenu,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-30 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black text-white mb-1">GAME PAUSED</h2>
        <p className="text-xs font-semibold text-slate-400 mb-6">
          Press Esc to return to the battle
        </p>

        <div className="w-full space-y-2.5 mb-6">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Play size={18} fill="currentColor" />
            Resume Battle
          </button>

          <button
            onClick={toggleSound}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
            {isMuted ? 'Unmute Audio' : 'Mute Audio'}
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            <RotateCcw size={16} />
            Restart Match
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700/50"
          >
            <Home size={16} />
            Return to Menu
          </button>
        </div>

        {/* Quick controls reminder */}
        <div className="w-full bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 text-[11px] text-slate-300 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Move / Sprint / Jump</span>
            <span className="font-bold text-white">WASD / Shift / Space</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Shoot / Harvest / Aim</span>
            <span className="font-bold text-white">L-Click / R-Click</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Instant Grid Build</span>
            <span className="font-bold text-sky-400">Q (Wall) · E (Ramp) · F (Floor)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
