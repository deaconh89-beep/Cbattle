/**
 * Inventory & Backpack Modal for Craft Royale
 * Allows players to inspect weapon statistics, manage slots, view ammo stockpiles, and drop items.
 */
import React from 'react';
import { ItemData, PlayerStats } from '../types/game';
import { X, ArrowDown, Box, Shield, Zap, Crosshair } from 'lucide-react';
import { RARITY_COLORS } from '../game/loot';

interface InventoryModalProps {
  inventory: (ItemData | null)[];
  stats: PlayerStats;
  onClose: () => void;
  onDropItem: (slotIndex: number) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  stats,
  onClose,
  onDropItem,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center p-4 z-40 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col relative text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white">BACKPACK & LOADOUT</h2>
            <p className="text-xs text-slate-400">Manage weapons, ammo reserves, and building materials</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* 5 Hotbar Slots Detail */}
        <div className="grid grid-cols-5 gap-3 my-6">
          {inventory.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-800/60 rounded-2xl p-3 border flex flex-col justify-between h-48 relative"
              style={{
                borderColor: item ? RARITY_COLORS[item.rarity] + '80' : '#334155',
              }}
            >
              <span className="text-[10px] font-bold text-slate-400 font-mono-numbers">
                Slot {idx + 1}
              </span>

              {item ? (
                <>
                  <div className="my-auto flex flex-col items-center text-center">
                    <span
                      className="text-xs font-black line-clamp-2 mb-1"
                      style={{ color: RARITY_COLORS[item.rarity] }}
                    >
                      {item.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {item.rarity}
                    </span>

                    {/* Stats pill */}
                    {item.isWeapon && item.type !== 'PICKAXE' && (
                      <div className="text-[10px] font-mono-numbers text-slate-300 mt-2 bg-slate-900/60 px-2 py-0.5 rounded">
                        DMG: {item.damage}
                      </div>
                    )}
                    {item.isConsumable && (
                      <div className="text-[10px] font-mono-numbers text-sky-400 mt-2 bg-slate-900/60 px-2 py-0.5 rounded">
                        x{item.stackCount}
                      </div>
                    )}
                  </div>

                  {item.type !== 'PICKAXE' && (
                    <button
                      onClick={() => onDropItem(idx)}
                      className="w-full py-1 bg-slate-900/80 hover:bg-red-500/20 hover:text-red-300 text-[10px] font-bold rounded-lg text-slate-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowDown size={12} />
                      Drop
                    </button>
                  )}
                </>
              ) : (
                <div className="my-auto text-center text-xs text-slate-600 font-medium">
                  Empty
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Resources & Ammo Reserves */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
          {/* Building Materials */}
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/40">
            <span className="font-bold text-white block mb-2">Building Materials</span>
            <div className="grid grid-cols-3 gap-2 font-mono-numbers text-center">
              <div className="bg-slate-900/70 p-2 rounded-lg border border-amber-600/30 text-amber-400">
                <span className="block text-[10px] text-slate-400">WOOD</span>
                <span className="font-bold text-sm">{stats.wood}</span>
              </div>
              <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-600/30 text-slate-300">
                <span className="block text-[10px] text-slate-400">STONE</span>
                <span className="font-bold text-sm">{stats.stone}</span>
              </div>
              <div className="bg-slate-900/70 p-2 rounded-lg border border-sky-600/30 text-sky-400">
                <span className="block text-[10px] text-slate-400">METAL</span>
                <span className="font-bold text-sm">{stats.metal}</span>
              </div>
            </div>
          </div>

          {/* Ammo Reserves */}
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/40">
            <span className="font-bold text-white block mb-2">Ammo Reserves</span>
            <div className="grid grid-cols-3 gap-2 font-mono-numbers text-center">
              <div className="bg-slate-900/70 p-2 rounded-lg text-slate-300">
                <span className="block text-[10px] text-slate-400">MEDIUM</span>
                <span className="font-bold text-sm">{stats.ammo.medium}</span>
              </div>
              <div className="bg-slate-900/70 p-2 rounded-lg text-slate-300">
                <span className="block text-[10px] text-slate-400">SHELLS</span>
                <span className="font-bold text-sm">{stats.ammo.shells}</span>
              </div>
              <div className="bg-slate-900/70 p-2 rounded-lg text-slate-300">
                <span className="block text-[10px] text-slate-400">HEAVY</span>
                <span className="font-bold text-sm">{stats.ammo.heavy}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
