/**
 * Master Three.js Game Engine for Craft Royale
 * Integrates rendering, over-the-shoulder TPS camera, player physics, combat raycasting,
 * building, destructible environments, storm, bots, loot, and HUD data bridge.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  GameState,
  PlayerStats,
  ItemData,
  StructureType,
  MaterialType,
  DamageNumber,
  KillFeedItem,
  MatchSummary,
} from '../types/game';
import { sound } from './sound';
import { createCharacter, CharacterRig, createGunMesh, createPickaxeMesh } from './models';
import { WorldManager } from './world';
import { BuildingSystem } from './building';
import { StormSystem } from './storm';
import { BotSystem } from './bots';
import {
  LootManager,
  createPickaxe,
  createAssaultRifle,
  createPumpShotgun,
  createMiniShield,
} from './loot';

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Subsystems
  public lootManager: LootManager;
  public worldManager: WorldManager;
  public buildingSystem: BuildingSystem;
  public stormSystem: StormSystem;
  public botSystem: BotSystem;

  // Player state & rig
  public playerRig: CharacterRig;
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 5, 0);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public playerYaw: number = 0;
  public playerPitch: number = 0;
  public isGrounded: boolean = false;
  private walkCycle: number = 0;

  // Inventory & Stats
  public playerStats: PlayerStats;
  public inventory: (ItemData | null)[] = [
    createPickaxe(),
    createAssaultRifle('COMMON'),
    createPumpShotgun('UNCOMMON'),
    createMiniShield(3),
    null,
  ];

  // Match state
  public gameState: GameState = 'TITLE';
  public killFeed: KillFeedItem[] = [];
  public damageNumbers: DamageNumber[] = [];
  public matchSummary: MatchSummary = {
    rank: 10,
    kills: 0,
    damageDealt: 0,
    structuresBuilt: 0,
    materialsHarvested: 0,
    chestsOpened: 0,
    timeSurvived: 0,
  };

  // Input state
  private keys: Record<string, boolean> = {};
  private mouseButtons: Record<number, boolean> = {};
  private isPointerLocked: boolean = false;
  private weaponMesh: THREE.Group | null = null;
  private swingTimer: number = 0;
  private shotCooldown: number = 0;

  // Callback to React HUD
  private onHudUpdate: (stats: PlayerStats, killFeed: KillFeedItem[], aliveCount: number) => void;
  private onGameStateChange: (state: GameState, summary?: MatchSummary) => void;

  // Rendering lifecycle
  private frameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private matchStartTime: number = 0;
  private hitstopRemaining: number = 0;

  constructor(
    container: HTMLElement,
    onHudUpdate: (stats: PlayerStats, killFeed: KillFeedItem[], aliveCount: number) => void,
    onGameStateChange: (state: GameState, summary?: MatchSummary) => void
  ) {
    this.container = container;
    this.onHudUpdate = onHudUpdate;
    this.onGameStateChange = onGameStateChange;

    // 1. Software WebGL Guard (r160+ standard)
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Scene, Camera & Lighting
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.0075);

    this.camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );

    // Procedural Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3-Point Studio & Atmospheric Lighting
    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    sunLight.position.set(70, 100, 50);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 250;
      const d = 90;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x15803d, 0.85);
    this.scene.add(hemiLight);

    // 4. Initialize Subsystems
    this.lootManager = new LootManager(this.scene);
    this.worldManager = new WorldManager(this.scene, this.lootManager);
    this.buildingSystem = new BuildingSystem(this.scene);
    this.stormSystem = new StormSystem(this.scene);
    this.botSystem = new BotSystem(
      this.scene,
      this.worldManager,
      this.buildingSystem,
      this.stormSystem,
      this.lootManager
    );

    // 5. Build World & Player
    this.worldManager.generateWorld();

    this.playerRig = createCharacter(0x0284c7, true);
    this.scene.add(this.playerRig.root);

    // Initial stats
    this.playerStats = {
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      wood: 120,
      stone: 80,
      metal: 30,
      ammo: {
        light: 60,
        medium: 90,
        shells: 20,
        heavy: 6,
        rockets: 2,
      },
      kills: 0,
      isBuilding: false,
      selectedBuild: 'WALL',
      selectedBuildMat: 'WOOD',
      activeSlot: 1, // Start with Assault Rifle
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
    };

    this.equipSlot(1);

    // 6. Listeners & Controls
    this.setupEventListeners();

    // 7. Start Render Loop
    this.startLoop();
  }

  // --- INPUT & EVENT LISTENERS ---

  private setupEventListeners() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('blur', this.onBlur);

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
      if (!this.isPointerLocked && this.gameState === 'PLAYING') {
        // Paused if released
      }
    });
  }

  public requestPointerLock() {
    this.renderer.domElement.requestPointerLock();
  }

  public releasePointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onBlur = () => {
    this.keys = {};
    this.mouseButtons = {};
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (this.gameState === 'TITLE') {
      if (e.code === 'Space' || e.code === 'Enter') {
        this.startMatch();
      }
      return;
    }

    if (e.code === 'Escape') {
      if (this.gameState === 'PLAYING') {
        this.gameState = 'PAUSED';
        this.onGameStateChange('PAUSED');
      } else if (this.gameState === 'PAUSED') {
        this.gameState = 'PLAYING';
        this.requestPointerLock();
        this.onGameStateChange('PLAYING');
      }
      return;
    }

    if (this.gameState !== 'PLAYING') return;

    // Quick Slot Keys 1 - 5
    if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
      const slotIndex = parseInt(e.code.replace('Digit', '')) - 1;
      this.playerStats.isBuilding = false;
      this.equipSlot(slotIndex);
    }

    // Building Hotkeys
    if (e.code === 'KeyQ') {
      // Toggle Wall
      this.toggleBuildPiece('WALL');
    } else if (e.code === 'KeyE') {
      // If near chest or item, prioritize interaction! Otherwise Ramp
      if (this.playerStats.nearbyChestId || this.playerStats.nearbyGroundItemId) {
        this.interactLoot();
      } else {
        this.toggleBuildPiece('RAMP');
      }
    } else if (e.code === 'KeyF') {
      this.toggleBuildPiece('FLOOR');
    }

    // Material cycle in build mode
    if (e.code === 'KeyZ' && this.playerStats.isBuilding) {
      const mats: MaterialType[] = ['WOOD', 'STONE', 'METAL'];
      const currIdx = mats.indexOf(this.playerStats.selectedBuildMat);
      this.playerStats.selectedBuildMat = mats[(currIdx + 1) % mats.length];
    }

    // Reload
    if (e.code === 'KeyR') {
      this.startReload();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (!this.isPointerLocked) {
      if (this.gameState === 'PLAYING') {
        this.requestPointerLock();
      }
      return;
    }

    this.mouseButtons[e.button] = true;

    if (e.button === 0) {
      // Left click: Fire or Build
      this.onPrimaryAction();
    } else if (e.button === 2) {
      // Right click: Aim Down Sights
      this.playerStats.isAiming = true;
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    this.mouseButtons[e.button] = false;
    if (e.button === 2) {
      this.playerStats.isAiming = false;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked || this.gameState !== 'PLAYING') return;

    const sens = 0.0022;
    this.playerYaw -= e.movementX * sens;
    this.playerPitch -= e.movementY * sens;

    // Clamp pitch between -60 and +60 deg
    const maxPitch = Math.PI / 3.0;
    this.playerPitch = Math.max(-maxPitch, Math.min(maxPitch, this.playerPitch));
  };

  // --- GAMEPLAY ACTIONS ---

  private toggleBuildPiece(type: StructureType) {
    if (this.playerStats.isBuilding && this.playerStats.selectedBuild === type) {
      this.playerStats.isBuilding = false;
    } else {
      this.playerStats.isBuilding = true;
      this.playerStats.selectedBuild = type;
    }
  }

  public equipSlot(slotIndex: number) {
    if (slotIndex < 0 || slotIndex >= 5) return;
    this.playerStats.activeSlot = slotIndex;
    const item = this.inventory[slotIndex];

    // Remove old weapon mesh
    if (this.weaponMesh) {
      this.playerRig.weaponSlot.remove(this.weaponMesh);
      this.weaponMesh = null;
    }

    if (item) {
      if (item.type === 'PICKAXE') {
        this.weaponMesh = createPickaxeMesh();
      } else if (item.isWeapon) {
        this.weaponMesh = createGunMesh(item.type);
      }
      if (this.weaponMesh) {
        this.playerRig.weaponSlot.add(this.weaponMesh);
      }
    }
  }

  private onPrimaryAction() {
    if (this.playerStats.isBuilding) {
      // Place structure!
      const mat = this.playerStats.selectedBuildMat;
      const cost = 10;
      const currentMatAmt =
        mat === 'WOOD'
          ? this.playerStats.wood
          : mat === 'STONE'
          ? this.playerStats.stone
          : this.playerStats.metal;

      if (currentMatAmt >= cost) {
        const placed = this.buildingSystem.placeStructure(
          this.playerPos,
          this.playerYaw,
          this.playerStats.selectedBuild,
          mat
        );
        if (placed) {
          if (mat === 'WOOD') this.playerStats.wood -= cost;
          else if (mat === 'STONE') this.playerStats.stone -= cost;
          else this.playerStats.metal -= cost;
          this.matchSummary.structuresBuilt++;
        }
      }
      return;
    }

    const currentItem = this.inventory[this.playerStats.activeSlot];
    if (!currentItem) return;

    if (currentItem.isConsumable) {
      this.consumeItem(currentItem);
      return;
    }

    if (currentItem.type === 'PICKAXE') {
      this.swingPickaxe(currentItem);
      return;
    }

    if (currentItem.isWeapon) {
      this.fireWeapon(currentItem);
    }
  }

  private swingPickaxe(pickaxe: ItemData) {
    if (this.swingTimer > 0) return;
    this.swingTimer = pickaxe.fireRate;
    sound.playPickaxeSwing();

    // Raycast forward from camera
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    ray.far = 4.5;

    // Check destructible props
    let hitSomething = false;
    for (const prop of this.worldManager.destructibles) {
      if (prop.isDead) continue;
      const dist = prop.mesh.position.distanceTo(this.playerPos);
      if (dist < prop.radius + 3.0) {
        const destroyed = this.worldManager.damageProp(
          prop.id,
          pickaxe.damage * 2.5,
          (mat, amt) => {
            if (mat === 'WOOD') this.playerStats.wood += amt;
            else if (mat === 'STONE') this.playerStats.stone += amt;
            else this.playerStats.metal += amt;
            this.matchSummary.materialsHarvested += amt;
          }
        );
        hitSomething = true;
        this.addDamageNumber(pickaxe.damage * 2.5, prop.mesh.position, false, false);
        break;
      }
    }

    // Check placed structures
    if (!hitSomething) {
      for (const [id, struct] of this.buildingSystem.structures) {
        const dist = struct.mesh.position.distanceTo(this.playerPos);
        if (dist < 4.5) {
          this.buildingSystem.damageStructure(id, pickaxe.damage * 2.5);
          hitSomething = true;
          this.addDamageNumber(pickaxe.damage * 2.5, struct.mesh.position, false, false);
          break;
        }
      }
    }

    // Check bots
    if (!hitSomething) {
      for (const bot of this.botSystem.bots) {
        if (bot.isDead) continue;
        const dist = bot.rig.root.position.distanceTo(this.playerPos);
        if (dist < 3.0) {
          sound.playHitmarker(false);
          this.botSystem.damageBot(bot, pickaxe.damage, 'Player', this.onKillFeed);
          this.addDamageNumber(pickaxe.damage, bot.rig.root.position, false, bot.data.shield > 0);
          this.matchSummary.damageDealt += pickaxe.damage;
          break;
        }
      }
    }
  }

  private fireWeapon(weapon: ItemData) {
    if (this.shotCooldown > 0 || this.playerStats.isReloading) return;

    if (weapon.currentAmmo <= 0) {
      this.startReload();
      return;
    }

    weapon.currentAmmo--;
    this.shotCooldown = weapon.fireRate;
    sound.playGunshot(weapon.type);

    // Screen kick recoil
    this.playerPitch += 0.015;

    // Raycast bullet targeting
    const ray = new THREE.Raycaster();
    const spreadAngle = this.playerStats.isAiming ? weapon.spread * 0.4 : weapon.spread;
    const spreadX = (Math.random() - 0.5) * spreadAngle;
    const spreadY = (Math.random() - 0.5) * spreadAngle;

    ray.setFromCamera(new THREE.Vector2(spreadX, spreadY), this.camera);
    ray.far = weapon.range;

    // Check hit against bots
    let hitBot = false;
    for (const bot of this.botSystem.bots) {
      if (bot.isDead) continue;
      const botPos = bot.rig.root.position.clone();
      botPos.y += 1.0; // Center mass

      const distToRay = ray.ray.distanceToPoint(botPos);
      if (distToRay < 1.0) {
        const isHeadshot = Math.random() < 0.25;
        const finalDamage = Math.round(weapon.damage * (isHeadshot ? 1.75 : 1.0));

        sound.playHitmarker(isHeadshot);
        this.addDamageNumber(finalDamage, botPos, isHeadshot, bot.data.shield > 0);
        this.matchSummary.damageDealt += finalDamage;

        this.botSystem.damageBot(bot, finalDamage, 'Player', this.onKillFeed);
        hitBot = true;
        break;
      }
    }

    // Check structures if no bot hit
    if (!hitBot) {
      for (const [id, struct] of this.buildingSystem.structures) {
        const dist = struct.mesh.position.distanceTo(this.playerPos);
        if (dist < weapon.range) {
          const center = struct.mesh.position.clone();
          center.y += 1.5;
          if (ray.ray.distanceToPoint(center) < 2.0) {
            this.buildingSystem.damageStructure(id, weapon.damage);
            break;
          }
        }
      }
    }
  }

  private startReload() {
    const weapon = this.inventory[this.playerStats.activeSlot];
    if (!weapon || !weapon.isWeapon || weapon.type === 'PICKAXE' || this.playerStats.isReloading) {
      return;
    }

    const needed = weapon.magazineSize - weapon.currentAmmo;
    if (needed <= 0) return;

    this.playerStats.isReloading = true;
    this.playerStats.reloadProgress = 0;

    let elapsed = 0;
    const duration = weapon.reloadTime;
    const interval = setInterval(() => {
      elapsed += 0.05;
      this.playerStats.reloadProgress = Math.min(1, elapsed / duration);
      if (elapsed >= duration) {
        clearInterval(interval);
        weapon.currentAmmo = weapon.magazineSize;
        this.playerStats.isReloading = false;
        this.playerStats.reloadProgress = 0;
      }
    }, 50);
  }

  private consumeItem(item: ItemData) {
    if (this.playerStats.isConsuming) return;

    // Check caps
    if (item.type === 'MINI_SHIELD' && this.playerStats.shield >= 50) return;
    if (item.type === 'BIG_SHIELD' && this.playerStats.shield >= 100) return;
    if (item.type === 'MEDKIT' && this.playerStats.health >= 100) return;
    if (item.type === 'BANDAGES' && this.playerStats.health >= 75) return;

    this.playerStats.isConsuming = true;
    this.playerStats.consumeProgress = 0;
    sound.playDrinkPotion();

    const duration = item.consumeTime || 3.0;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 0.05;
      this.playerStats.consumeProgress = Math.min(1, elapsed / duration);

      if (elapsed >= duration) {
        clearInterval(interval);
        this.playerStats.isConsuming = false;
        this.playerStats.consumeProgress = 0;

        // Apply effect
        if (item.shieldAmount) {
          const cap = item.maxShieldCap || 100;
          this.playerStats.shield = Math.min(cap, this.playerStats.shield + item.shieldAmount);
          sound.playShieldUp();
        }
        if (item.healAmount) {
          this.playerStats.health = Math.min(100, this.playerStats.health + item.healAmount);
        }

        // Deduct stack
        item.stackCount--;
        if (item.stackCount <= 0) {
          this.inventory[this.playerStats.activeSlot] = null;
        }
      }
    }, 50);
  }

  private interactLoot() {
    // Open chest
    if (this.playerStats.nearbyChestId) {
      const opened = this.lootManager.openChest(this.playerStats.nearbyChestId, this.playerPos);
      if (opened) {
        this.matchSummary.chestsOpened++;
        this.playerStats.nearbyChestId = null;
      }
      return;
    }

    // Pick up ground item
    if (this.playerStats.nearbyGroundItemId) {
      const gItem = this.lootManager.groundItems.find(
        (it) => it.id === this.playerStats.nearbyGroundItemId
      );
      if (gItem) {
        sound.playItemPickup();

        // Find empty slot or swap active slot
        let targetSlot = this.inventory.findIndex((s) => s === null);
        if (targetSlot === -1) {
          targetSlot = this.playerStats.activeSlot;
          // Drop currently equipped item to ground
          const oldItem = this.inventory[targetSlot];
          if (oldItem && oldItem.type !== 'PICKAXE') {
            this.lootManager.spawnGroundItem(this.playerPos.x, this.playerPos.y, this.playerPos.z, oldItem);
          }
        }

        this.inventory[targetSlot] = gItem.item;
        this.lootManager.removeGroundItem(gItem.id);
        this.equipSlot(targetSlot);
      }
    }
  }

  private onKillFeed = (killer: string, victim: string, weapon: string) => {
    const isPlayerKill = killer === 'Player';
    if (isPlayerKill) {
      this.playerStats.kills++;
      this.matchSummary.kills++;
    }

    this.killFeed.unshift({
      id: Math.random().toString(),
      killer,
      victim,
      weapon,
      isPlayerKill,
      timestamp: performance.now(),
    });

    if (this.killFeed.length > 5) {
      this.killFeed.pop();
    }

    // Check Victory
    const aliveBots = this.botSystem.getAliveBotCount();
    if (aliveBots === 0 && this.playerStats.health > 0) {
      this.triggerVictory();
    }
  };

  private addDamageNumber(
    damage: number,
    pos: THREE.Vector3,
    isCritical: boolean,
    isShield: boolean
  ) {
    this.damageNumbers.push({
      id: Math.random().toString(),
      damage,
      x: pos.x + (Math.random() - 0.5) * 0.4,
      y: pos.y + 1.2,
      z: pos.z + (Math.random() - 0.5) * 0.4,
      isCritical,
      isShield,
      life: 1.0,
    });
  }

  // --- MATCH CONTROL ---

  public startMatch() {
    this.gameState = 'PLAYING';
    this.matchStartTime = performance.now();
    this.playerStats.health = 100;
    this.playerStats.shield = 100;
    this.playerStats.kills = 0;
    this.playerPos.set(0, 15, 0); // Drop in
    this.playerVelocity.set(0, 0, 0);

    // Spawn 9 bots
    this.botSystem.spawnBots();

    this.requestPointerLock();
    this.onGameStateChange('PLAYING');
  }

  public restartMatch() {
    this.lootManager.cleanup();
    this.buildingSystem.cleanup();
    this.botSystem.cleanup();
    this.worldManager.cleanup();

    // Rebuild world & bots
    this.worldManager.generateWorld();
    this.inventory = [
      createPickaxe(),
      createAssaultRifle('COMMON'),
      createPumpShotgun('UNCOMMON'),
      createMiniShield(3),
      null,
    ];
    this.equipSlot(1);

    this.startMatch();
  }

  private triggerVictory() {
    this.gameState = 'VICTORY';
    this.matchSummary.rank = 1;
    this.matchSummary.timeSurvived = Math.floor((performance.now() - this.matchStartTime) / 1000);
    sound.playVictoryFanfare();
    this.releasePointerLock();
    this.onGameStateChange('VICTORY', this.matchSummary);
  }

  private triggerDefeat() {
    this.gameState = 'DEFEATED';
    this.matchSummary.rank = this.botSystem.getAliveBotCount() + 1;
    this.matchSummary.timeSurvived = Math.floor((performance.now() - this.matchStartTime) / 1000);
    this.releasePointerLock();
    this.onGameStateChange('DEFEATED', this.matchSummary);
  }

  // --- GAME LOOP ---

  private startLoop() {
    const tick = () => {
      this.frameId = requestAnimationFrame(tick);
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Clamped delta time

      if (this.gameState === 'PLAYING') {
        this.updateGameplay(dt);
      } else if (this.gameState === 'TITLE') {
        // Slow cinematic camera orbit around island
        const t = performance.now() * 0.0003;
        const camX = Math.cos(t) * 45;
        const camZ = Math.sin(t) * 45;
        this.camera.position.set(camX, 18, camZ);
        this.camera.lookAt(0, 4, 0);

        // Idle player breath
        this.playerRig.root.position.set(0, this.worldManager.getHeightAt(0, 0), 0);
        this.playerRig.animate(Math.sin(performance.now() * 0.003) * 0.3, false, false);
      }

      this.renderer.render(this.scene, this.camera);
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private updateGameplay(dt: number) {
    if (this.hitstopRemaining > 0) {
      this.hitstopRemaining -= dt;
      return;
    }

    if (this.swingTimer > 0) this.swingTimer -= dt;
    if (this.shotCooldown > 0) this.shotCooldown -= dt;

    // 1. Player Movement & Physics
    const speed = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 9.5 : 6.8;
    const moveVector = new THREE.Vector3();

    if (this.keys['KeyW']) moveVector.z -= 1;
    if (this.keys['KeyS']) moveVector.z += 1;
    if (this.keys['KeyA']) moveVector.x -= 1;
    if (this.keys['KeyD']) moveVector.x += 1;

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);

      this.playerVelocity.x = moveVector.x * speed;
      this.playerVelocity.z = moveVector.z * speed;
      this.walkCycle += dt * 14;
    } else {
      this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, 0, 12, dt);
      this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, 0, 12, dt);
    }

    // Gravity & Jump
    this.playerVelocity.y -= 24 * dt;
    if (this.keys['Space'] && this.isGrounded) {
      this.playerVelocity.y = 8.5;
      this.isGrounded = false;
    }

    // Update position
    this.playerPos.x += this.playerVelocity.x * dt;
    this.playerPos.z += this.playerVelocity.z * dt;
    this.playerPos.y += this.playerVelocity.y * dt;

    // Terrain ground check
    const terrainY = this.worldManager.getHeightAt(this.playerPos.x, this.playerPos.z);
    if (this.playerPos.y <= terrainY) {
      this.playerPos.y = terrainY;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // Building structure collision resolution
    this.playerPos = this.buildingSystem.checkPlayerCollision(this.playerPos);

    // 2. Player Rig Animation & Sync
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.playerRig.animate(
      this.walkCycle,
      this.playerStats.isAiming,
      this.swingTimer > 0
    );

    // 3. Over-the-shoulder TPS Camera Positioning
    const shoulderOffset = this.playerStats.isAiming ? 0.65 : 0.95;
    const distBack = this.playerStats.isAiming ? 2.0 : 3.4;
    const camHeight = 1.65;

    // Camera follow rig with pitch and yaw
    const camTarget = this.playerPos.clone();
    camTarget.y += camHeight;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);

    const desiredCamPos = camTarget
      .clone()
      .addScaledVector(forward, -distBack)
      .addScaledVector(right, shoulderOffset);
    desiredCamPos.y += Math.sin(this.playerPitch) * distBack + 0.3;

    // Smooth camera damping
    this.camera.position.copy(desiredCamPos);
    const lookTarget = camTarget.clone().addScaledVector(forward, 25);
    lookTarget.y -= Math.sin(this.playerPitch) * 25;
    this.camera.lookAt(lookTarget);

    // 4. Update Subsystems
    this.lootManager.update(dt);
    this.stormSystem.update(dt, this.playerPos, (dps) => {
      this.damagePlayer(dps);
    });

    this.botSystem.update(
      dt,
      this.playerPos,
      this.playerStats.health,
      this.onKillFeed,
      (botDmg) => {
        this.damagePlayer(botDmg);
      }
    );

    // 5. Update Building Ghost Preview
    const mat = this.playerStats.selectedBuildMat;
    const hasMats =
      (mat === 'WOOD' && this.playerStats.wood >= 10) ||
      (mat === 'STONE' && this.playerStats.stone >= 10) ||
      (mat === 'METAL' && this.playerStats.metal >= 10);
    this.playerStats.canPlaceBuild = hasMats;

    this.buildingSystem.updateGhost(
      this.playerPos,
      this.playerYaw,
      this.playerStats.selectedBuild,
      mat,
      hasMats,
      this.playerStats.isBuilding
    );

    // 6. Proximity Loot Detection
    this.checkLootProximity();

    // 7. Update Damage Numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y += dt * 1.5;
      dn.life -= dt * 1.6;
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }

    // 8. Send data to React HUD
    const aliveCount = this.botSystem.getAliveBotCount() + 1;
    this.onHudUpdate(this.playerStats, this.killFeed, aliveCount);
  }

  private checkLootProximity() {
    let nearestChestId: string | null = null;
    let nearestDist = 3.5;

    for (const chest of this.lootManager.chests) {
      if (chest.isOpened) continue;
      const dx = chest.x - this.playerPos.x;
      const dz = chest.z - this.playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestChestId = chest.id;
      }
    }
    this.playerStats.nearbyChestId = nearestChestId;

    // Check ground items
    let nearestItemId: string | null = null;
    let nearestItemName: string | null = null;
    let nearestRarity: any = null;
    let minItemDist = 3.2;

    for (const gi of this.lootManager.groundItems) {
      const dx = gi.x - this.playerPos.x;
      const dz = gi.z - this.playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Auto-pickup for ammo and materials!
      if (dist < 2.0 && (gi.materialType || gi.ammoType)) {
        if (gi.materialType) {
          if (gi.materialType === 'WOOD') this.playerStats.wood += gi.materialAmount || 30;
          else if (gi.materialType === 'STONE') this.playerStats.stone += gi.materialAmount || 20;
          else this.playerStats.metal += gi.materialAmount || 15;
          sound.playItemPickup();
        }
        if (gi.ammoType) {
          const amt = gi.ammoAmount || 20;
          if (gi.ammoType === 'MEDIUM') this.playerStats.ammo.medium += amt;
          else if (gi.ammoType === 'SHELLS') this.playerStats.ammo.shells += amt;
          else if (gi.ammoType === 'HEAVY') this.playerStats.ammo.heavy += amt;
          sound.playItemPickup();
        }
        this.lootManager.removeGroundItem(gi.id);
        continue;
      }

      if (dist < minItemDist) {
        minItemDist = dist;
        nearestItemId = gi.id;
        nearestItemName = gi.item.name;
        nearestRarity = gi.item.rarity;
      }
    }

    this.playerStats.nearbyGroundItemId = nearestItemId;
    this.playerStats.nearbyGroundItemName = nearestItemName;
    this.playerStats.nearbyGroundItemRarity = nearestRarity;
  }

  private damagePlayer(damage: number) {
    if (this.playerStats.health <= 0) return;

    sound.playPlayerHurt();

    // Shield takes damage first
    if (this.playerStats.shield > 0) {
      const shieldDmg = Math.min(this.playerStats.shield, damage);
      this.playerStats.shield -= shieldDmg;
      damage -= shieldDmg;
    }

    if (damage > 0) {
      this.playerStats.health = Math.max(0, this.playerStats.health - damage);
    }

    if (this.playerStats.health <= 0) {
      this.triggerDefeat();
    }
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('blur', this.onBlur);

    this.lootManager.cleanup();
    this.worldManager.cleanup();
    this.buildingSystem.cleanup();
    this.stormSystem.dispose();
    this.botSystem.cleanup();
    this.renderer.dispose();
  }
}
