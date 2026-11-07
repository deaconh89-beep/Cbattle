/**
 * Loot and Inventory System for Craft Royale
 * Handles item archetypes, loot generation, chest opening, ground drops, and consumables.
 */
import * as THREE from 'three';
import { ItemData, GroundItem, ChestObject, ItemRarity, WeaponType, MaterialType, PlayerStats } from '../types/game';
import { sound } from './sound';

// Rarity color mappings
export const RARITY_COLORS: Record<ItemRarity, string> = {
  COMMON: '#94a3b8',    // Slate gray
  UNCOMMON: '#22c55e',  // Green
  RARE: '#3b82f6',      // Blue
  EPIC: '#a855f7',      // Purple
  LEGENDARY: '#eab308', // Gold
};

// Base Item Catalog Templates
export function createPickaxe(): ItemData {
  return {
    id: 'pickaxe_default',
    type: 'PICKAXE',
    name: 'Harvesting Tool',
    rarity: 'COMMON',
    isConsumable: false,
    isWeapon: true,
    damage: 20, // 20 vs players, 50 vs structures/trees
    fireRate: 0.5,
    magazineSize: 0,
    currentAmmo: 0,
    reloadTime: 0,
    range: 4,
    spread: 0,
    stackCount: 1,
    maxStack: 1,
    color: '#94a3b8',
    icon: 'Pickaxe',
    description: 'Harvest wood, stone, metal and deal melee damage.',
  };
}

export function createAssaultRifle(rarity: ItemRarity = 'COMMON'): ItemData {
  const dmgMap: Record<ItemRarity, number> = {
    COMMON: 30,
    UNCOMMON: 33,
    RARE: 35,
    EPIC: 38,
    LEGENDARY: 42,
  };
  return {
    id: `ar_${Math.random().toString(36).substring(2, 9)}`,
    type: 'ASSAULT_RIFLE',
    name: `${rarity === 'COMMON' ? 'Standard' : rarity} Assault Rifle`,
    rarity,
    isConsumable: false,
    isWeapon: true,
    damage: dmgMap[rarity],
    fireRate: 0.18, // ~5.5 rounds/sec
    magazineSize: 30,
    currentAmmo: 30,
    reserveAmmoType: 'MEDIUM',
    reloadTime: 2.1,
    range: 120,
    spread: 0.025,
    stackCount: 1,
    maxStack: 1,
    color: RARITY_COLORS[rarity],
    icon: 'Crosshair',
    description: 'Versatile automatic rifle with accurate medium-to-long range fire.',
  };
}

export function createPumpShotgun(rarity: ItemRarity = 'UNCOMMON'): ItemData {
  const dmgMap: Record<ItemRarity, number> = {
    COMMON: 85,
    UNCOMMON: 95,
    RARE: 105,
    EPIC: 115,
    LEGENDARY: 125,
  };
  return {
    id: `shotgun_${Math.random().toString(36).substring(2, 9)}`,
    type: 'PUMP_SHOTGUN',
    name: `${rarity} Pump Shotgun`,
    rarity,
    isConsumable: false,
    isWeapon: true,
    damage: dmgMap[rarity],
    fireRate: 0.85,
    magazineSize: 5,
    currentAmmo: 5,
    reserveAmmoType: 'SHELLS',
    reloadTime: 3.5,
    range: 35,
    pellets: 8,
    spread: 0.07,
    stackCount: 1,
    maxStack: 1,
    color: RARITY_COLORS[rarity],
    icon: 'Zap',
    description: 'Devastating close-range weapon that fires a wide cluster of pellets.',
  };
}

export function createSniperRifle(rarity: ItemRarity = 'RARE'): ItemData {
  const dmgMap: Record<ItemRarity, number> = {
    COMMON: 95,
    UNCOMMON: 105,
    RARE: 115,
    EPIC: 130,
    LEGENDARY: 145,
  };
  return {
    id: `sniper_${Math.random().toString(36).substring(2, 9)}`,
    type: 'SNIPER_RIFLE',
    name: `${rarity} Bolt-Action Sniper`,
    rarity,
    isConsumable: false,
    isWeapon: true,
    damage: dmgMap[rarity],
    fireRate: 1.6,
    magazineSize: 1,
    currentAmmo: 1,
    reserveAmmoType: 'HEAVY',
    reloadTime: 2.8,
    range: 220,
    spread: 0.005,
    stackCount: 1,
    maxStack: 1,
    color: RARITY_COLORS[rarity],
    icon: 'Eye',
    description: 'High-damage precision bolt-action rifle with 2.5x headshot multiplier.',
  };
}

export function createRocketLauncher(rarity: ItemRarity = 'EPIC'): ItemData {
  return {
    id: `rpg_${Math.random().toString(36).substring(2, 9)}`,
    type: 'ROCKET_LAUNCHER',
    name: `${rarity} Rocket Launcher`,
    rarity,
    isConsumable: false,
    isWeapon: true,
    damage: 130,
    fireRate: 2.2,
    magazineSize: 1,
    currentAmmo: 1,
    reserveAmmoType: 'ROCKETS',
    reloadTime: 3.8,
    range: 90,
    spread: 0.01,
    stackCount: 1,
    maxStack: 1,
    color: RARITY_COLORS[rarity],
    icon: 'Flame',
    description: 'Explosive projectile weapon that instantly obliterates builds and enemies.',
  };
}

export function createMiniShield(count: number = 3): ItemData {
  return {
    id: `minis_${Math.random().toString(36).substring(2, 9)}`,
    type: 'MINI_SHIELD',
    name: 'Small Shield Potion',
    rarity: 'UNCOMMON',
    isConsumable: true,
    isWeapon: false,
    damage: 0,
    fireRate: 0,
    magazineSize: 0,
    currentAmmo: 0,
    reloadTime: 0,
    range: 0,
    spread: 0,
    shieldAmount: 25,
    maxShieldCap: 50,
    consumeTime: 2.0,
    stackCount: count,
    maxStack: 6,
    color: '#38bdf8',
    icon: 'Shield',
    description: 'Grants +25 Shield up to a maximum of 50 Shield (Takes 2.0s).',
  };
}

export function createBigShield(count: number = 1): ItemData {
  return {
    id: `big_shield_${Math.random().toString(36).substring(2, 9)}`,
    type: 'BIG_SHIELD',
    name: 'Shield Potion',
    rarity: 'RARE',
    isConsumable: true,
    isWeapon: false,
    damage: 0,
    fireRate: 0,
    magazineSize: 0,
    currentAmmo: 0,
    reloadTime: 0,
    range: 0,
    spread: 0,
    shieldAmount: 50,
    maxShieldCap: 100,
    consumeTime: 4.0,
    stackCount: count,
    maxStack: 3,
    color: '#0284c7',
    icon: 'ShieldCheck',
    description: 'Grants +50 Shield up to full 100 Shield (Takes 4.0s).',
  };
}

export function createMedkit(count: number = 1): ItemData {
  return {
    id: `medkit_${Math.random().toString(36).substring(2, 9)}`,
    type: 'MEDKIT',
    name: 'Medkit',
    rarity: 'UNCOMMON',
    isConsumable: true,
    isWeapon: false,
    damage: 0,
    fireRate: 0,
    magazineSize: 0,
    currentAmmo: 0,
    reloadTime: 0,
    range: 0,
    spread: 0,
    healAmount: 100,
    consumeTime: 5.0,
    stackCount: count,
    maxStack: 3,
    color: '#22c55e',
    icon: 'Heart',
    description: 'Restores health completely back to 100 HP (Takes 5.0s).',
  };
}

export function createBandages(count: number = 5): ItemData {
  return {
    id: `bandages_${Math.random().toString(36).substring(2, 9)}`,
    type: 'BANDAGES',
    name: 'Bandages',
    rarity: 'COMMON',
    isConsumable: true,
    isWeapon: false,
    damage: 0,
    fireRate: 0,
    magazineSize: 0,
    currentAmmo: 0,
    reloadTime: 0,
    range: 0,
    spread: 0,
    healAmount: 15,
    consumeTime: 3.0,
    stackCount: count,
    maxStack: 15,
    color: '#cbd5e1',
    icon: 'PlusCircle',
    description: 'Restores 15 Health up to a maximum of 75 HP (Takes 3.0s).',
  };
}

// Generate random chest loot burst
export function generateChestLoot(x: number, y: number, z: number): {
  items: ItemData[];
  materials: { type: MaterialType; amount: number };
  ammo: { type: 'LIGHT' | 'MEDIUM' | 'SHELLS' | 'HEAVY' | 'ROCKETS'; amount: number };
} {
  const rarities: ItemRarity[] = ['UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
  const rarityWeights = [0.45, 0.35, 0.15, 0.05];
  let roll = Math.random();
  let chosenRarity: ItemRarity = 'UNCOMMON';
  for (let i = 0; i < rarities.length; i++) {
    if (roll < rarityWeights[i]) {
      chosenRarity = rarities[i];
      break;
    }
    roll -= rarityWeights[i];
  }

  // Pick a weapon
  const weaponTypeRoll = Math.random();
  let weapon: ItemData;
  let ammoType: 'LIGHT' | 'MEDIUM' | 'SHELLS' | 'HEAVY' | 'ROCKETS' = 'MEDIUM';
  let ammoAmt = 30;

  if (weaponTypeRoll < 0.45) {
    weapon = createAssaultRifle(chosenRarity);
    ammoType = 'MEDIUM';
    ammoAmt = 40;
  } else if (weaponTypeRoll < 0.8) {
    weapon = createPumpShotgun(chosenRarity === 'COMMON' ? 'UNCOMMON' : chosenRarity);
    ammoType = 'SHELLS';
    ammoAmt = 15;
  } else if (weaponTypeRoll < 0.93) {
    weapon = createSniperRifle(chosenRarity);
    ammoType = 'HEAVY';
    ammoAmt = 8;
  } else {
    weapon = createRocketLauncher('EPIC');
    ammoType = 'ROCKETS';
    ammoAmt = 3;
  }

  // Pick a consumable
  const consumableRoll = Math.random();
  let consumable: ItemData;
  if (consumableRoll < 0.4) {
    consumable = createMiniShield(3);
  } else if (consumableRoll < 0.7) {
    consumable = createBigShield(1);
  } else if (consumableRoll < 0.9) {
    consumable = createMedkit(1);
  } else {
    consumable = createBandages(5);
  }

  // Materials
  const matTypes: MaterialType[] = ['WOOD', 'STONE', 'METAL'];
  const matType = matTypes[Math.floor(Math.random() * matTypes.length)];
  const matAmt = matType === 'WOOD' ? 40 : matType === 'STONE' ? 30 : 20;

  return {
    items: [weapon, consumable],
    materials: { type: matType, amount: matAmt },
    ammo: { type: ammoType, amount: ammoAmt },
  };
}

// 3D Ground Item Visualizer
export class LootManager {
  public groundItems: GroundItem[] = [];
  public chests: ChestObject[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public registerChest(chest: ChestObject) {
    this.chests.push(chest);
  }

  public spawnGroundItem(
    x: number,
    y: number,
    z: number,
    item: ItemData,
    materialDrop?: { type: MaterialType; amount: number },
    ammoDrop?: { type: string; amount: number }
  ): GroundItem {
    const id = `ground_${Math.random().toString(36).substring(2, 9)}`;

    // Create 3D representation
    const group = new THREE.Group();
    group.position.set(x, y + 0.4, z);

    // Core item icon box
    const boxGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const boxMat = new THREE.MeshStandardMaterial({
      color: item.color,
      roughness: 0.3,
      metalness: 0.5,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.castShadow = true;
    group.add(box);

    // Vertical rarity aura beam
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.15, 3.5, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: item.color,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 1.75;
    group.add(beam);

    // Glowing base ring
    const ringGeo = new THREE.RingGeometry(0.35, 0.55, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: item.color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.35;
    group.add(ring);

    this.scene.add(group);

    const groundItem: GroundItem = {
      id,
      x,
      y,
      z,
      item,
      materialType: materialDrop?.type,
      materialAmount: materialDrop?.amount,
      ammoType: ammoDrop?.type,
      ammoAmount: ammoDrop?.amount,
      mesh: group,
      beaconMesh: beam,
      rotation: Math.random() * Math.PI * 2,
      bobOffset: Math.random() * Math.PI * 2,
      spawnTime: performance.now(),
    };

    this.groundItems.push(groundItem);
    return groundItem;
  }

  public removeGroundItem(id: string) {
    const index = this.groundItems.findIndex((it) => it.id === id);
    if (index !== -1) {
      const item = this.groundItems[index];
      if (item.mesh) {
        this.scene.remove(item.mesh);
        item.mesh.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
            else child.material.dispose();
          }
        });
      }
      this.groundItems.splice(index, 1);
    }
  }

  public openChest(chestId: string, playerPos: THREE.Vector3): boolean {
    const chest = this.chests.find((c) => c.id === chestId);
    if (!chest || chest.isOpened) return false;

    chest.isOpened = true;
    sound.playChestOpen();

    // Rotate lid open
    if (chest.lidMesh) {
      chest.lidMesh.rotation.x = -Math.PI / 2.5;
    }

    // Generate burst loot around chest
    const loot = generateChestLoot(chest.x, chest.y, chest.z);

    // Pop out weapon
    const angle1 = Math.random() * Math.PI * 2;
    this.spawnGroundItem(
      chest.x + Math.cos(angle1) * 1.5,
      chest.y,
      chest.z + Math.sin(angle1) * 1.5,
      loot.items[0]
    );

    // Pop out consumable
    const angle2 = angle1 + 1.6;
    this.spawnGroundItem(
      chest.x + Math.cos(angle2) * 1.5,
      chest.y,
      chest.z + Math.sin(angle2) * 1.5,
      loot.items[1]
    );

    return true;
  }

  public update(dt: number) {
    const time = performance.now() * 0.002;
    for (const item of this.groundItems) {
      if (item.mesh) {
        // Rotate
        item.mesh.rotation.y += dt * 1.8;
        // Gentle bobbing
        item.mesh.position.y = item.y + 0.4 + Math.sin(time * 2 + item.bobOffset) * 0.12;
      }
    }
  }

  public cleanup() {
    for (const item of this.groundItems) {
      if (item.mesh) this.scene.remove(item.mesh);
    }
    this.groundItems = [];
    this.chests = [];
  }
}
