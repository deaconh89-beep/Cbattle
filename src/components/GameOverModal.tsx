/**
 * GameOverModal for Craft Royale
 * Displays Victory Royale or Eliminated screen with full match performance statistics.
 */
import React from 'react';
import { MatchSummary } from '../types/game';
import { Trophy, Skull, Crosshair, Box, Layers, Clock, RotateCcw } from 'lucide-react';

interface GameOverModalProps {
  isVictory: boolean;
  summary: MatchSummary;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  summary,
  onPlayAgain,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 flex items-center justify-center p-4 z-30 select-none">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl max-w-lg w-full p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow ambient background */}
        <div
          className={`absolute -top-24 w-72 h-72 rounded-full blur-3xl opacity-30 ${
            isVictory ? 'bg-amber-400' : 'bg-red-500'
          }`}
        />

        {/* Icon & Title */}
        <div className="relative mb-3">
          {isVictory ? (
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/30">
              <Trophy size={36} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/30">
              <Skull size={36} />
            </div>
          )}
        </div>

        <h2 className="text-3xl font-black tracking-tight text-white mb-1">
          {isVictory ? 'VICTORY ROYALE!' : 'ELIMINATED'}
        </h2>
        <p className="text-sm font-semibold text-slate-400 mb-6">
          {isVictory
            ? '#1 / 10 · Last Survivor Standing'
            : `Placed #${summary.rank} / 10 · Better Luck Next Drop`}
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-3 mb-8 text-left">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Crosshair size={14} className="text-amber-400" />
              <span>Eliminations</span>
            </div>
            <span className="text-xl font-black text-white font-mono-numbers">{summary.kills}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Trophy size={14} className="text-sky-400" />
              <span>Damage</span>
            </div>
            <span className="text-xl font-black text-white font-mono-numbers">
              {summary.damageDealt}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Layers size={14} className="text-emerald-400" />
              <span>Structures</span>
            </div>
            <span className="text-xl font-black text-white font-mono-numbers">
              {summary.structuresBuilt}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Box size={14} className="text-amber-500" />
              <span>Harvested</span>
            </div>
            <span className="text-xl font-black text-white font-mono-numbers">
              {summary.materialsHarvested}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Box size={14} className="text-yellow-400" />
              <span>Chests</span>
            </div>
            <span className="text-xl font-black text-white font-mono-numbers">
              {summary.chestsOpened}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock size={14} className="text-purple-400" />
              <span>Survived</span>
            </div>
            <span className="text-xl font-black text-white font-mono-numbers">
              {summary.timeSurvived}s
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onMainMenu}
            className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            Main Menu
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-lg tracking-wide shadow-xl shadow-amber-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Drop In Again
          </button>
        </div>
      </div>
    </div>
  );
};
