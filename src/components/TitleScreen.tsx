/**
 * TitleScreen Component for Craft Royale
 * Meets core game craft guidelines:
 * - Bespoke inline SVG title lockup over 30-40% negative space
 * - Primary Start CTA (Enter/Space to start)
 * - Single flat control-hint line (WASD Move · Click Action · Esc Pause)
 * - Mute toggle
 */
import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Swords, Layers, HelpCircle, X } from 'lucide-react';
import { sound } from '../game/sound';

interface TitleScreenProps {
  onStartGame: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showControls, setShowControls] = useState(false);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none select-none z-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>BATTLE ROYALE · 10 PLAYERS</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowControls(true)}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="How to Play"
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Center Hero Title Lockup */}
      <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-auto">
        {/* Bespoke Blocky Inline SVG Title Lockup */}
        <div className="relative mb-6 drop-shadow-2xl">
          <svg viewBox="0 0 680 140" className="w-[min(580px,88vw)] h-auto overflow-visible">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <filter id="blockShadow" x="-5%" y="-5%" width="110%" height="120%">
                <feDropShadow dx="0" dy="8" stdDeviation="0" floodColor="#0f172a" />
              </filter>
            </defs>
            {/* Title Text */}
            <text
              x="50%"
              y="75"
              textAnchor="middle"
              fill="url(#titleGrad)"
              stroke="#451a03"
              strokeWidth="10"
              paintOrder="stroke fill"
              fontSize="68"
              fontWeight="900"
              letterSpacing="3"
              fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
              filter="url(#blockShadow)"
            >
              CRAFT ROYALE
            </text>
            <text
              x="50%"
              y="120"
              textAnchor="middle"
              fill="#38bdf8"
              stroke="#0f172a"
              strokeWidth="5"
              paintOrder="stroke fill"
              fontSize="20"
              fontWeight="800"
              letterSpacing="6"
              fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
            >
              BATTLE TILL THE END
            </text>
          </svg>
        </div>

        {/* Feature Pills */}
        <div className="flex items-center gap-6 mb-8 text-xs font-semibold text-slate-200 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Swords size={14} className="text-amber-400" />
            <span>Over-the-Shoulder TPS</span>
          </div>
          <span className="text-slate-500">·</span>
          <div className="flex items-center gap-1.5">
            <Layers size={14} className="text-emerald-400" />
            <span>Fortnite Grid Builds</span>
          </div>
          <span className="text-slate-500">·</span>
          <div className="flex items-center gap-1.5">
            <Shield size={14} className="text-sky-400" />
            <span>Destructible Biomes</span>
          </div>
        </div>

        {/* Primary Start CTA */}
        <button
          onClick={onStartGame}
          className="pointer-events-auto px-10 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xl tracking-wide shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-yellow-200"
        >
          DROP INTO THE ISLAND
        </button>
      </div>

      {/* Flat Control Hint Line */}
      <div className="text-center">
        <p className="text-xs font-medium text-slate-300 tracking-wide bg-slate-900/60 px-4 py-2 rounded-full inline-block border border-slate-700/50">
          WASD Move · Click Shoot/Harvest · Q/E/F Build · Esc Pause
        </p>
      </div>

      {/* Controls & Rules Sheet Modal */}
      {showControls && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Swords size={20} className="text-amber-400" />
                Combat & Survival Guide
              </h3>
              <button
                onClick={() => setShowControls(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <span className="font-bold text-amber-400 block mb-1">WASD / Shift / Space</span>
                  <p className="text-slate-300">Move, Sprint, and Jump across terrains and ramps.</p>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <span className="font-bold text-amber-400 block mb-1">Left Click / Right Click</span>
                  <p className="text-slate-300">Shoot, Mine resources, and Aim Down Sights (ADS).</p>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <span className="font-bold text-sky-400 block mb-1">Q / E / F (Building)</span>
                  <p className="text-slate-300">Instant grid placement: Q Wall, E Ramp, F Floor (Costs 10 Mats).</p>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <span className="font-bold text-emerald-400 block mb-1">Keys 1 - 5 / R</span>
                  <p className="text-slate-300">Equip weapon slots and reload ammo.</p>
                </div>
              </div>

              <div className="bg-slate-800/40 p-3 rounded-lg text-xs space-y-1.5 border border-slate-700/30">
                <p className="font-semibold text-white">Match Objective:</p>
                <p className="text-slate-300">
                  Harvest trees and boulders for materials. Open glowing chests for rifles, shotguns, and shields.
                  Escape the shrinking purple storm circle and defeat 9 AI survivors to win the Victory Royale!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowControls(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 font-semibold rounded-xl text-white transition-colors"
            >
              Got it, Let's Play
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
