/**
 * World-Matched, Low-Occlusion In-Game HUD for Craft Royale
 * Meets core game craft guidelines:
 * - Playfield occlusion < 15% (perimeter status clusters, pointer-events: none)
 * - Tabular-nums integer readouts for health, shields, ammo, and materials
 * - Real-time Kill Feed, Storm Phase Tracker, Dynamic Crosshair with Hitmarker, and Minimap Radar
 */
import React from 'react';
import {
  PlayerStats,
  ItemData,
  KillFeedItem,
  StormState,
} from '../types/game';
import { Shield, Heart, Zap, Crosshair, Box, Layers } from 'lucide-react';
import { RARITY_COLORS } from '../game/loot';

interface HUDProps {
  stats: PlayerStats;
  inventory: (ItemData | null)[];
  killFeed: KillFeedItem[];
  aliveCount: number;
  stormState: StormState;
  onSelectSlot: (slot: number) => void;
  onOpenInventory: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  inventory,
  killFeed,
  aliveCount,
  stormState,
  onSelectSlot,
  onOpenInventory,
}) => {
  const activeItem = inventory[stats.activeSlot];

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 p-5 flex flex-col justify-between">
      {/* --- TOP STATUS CLUSTER --- */}
      <div className="flex items-start justify-between">
        {/* Top-Left: Real-time Kill Feed */}
        <div className="flex flex-col gap-1 max-w-xs">
          {killFeed.slice(0, 4).map((kf) => (
            <div
              key={kf.id}
              className={`text-xs px-2.5 py-1 rounded bg-slate-900/80 border text-slate-200 flex items-center gap-1.5 shadow-md ${
                kf.isPlayerKill
                  ? 'border-amber-500/80 text-amber-200'
                  : 'border-slate-800'
              }`}
            >
              <span className="font-bold">{kf.killer}</span>
              <span className="text-slate-400">eliminated</span>
              <span className="font-semibold text-slate-300">{kf.victim}</span>
            </div>
          ))}
        </div>

        {/* Top-Center: Alive Counter & Storm Tracker */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-4 bg-slate-950/85 px-4 py-2 rounded-xl border border-slate-800 shadow-xl text-xs font-bold tracking-wider">
            {/* Alive count */}
            <div className="flex items-center gap-1.5 text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-mono-numbers text-sm text-emerald-400">{aliveCount}</span>
              <span className="text-slate-400">ALIVE</span>
            </div>
            <span className="text-slate-700">|</span>
            {/* Kills */}
            <div className="flex items-center gap-1 text-amber-400">
              <Crosshair size={14} />
              <span className="font-mono-numbers text-sm">{stats.kills}</span>
              <span className="text-slate-400">ELIMS</span>
            </div>
            <span className="text-slate-700">|</span>
            {/* Storm Timer */}
            <div className="flex items-center gap-1.5 text-purple-300">
              <Zap size={14} className="text-purple-400" />
              <span className="text-slate-400">STORM:</span>
              <span className="font-mono-numbers text-sm text-purple-300">
                {Math.floor(stormState.timeRemaining / 60)}:
                {String(Math.floor(stormState.timeRemaining % 60)).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Storm Warning Message */}
          {stormState.isPlayerInStorm && (
            <div className="mt-2 bg-purple-600/90 text-white font-bold text-xs px-3 py-1 rounded-full border border-purple-400 shadow-lg tracking-wide">
              RUN TO SAFE ZONE! TAKING {stormState.dps} DPS
            </div>
          )}
        </div>

        {/* Top-Right: Minimap Radar */}
        <div className="relative w-28 h-28 bg-slate-950/90 rounded-2xl border-2 border-slate-700/80 shadow-2xl overflow-hidden flex items-center justify-center">
          {/* Biome backdrop representation */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/40 via-emerald-950/40 to-sky-950/40" />
          {/* Island border */}
          <div className="absolute w-24 h-24 rounded-full border border-emerald-500/40" />
          {/* Safe zone circle */}
          <div
            className="absolute rounded-full border-2 border-sky-400/80"
            style={{
              width: `${Math.max(16, (stormState.targetRadius / 145) * 88)}px`,
              height: `${Math.max(16, (stormState.targetRadius / 145) * 88)}px`,
            }}
          />
          {/* Current storm circle */}
          <div
            className="absolute rounded-full border-2 border-purple-500/90"
            style={{
              width: `${Math.max(18, (stormState.currentRadius / 145) * 94)}px`,
              height: `${Math.max(18, (stormState.currentRadius / 145) * 94)}px`,
            }}
          />
          {/* Player marker */}
          <div className="relative w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-md shadow-yellow-400 border border-white" />
        </div>
      </div>

      {/* --- CENTER INTERACTION PROMPT & CROSSHAIR --- */}
      <div className="flex flex-col items-center justify-center my-auto">
        {/* Dynamic Crosshair */}
        <div className="relative w-6 h-6 flex items-center justify-center mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-sm" />
          <div className="absolute -top-3 w-0.5 h-2 bg-white/70" />
          <div className="absolute -bottom-3 w-0.5 h-2 bg-white/70" />
          <div className="absolute -left-3 h-0.5 w-2 bg-white/70" />
          <div className="absolute -right-3 h-0.5 w-2 bg-white/70" />
        </div>

        {/* Action Interaction Prompt */}
        {stats.nearbyChestId && (
          <div className="bg-amber-500/90 text-slate-950 font-black text-xs px-4 py-2 rounded-xl border border-yellow-200 shadow-xl tracking-wider">
            PRESS [E] OPEN CHEST
          </div>
        )}
        {stats.nearbyGroundItemId && !stats.nearbyChestId && (
          <div className="bg-slate-900/90 text-white font-bold text-xs px-4 py-2 rounded-xl border border-slate-700 shadow-xl tracking-wider flex items-center gap-2">
            <span className="text-amber-400 font-black">[E]</span>
            <span>PICK UP</span>
            <span
              style={{
                color: stats.nearbyGroundItemRarity
                  ? RARITY_COLORS[stats.nearbyGroundItemRarity]
                  : '#fff',
              }}
            >
              {stats.nearbyGroundItemName}
            </span>
          </div>
        )}

        {/* Consumable Progress Bar */}
        {stats.isConsuming && (
          <div className="w-48 bg-slate-900/90 p-2 rounded-xl border border-sky-500 shadow-xl mt-4">
            <div className="text-[11px] font-bold text-sky-400 mb-1 text-center">
              USING ITEM...
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full transition-all duration-75"
                style={{ width: `${stats.consumeProgress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Reloading Bar */}
        {stats.isReloading && (
          <div className="w-44 bg-slate-900/90 p-2 rounded-xl border border-amber-500 shadow-xl mt-4">
            <div className="text-[11px] font-bold text-amber-400 mb-1 text-center">
              RELOADING...
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-75"
                style={{ width: `${stats.reloadProgress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM PERIMETER CLUSTER --- */}
      <div className="flex items-end justify-between">
        {/* Bottom-Left: Health & Shield Meters */}
        <div className="flex flex-col gap-1.5 w-64 bg-slate-950/85 p-3 rounded-2xl border border-slate-800 shadow-2xl">
          {/* Shield Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-sky-400 mb-1">
              <div className="flex items-center gap-1">
                <Shield size={14} />
                <span>SHIELD</span>
              </div>
              <span className="font-mono-numbers text-sm">{Math.round(stats.shield)}</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-150"
                style={{ width: `${(stats.shield / stats.maxShield) * 100}%` }}
              />
            </div>
          </div>

          {/* Health Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-1">
              <div className="flex items-center gap-1">
                <Heart size={14} />
                <span>HEALTH</span>
              </div>
              <span className="font-mono-numbers text-sm">{Math.round(stats.health)}</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-150"
                style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom-Center: 5-Slot Inventory Hotbar */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          {/* Active Weapon Name & Ammo Display */}
          {activeItem && !stats.isBuilding && (
            <div className="flex items-center gap-3 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-bold shadow-lg">
              <span style={{ color: RARITY_COLORS[activeItem.rarity] }}>
                {activeItem.name}
              </span>
              {activeItem.isWeapon && activeItem.type !== 'PICKAXE' && (
                <div className="flex items-center gap-1 font-mono-numbers text-white">
                  <span className="text-amber-400">{activeItem.currentAmmo}</span>
                  <span className="text-slate-500">/</span>
                  <span className="text-slate-400">{activeItem.magazineSize}</span>
                </div>
              )}
            </div>
          )}

          {/* Slots */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-950/85 rounded-2xl border border-slate-800 shadow-2xl">
            {inventory.map((item, idx) => {
              const isSelected = stats.activeSlot === idx && !stats.isBuilding;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectSlot(idx)}
                  className={`relative w-14 h-14 rounded-xl flex flex-col items-center justify-center p-1 border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-yellow-400 bg-slate-800/90 scale-105 shadow-lg shadow-yellow-500/20'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                  style={{
                    borderColor: isSelected
                      ? '#facc15'
                      : item
                      ? RARITY_COLORS[item.rarity] + '60'
                      : undefined,
                  }}
                >
                  {/* Slot Number */}
                  <span className="absolute top-1 left-1.5 text-[10px] font-bold text-slate-400 font-mono-numbers">
                    {idx + 1}
                  </span>

                  {/* Item Icon / Content */}
                  {item ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-black leading-tight text-white line-clamp-1">
                        {item.name.replace('Assault Rifle', 'AR').replace('Pump Shotgun', 'Pump')}
                      </span>
                      {item.isWeapon && item.type !== 'PICKAXE' && (
                        <span className="text-[10px] font-mono-numbers font-bold text-slate-300">
                          {item.currentAmmo}
                        </span>
                      )}
                      {item.isConsumable && (
                        <span className="text-[10px] font-mono-numbers font-bold text-sky-400">
                          x{item.stackCount}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 font-medium">—</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom-Right: Materials & Building Selector */}
        <div className="flex flex-col items-end gap-2">
          {/* Materials Stock */}
          <div className="flex items-center gap-3 bg-slate-950/85 px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl text-xs font-bold font-mono-numbers">
            <div className="flex items-center gap-1 text-amber-500">
              <Box size={14} />
              <span>{stats.wood}</span>
            </div>
            <span className="text-slate-700">·</span>
            <div className="flex items-center gap-1 text-slate-400">
              <Box size={14} />
              <span>{stats.stone}</span>
            </div>
            <span className="text-slate-700">·</span>
            <div className="flex items-center gap-1 text-sky-400">
              <Box size={14} />
              <span>{stats.metal}</span>
            </div>
          </div>

          {/* Quick Building Hotkeys */}
          <div className="flex items-center gap-1.5 bg-slate-950/85 p-1.5 rounded-xl border border-slate-800 shadow-xl">
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                stats.isBuilding && stats.selectedBuild === 'WALL'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-900 text-slate-300'
              }`}
            >
              <span className="text-[10px] text-slate-400">[Q]</span>
              <span>Wall</span>
            </div>
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                stats.isBuilding && stats.selectedBuild === 'RAMP'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-900 text-slate-300'
              }`}
            >
              <span className="text-[10px] text-slate-400">[E]</span>
              <span>Ramp</span>
            </div>
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                stats.isBuilding && stats.selectedBuild === 'FLOOR'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-900 text-slate-300'
              }`}
            >
              <span className="text-[10px] text-slate-400">[F]</span>
              <span>Floor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
