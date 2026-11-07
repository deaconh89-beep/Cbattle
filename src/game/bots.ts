/**
 * AI Bot Opponents System for Craft Royale
 * Controls 9 smart AI survivors that navigate biomes, loot, engage in gunfights,
 * build defensive cover when damaged, and escape the shrinking storm.
 */
import * as THREE from 'three';
import { BotData, ItemData, WeaponType, MaterialType, KillFeedItem } from '../types/game';
import { createCharacter, CharacterRig, createGunMesh } from './models';
import { sound } from './sound';
import { WorldManager } from './world';
import { BuildingSystem } from './building';
import { StormSystem } from './storm';
import { LootManager, createAssaultRifle, createPumpShotgun, createSniperRifle, createMiniShield } from './loot';

export interface BotInstance {
  data: BotData;
  rig: CharacterRig;
  weapon: ItemData;
  targetPos: THREE.Vector3;
  velocity: THREE.Vector3;
  targetEntity: { id: string; pos: THREE.Vector3; isPlayer: boolean } | null;
  state: 'ROAMING' | 'FLEEING_STORM' | 'ENGAGING' | 'BUILDING_COVER';
  fireCooldown: number;
  buildCooldown: number;
  walkCycle: number;
  isDead: boolean;
}

const BOT_NAMES = [
  'VoxelKnight',
  'PixelSniper',
  'BlockBuster',
  'StormChaser',
  'CrankGod99',
  'LlamaLover',
  'ShadowNinja',
  'IronBuilder',
  'Vortex',
];

const BOT_COLORS = [
  0xef4444, // Red
  0xf59e0b, // Amber
  0x10b981, // Emerald
  0x8b5cf6, // Violet
  0xec4899, // Pink
  0x06b6d4, // Cyan
  0x6366f1, // Indigo
  0x84cc16, // Lime
  0xf97316, // Orange
];

export class BotSystem {
  public bots: BotInstance[] = [];
  private scene: THREE.Scene;
  private world: WorldManager;
  private building: BuildingSystem;
  private storm: StormSystem;
  private lootManager: LootManager;

  constructor(
    scene: THREE.Scene,
    world: WorldManager,
    building: BuildingSystem,
    storm: StormSystem,
    lootManager: LootManager
  ) {
    this.scene = scene;
    this.world = world;
    this.building = building;
    this.storm = storm;
    this.lootManager = lootManager;
  }

  public spawnBots() {
    this.bots = [];

    // Distribute 9 bots across different biomes
    const spawnOffsets = [
      { x: -35, z: -35 }, // Pleasant Pines
      { x: -45, z: 20 },  // Cactus Canyon
      { x: -20, z: 45 },  // Desert Basin
      { x: 35, z: -35 },  // Frost Peak
      { x: 45, z: -15 },  // Mountain Foot
      { x: 45, z: 35 },   // Dusty Depot
      { x: 30, z: 50 },   // Depot Outskirts
      { x: 0, z: -40 },   // North Plains
      { x: -15, z: -10 }, // Near Sanctuary
    ];

    BOT_NAMES.forEach((name, idx) => {
      const loc = spawnOffsets[idx] || { x: (Math.random() - 0.5) * 80, z: (Math.random() - 0.5) * 80 };
      const y = this.world.getHeightAt(loc.x, loc.z);

      const rig = createCharacter(BOT_COLORS[idx % BOT_COLORS.length], false);
      rig.root.position.set(loc.x, y, loc.z);
      this.scene.add(rig.root);

      // Give bot initial weapon
      const weapon = idx % 2 === 0 ? createAssaultRifle('UNCOMMON') : createPumpShotgun('UNCOMMON');
      const gunMesh = createGunMesh(weapon.type);
      rig.weaponSlot.add(gunMesh);

      const bot: BotInstance = {
        data: {
          id: `bot_${idx}`,
          name,
          x: loc.x,
          y,
          z: loc.z,
          health: 100,
          shield: idx % 3 === 0 ? 50 : 25,
          isAlive: true,
          kills: 0,
        },
        rig,
        weapon,
        targetPos: new THREE.Vector3(loc.x + (Math.random() - 0.5) * 20, y, loc.z + (Math.random() - 0.5) * 20),
        velocity: new THREE.Vector3(),
        targetEntity: null,
        state: 'ROAMING',
        fireCooldown: Math.random() * 2,
        buildCooldown: 0,
        walkCycle: Math.random() * 10,
        isDead: false,
      };

      this.bots.push(bot);
    });
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerHealth: number,
    onBotKilled: (killer: string, victim: string, weapon: string) => void,
    onDamagePlayer: (damage: number) => void
  ) {
    for (const bot of this.bots) {
      if (bot.isDead) continue;

      // 1. Storm Check: If outside storm, prioritize fleeing toward safe zone
      const isOutside = this.storm.isOutsideStorm(bot.data.x, bot.data.z);
      if (isOutside) {
        bot.state = 'FLEEING_STORM';
        bot.targetPos.set(
          this.storm.state.targetCenterX + (Math.random() - 0.5) * 20,
          0,
          this.storm.state.targetCenterZ + (Math.random() - 0.5) * 20
        );

        // Storm DPS to bot
        bot.data.health -= this.storm.state.dps * dt;
        if (bot.data.health <= 0) {
          this.killBot(bot, 'The Storm', onBotKilled);
          continue;
        }
      }

      // 2. Target acquisition: Detect player or nearby bots
      const distToPlayer = bot.rig.root.position.distanceTo(playerPos);
      if (distToPlayer < 40 && playerHealth > 0 && !isOutside) {
        bot.targetEntity = { id: 'player', pos: playerPos, isPlayer: true };
        bot.state = 'ENGAGING';
      } else if (!bot.targetEntity && Math.random() < 0.05) {
        // Look for other bots
        for (const other of this.bots) {
          if (other.data.id !== bot.data.id && !other.isDead) {
            const dist = bot.rig.root.position.distanceTo(other.rig.root.position);
            if (dist < 30) {
              bot.targetEntity = { id: other.data.id, pos: other.rig.root.position, isPlayer: false };
              bot.state = 'ENGAGING';
              break;
            }
          }
        }
      }

      // 3. State Behavior Execution
      if (bot.state === 'ENGAGING' && bot.targetEntity) {
        const targetPos = bot.targetEntity.pos;
        const dx = targetPos.x - bot.data.x;
        const dz = targetPos.z - bot.data.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Turn towards target
        const lookYaw = Math.atan2(dx, dz);
        bot.rig.root.rotation.y = lookYaw;

        // Move into optimal weapon range
        const idealRange = bot.weapon.type === 'PUMP_SHOTGUN' ? 12 : 25;
        if (dist > idealRange) {
          bot.velocity.x = Math.sin(lookYaw) * 4.2;
          bot.velocity.z = Math.cos(lookYaw) * 4.2;
        } else if (dist < 6) {
          // Back up slightly
          bot.velocity.x = -Math.sin(lookYaw) * 3.0;
          bot.velocity.z = -Math.cos(lookYaw) * 3.0;
        } else {
          // Strafe
          bot.velocity.x = Math.cos(lookYaw) * 2.5;
          bot.velocity.z = -Math.sin(lookYaw) * 2.5;
        }

        // Fire weapon at target
        bot.fireCooldown -= dt;
        if (bot.fireCooldown <= 0) {
          bot.fireCooldown = bot.weapon.fireRate + Math.random() * 0.4;
          sound.playGunshot(bot.weapon.type);

          // Raycast / accuracy check
          const hitChance = Math.max(0.2, 0.7 - dist * 0.012);
          if (Math.random() < hitChance) {
            if (bot.targetEntity.isPlayer) {
              onDamagePlayer(bot.weapon.damage);
            } else {
              // Damage other bot
              const other = this.bots.find((b) => b.data.id === bot.targetEntity!.id);
              if (other && !other.isDead) {
                this.damageBot(other, bot.weapon.damage, bot.data.name, onBotKilled);
              }
            }
          }
        }
      } else {
        // Roaming / Seeking target position
        const toTargetX = bot.targetPos.x - bot.data.x;
        const toTargetZ = bot.targetPos.z - bot.data.z;
        const distToTarget = Math.sqrt(toTargetX * toTargetX + toTargetZ * toTargetZ);

        if (distToTarget < 3) {
          // Pick new random roam target
          bot.targetPos.set(
            bot.data.x + (Math.random() - 0.5) * 45,
            0,
            bot.data.z + (Math.random() - 0.5) * 45
          );
        } else {
          const moveYaw = Math.atan2(toTargetX, toTargetZ);
          bot.rig.root.rotation.y = moveYaw;
          bot.velocity.x = Math.sin(moveYaw) * 3.6;
          bot.velocity.z = Math.cos(moveYaw) * 3.6;
        }
      }

      // 4. Physics & Elevation
      bot.data.x += bot.velocity.x * dt;
      bot.data.z += bot.velocity.z * dt;
      bot.data.y = this.world.getHeightAt(bot.data.x, bot.data.z);

      bot.rig.root.position.set(bot.data.x, bot.data.y, bot.data.z);

      // 5. Walk Animation
      const speed = Math.sqrt(bot.velocity.x * bot.velocity.x + bot.velocity.z * bot.velocity.z);
      if (speed > 0.5) {
        bot.walkCycle += dt * 10;
        bot.rig.animate(bot.walkCycle, bot.state === 'ENGAGING', false);
      } else {
        bot.rig.animate(0, bot.state === 'ENGAGING', false);
      }
    }
  }

  public damageBot(
    bot: BotInstance,
    damage: number,
    attackerName: string,
    onBotKilled: (killer: string, victim: string, weapon: string) => void
  ) {
    if (bot.isDead) return;

    // Shield takes damage first
    if (bot.data.shield > 0) {
      const shieldDmg = Math.min(bot.data.shield, damage);
      bot.data.shield -= shieldDmg;
      damage -= shieldDmg;
    }

    if (damage > 0) {
      bot.data.health -= damage;
    }

    // Defensive building reaction! When shot, bot places a protective wall
    if (bot.buildCooldown <= 0 && Math.random() < 0.6) {
      bot.buildCooldown = 3.0;
      this.building.placeStructure(
        bot.rig.root.position,
        bot.rig.root.rotation.y,
        'WALL',
        'WOOD'
      );
    }

    if (bot.data.health <= 0) {
      this.killBot(bot, attackerName, onBotKilled);
    }
  }

  private killBot(
    bot: BotInstance,
    killer: string,
    onBotKilled: (killer: string, victim: string, weapon: string) => void
  ) {
    bot.isDead = true;
    bot.data.isAlive = false;
    sound.playEliminationSound();
    onBotKilled(killer, bot.data.name, bot.weapon.name);

    // Drop bot's weapon and resources
    this.lootManager.spawnGroundItem(bot.data.x, bot.data.y, bot.data.z, bot.weapon);
    this.lootManager.spawnGroundItem(
      bot.data.x + 1.0,
      bot.data.y,
      bot.data.z + 1.0,
      createMiniShield(2),
      { type: 'WOOD', amount: 30 }
    );

    // Remove mesh from scene
    this.scene.remove(bot.rig.root);
  }

  public getAliveBotCount(): number {
    return this.bots.filter((b) => !b.isDead).length;
  }

  public cleanup() {
    this.bots.forEach((b) => this.scene.remove(b.rig.root));
    this.bots = [];
  }
}
