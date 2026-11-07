/**
 * Craft Royale - 3D Voxel Battle Royale
 * React Application Shell
 * Mounts the isolated Three.js canvas container outside React HUD state overlays.
 */
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import {
  GameState,
  PlayerStats,
  KillFeedItem,
  StormState,
  MatchSummary,
  ItemData,
} from './types/game';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { PauseMenu } from './components/PauseMenu';
import { GameOverModal } from './components/GameOverModal';
import { InventoryModal } from './components/InventoryModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [matchSummary, setMatchSummary] = useState<MatchSummary>({
    rank: 10,
    kills: 0,
    damageDealt: 0,
    structuresBuilt: 0,
    materialsHarvested: 0,
    chestsOpened: 0,
    timeSurvived: 0,
  });

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    shield: 100,
    maxShield: 100,
    wood: 120,
    stone: 80,
    metal: 30,
    ammo: { light: 60, medium: 90, shells: 20, heavy: 6, rockets: 2 },
    kills: 0,
    isBuilding: false,
    selectedBuild: 'WALL',
    selectedBuildMat: 'WOOD',
    activeSlot: 1,
    isAiming: false,
    isReloading: false,
    reloadProgress: 0,
    isConsuming: false,
    consumeProgress: 0,
    canPlaceBuild: true,
    nearbyChestId: null,
    nearbyGroundItemId: null,
    nearbyGroundItemName: null,
    nearbyGroundItemRarity: null,
  });

  const [inventory, setInventory] = useState<(ItemData | null)[]>([]);
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [aliveCount, setAliveCount] = useState<number>(10);
  const [stormState, setStormState] = useState<StormState>({
    centerX: 0,
    centerZ: 0,
    currentRadius: 145,
    targetRadius: 110,
    targetCenterX: 0,
    targetCenterZ: 0,
    isShrinking: false,
    timeRemaining: 45,
    phase: 1,
    maxPhases: 5,
    dps: 1,
    isPlayerInStorm: false,
  });

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  useEffect(() => {
    if (!canvasMountRef.current) return;

    // Initialize Game Engine once
    const engine = new GameEngine(
      canvasMountRef.current,
      (stats, kFeed, alive) => {
        setPlayerStats({ ...stats });
        setKillFeed([...kFeed]);
        setAliveCount(alive);
        if (engine.stormSystem) {
          setStormState({ ...engine.stormSystem.state });
        }
        setInventory([...engine.inventory]);
      },
      (newState, summary) => {
        setGameState(newState);
        if (summary) setMatchSummary(summary);
      }
    );

    engineRef.current = engine;
    setInventory([...engine.inventory]);

    // Global Key Listener for Inventory Toggle (Tab or I)
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'Tab' || e.code === 'KeyI') {
        e.preventDefault();
        if (engine.gameState === 'PLAYING') {
          setIsInventoryOpen((prev) => {
            const next = !prev;
            if (next) engine.releasePointerLock();
            else engine.requestPointerLock();
            return next;
          });
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);

    return () => {
      window.removeEventListener('keydown', handleGlobalKey);
      engine.dispose();
    };
  }, []);

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.startMatch();
    }
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.gameState = 'PLAYING';
      engineRef.current.requestPointerLock();
      setGameState('PLAYING');
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      setIsInventoryOpen(false);
      engineRef.current.restartMatch();
    }
  };

  const handleMainMenu = () => {
    if (engineRef.current) {
      setIsInventoryOpen(false);
      engineRef.current.gameState = 'TITLE';
      engineRef.current.releasePointerLock();
      setGameState('TITLE');
    }
  };

  const handleSelectSlot = (slot: number) => {
    if (engineRef.current) {
      engineRef.current.playerStats.isBuilding = false;
      engineRef.current.equipSlot(slot);
    }
  };

  const handleDropItem = (slotIndex: number) => {
    if (engineRef.current) {
      const item = engineRef.current.inventory[slotIndex];
      if (item && item.type !== 'PICKAXE') {
        engineRef.current.lootManager.spawnGroundItem(
          engineRef.current.playerPos.x,
          engineRef.current.playerPos.y,
          engineRef.current.playerPos.z,
          item
        );
        engineRef.current.inventory[slotIndex] = null;
        setInventory([...engineRef.current.inventory]);
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Container (Isolated mount ref) */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && <TitleScreen onStartGame={handleStartGame} />}

      {/* In-Game Low-Occlusion HUD */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <HUD
          stats={playerStats}
          inventory={inventory}
          killFeed={killFeed}
          aliveCount={aliveCount}
          stormState={stormState}
          onSelectSlot={handleSelectSlot}
          onOpenInventory={() => {
            if (engineRef.current) engineRef.current.releasePointerLock();
            setIsInventoryOpen(true);
          }}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'PAUSED' && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Game Over / Victory Modal */}
      {(gameState === 'VICTORY' || gameState === 'DEFEATED') && (
        <GameOverModal
          isVictory={gameState === 'VICTORY'}
          summary={matchSummary}
          onPlayAgain={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Inventory & Backpack Inspection Modal */}
      {isInventoryOpen && (
        <InventoryModal
          inventory={inventory}
          stats={playerStats}
          onClose={() => {
            setIsInventoryOpen(false);
            if (engineRef.current && engineRef.current.gameState === 'PLAYING') {
              engineRef.current.requestPointerLock();
            }
          }}
          onDropItem={handleDropItem}
        />
      )}
    </div>
  );
}
