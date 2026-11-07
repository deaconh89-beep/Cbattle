/**
 * Craft Royale - Game Type Definitions
 */

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'DEFEATED';

export type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type WeaponType = 
  | 'PICKAXE'
  | 'ASSAULT_RIFLE'
  | 'PUMP_SHOTGUN'
  | 'SNIPER_RIFLE'
  | 'ROCKET_LAUNCHER'
  | 'MINI_SHIELD'
  | 'BIG_SHIELD'
  | 'MEDKIT'
  | 'BANDAGES';

export type StructureType = 'WALL' | 'RAMP' | 'FLOOR';

export type MaterialType = 'WOOD' | 'STONE' | 'METAL';

export interface ItemData {
  id: string; // unique instance ID
  type: WeaponType;
  name: string;
  rarity: ItemRarity;
  isConsumable: boolean;
  isWeapon: boolean;
  damage: number;
  fireRate: number; // seconds between shots
  magazineSize: number;
  currentAmmo: number;
  reserveAmmoType?: 'LIGHT' | 'MEDIUM' | 'SHELLS' | 'HEAVY' | 'ROCKETS';
  reloadTime: number;
  range: number;
  pellets?: number;
  spread: number;
  healAmount?: number;
  shieldAmount?: number;
  maxShieldCap?: number;
  consumeTime?: number; // seconds to consume
  stackCount: number;
  maxStack: number;
  color: string;
  icon: string;
  description: string;
}

export interface InventorySlot {
  item: ItemData | null;
}

export interface GroundItem {
  id: string;
  x: number;
  y: number;
  z: number;
  item: ItemData;
  materialType?: MaterialType;
  materialAmount?: number;
  ammoType?: string;
  ammoAmount?: number;
  mesh?: any;
  beaconMesh?: any;
  rotation: number;
  bobOffset: number;
  spawnTime: number;
}

export interface ChestObject {
  id: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  isOpened: boolean;
  mesh?: any;
  lidMesh?: any;
}

export interface AmmoStock {
  light: number;
  medium: number;
  shells: number;
  heavy: number;
  rockets: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  wood: number;
  stone: number;
  metal: number;
  ammo: AmmoStock;
  kills: number;
  isBuilding: boolean;
  selectedBuild: StructureType;
  selectedBuildMat: MaterialType;
  activeSlot: number;
  isAiming: boolean;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  isConsuming: boolean;
  consumeProgress: number; // 0 to 1
  canPlaceBuild: boolean;
  nearbyChestId: string | null;
  nearbyGroundItemId: string | null;
  nearbyGroundItemName: string | null;
  nearbyGroundItemRarity: ItemRarity | null;
}

export interface KillFeedItem {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  isPlayerKill: boolean;
  timestamp: number;
}

export interface DamageNumber {
  id: string;
  damage: number;
  x: number;
  y: number;
  z: number;
  isCritical: boolean;
  isShield: boolean;
  life: number; // 0 to 1
}

export interface StormState {
  centerX: number;
  centerZ: number;
  currentRadius: number;
  targetRadius: number;
  targetCenterX: number;
  targetCenterZ: number;
  isShrinking: boolean;
  timeRemaining: number;
  phase: number;
  maxPhases: number;
  dps: number;
  isPlayerInStorm: boolean;
}

export interface BotData {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  health: number;
  shield: number;
  isAlive: boolean;
  kills: number;
}

export interface MatchSummary {
  rank: number;
  kills: number;
  damageDealt: number;
  structuresBuilt: number;
  materialsHarvested: number;
  chestsOpened: number;
  timeSurvived: number;
}
