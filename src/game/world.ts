/**
 * World and Biome Generator for Craft Royale
 * Creates diverse biomes (Pleasant Pines, Cactus Canyon, Frost Peak, Dusty Depot, Loot Sanctuary),
 * elevation mapping, destructible props (trees, rocks, containers), and chest spawns.
 */
import * as THREE from 'three';
import { ChestObject, MaterialType } from '../types/game';
import {
  createPineTreeMesh,
  createOakTreeMesh,
  createCactusMesh,
  createRockMesh,
  createIceSpireMesh,
  createWatchtowerMesh,
  createCargoContainerMesh,
  createChestMesh,
} from './models';
import { textureGen } from './textures';
import { sound } from './sound';
import { LootManager } from './loot';

export interface DestructibleProp {
  id: string;
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  materialType: MaterialType;
  radius: number;
  isDead: boolean;
}

export class WorldManager {
  public scene: THREE.Scene;
  public destructibles: DestructibleProp[] = [];
  public terrainMesh: THREE.Mesh | null = null;
  public waterMesh: THREE.Mesh | null = null;
  public lootManager: LootManager;

  constructor(scene: THREE.Scene, lootManager: LootManager) {
    this.scene = scene;
    this.lootManager = lootManager;
  }

  // Continuous procedural elevation function
  public getHeightAt(x: number, z: number): number {
    const distFromCenter = Math.sqrt(x * x + z * z);
    // Island drop-off into ocean
    if (distFromCenter > 115) {
      return -2.0;
    }

    // Central Loot Sanctuary Lake depression
    if (distFromCenter < 22) {
      if (distFromCenter < 10) {
        // Center island
        return 1.2;
      }
      return 0.2; // shallow water
    }

    // Biome height modulations
    let h = 1.0;

    // North-East (Frost Peak): High mountain elevation
    if (x > 10 && z < -10) {
      const mountainFactor = (x - 10) * 0.15 + (-z - 10) * 0.18;
      h += Math.sin(x * 0.08) * 2.5 + Math.cos(z * 0.08) * 2.5 + mountainFactor * 0.8;
    }
    // South-West (Cactus Canyon): Terraced stepped mesas
    else if (x < -10 && z > 10) {
      const raw = Math.sin(x * 0.1) * 3 + Math.cos(z * 0.1) * 3;
      // Step terrace
      h += Math.floor(raw * 0.7) * 2.2 + 2.0;
    }
    // North-West (Pleasant Pines): Gentle rolling green hills
    else if (x < -5 && z < -5) {
      h += Math.sin(x * 0.06) * 1.8 + Math.cos(z * 0.06) * 1.8 + 1.2;
    }
    // South-East (Dusty Depot): Flat industrial concrete yard
    else {
      h += Math.sin(x * 0.04) * 0.8 + 0.5;
    }

    // Island edge taper
    if (distFromCenter > 85) {
      const edgeFactor = (115 - distFromCenter) / 30;
      h *= Math.max(0, edgeFactor);
    }

    return Math.max(0.4, h);
  }

  public generateWorld() {
    this.createTerrain();
    this.createWater();
    this.populateBiomesAndPOIs();
  }

  private createTerrain() {
    const size = 240;
    const segments = 90;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors: number[] = [];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getHeightAt(x, z);
      pos.setY(i, y);

      // Biome vertex coloring
      if (y <= 0.6) {
        // Sand beach
        colors.push(0.96, 0.85, 0.45);
      } else if (x > 10 && z < -10) {
        // Frost Peak: Snow white
        colors.push(0.94, 0.96, 0.98);
      } else if (x < -10 && z > 10) {
        // Cactus Canyon: Terracotta sandstone
        colors.push(0.85, 0.55, 0.28);
      } else if (x > 8 && z > 8) {
        // Dusty Depot: Industrial gravel
        colors.push(0.45, 0.52, 0.6);
      } else {
        // Pleasant Pines: Verdant grass
        colors.push(0.22, 0.75, 0.28);
      }
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  private createWater() {
    const waterGeo = new THREE.PlaneGeometry(360, 360);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = 0.5;
    this.scene.add(this.waterMesh);
  }

  private populateBiomesAndPOIs() {
    // 1. POI: Pleasant Pines Watchtowers
    this.spawnWatchtower(-45, -45);
    this.spawnWatchtower(-25, -65);

    // 2. POI: Dusty Depot Cargo Containers
    const containerColors = [0xd97706, 0x0284c7, 0xef4444, 0x16a34a];
    const containerLayouts = [
      { x: 42, z: 42, rot: 0, c: containerColors[0] },
      { x: 42, z: 52, rot: 0.3, c: containerColors[1] },
      { x: 54, z: 46, rot: 1.57, c: containerColors[2] },
      { x: 62, z: 38, rot: 0, c: containerColors[3] },
      { x: 34, z: 60, rot: 1.57, c: containerColors[0] },
    ];
    containerLayouts.forEach((l) => {
      this.spawnContainer(l.x, l.z, l.rot, l.c);
    });

    // 3. Destructible Trees across Pleasant Pines & Island
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 25 + Math.random() * 65;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Check if in Desert or Snow or Industrial
      if (x > 10 && z < -10) {
        // Frost peak: Ice spire or frosty pine
        if (Math.random() > 0.4) {
          this.spawnIceSpire(x, z);
        } else {
          this.spawnPineTree(x, z);
        }
      } else if (x < -10 && z > 10) {
        // Desert: Cacti and desert rocks
        this.spawnCactus(x, z);
      } else if (x > 10 && z > 10) {
        // Depot: Scrap rocks and few trees
        if (Math.random() > 0.6) this.spawnRock(x, z);
      } else {
        // Forest
        if (Math.random() > 0.35) {
          this.spawnPineTree(x, z);
        } else {
          this.spawnOakTree(x, z);
        }
      }
    }

    // 4. Boulders and Rock Outcrops
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 70;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      this.spawnRock(x, z);
    }

    // 5. Interactive Loot Chests across Landmarks
    const chestLocations = [
      // Central Sanctuary
      { x: 0, z: 0 },
      { x: 4, z: -4 },
      // Pleasant Pines Watchtowers (High ground loot)
      { x: -45, z: -45, elevated: 8.2 },
      { x: -25, z: -65, elevated: 8.2 },
      { x: -35, z: -35 },
      // Dusty Depot Containers (Inside and on top)
      { x: 42, z: 42, elevated: 3.2 },
      { x: 54, z: 46 },
      { x: 62, z: 38 },
      // Cactus Canyon Mesas
      { x: -50, z: 40 },
      { x: -35, z: 55 },
      { x: -60, z: 25 },
      // Frost Peak Summit
      { x: 45, z: -45 },
      { x: 55, z: -30 },
      { x: 30, z: -60 },
    ];

    chestLocations.forEach((loc, idx) => {
      this.spawnChest(
        `chest_${idx + 1}`,
        loc.x,
        loc.z,
        loc.elevated || 0
      );
    });
  }

  // --- SPAWN HELPERS ---

  private spawnPineTree(x: number, z: number) {
    const y = this.getHeightAt(x, z);
    const mesh = createPineTreeMesh();
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);

    this.destructibles.push({
      id: `tree_${Math.random()}`,
      mesh,
      x,
      y,
      z,
      hp: 120,
      maxHp: 120,
      materialType: 'WOOD',
      radius: 1.8,
      isDead: false,
    });
  }

  private spawnOakTree(x: number, z: number) {
    const y = this.getHeightAt(x, z);
    const mesh = createOakTreeMesh();
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);

    this.destructibles.push({
      id: `tree_${Math.random()}`,
      mesh,
      x,
      y,
      z,
      hp: 140,
      maxHp: 140,
      materialType: 'WOOD',
      radius: 2.0,
      isDead: false,
    });
  }

  private spawnCactus(x: number, z: number) {
    const y = this.getHeightAt(x, z);
    const mesh = createCactusMesh();
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);

    this.destructibles.push({
      id: `cactus_${Math.random()}`,
      mesh,
      x,
      y,
      z,
      hp: 80,
      maxHp: 80,
      materialType: 'WOOD',
      radius: 1.4,
      isDead: false,
    });
  }

  private spawnRock(x: number, z: number) {
    const y = this.getHeightAt(x, z);
    const mesh = createRockMesh();
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);

    this.destructibles.push({
      id: `rock_${Math.random()}`,
      mesh,
      x,
      y,
      z,
      hp: 180,
      maxHp: 180,
      materialType: 'STONE',
      radius: 2.2,
      isDead: false,
    });
  }

  private spawnIceSpire(x: number, z: number) {
    const y = this.getHeightAt(x, z);
    const mesh = createIceSpireMesh();
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);

    this.destructibles.push({
      id: `ice_${Math.random()}`,
      mesh,
      x,
      y,
      z,
      hp: 150,
      maxHp: 150,
      materialType: 'STONE',
      radius: 1.8,
      isDead: false,
    });
  }

  private spawnWatchtower(x: number, z: number) {
    const y = this.getHeightAt(x, z);
    const mesh = createWatchtowerMesh();
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.destructibles.push({
      id: `watchtower_${Math.random()}`,
      mesh,
      x,
      y,
      z,
      hp: 450,
      maxHp: 450,
      materialType: 'WOOD',
      radius: 3.5,
      isDead: false,
    });
  }

  private spawnContainer(x: number, z: number, rotation: number, colorHex: number) {
    const y = this.getHeightAt(x, z);
    const mesh = createCargoContainerMesh(colorHex);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotation;
    this.scene.add(mesh);

    this.destructibles.push({
      id: `container_${Math.random()}`,
      mesh,
      x,
      y,
      z,
      hp: 550,
      maxHp: 550,
      materialType: 'METAL',
      radius: 4.0,
      isDead: false,
    });
  }

  private spawnChest(id: string, x: number, z: number, elevatedY: number = 0) {
    const groundY = this.getHeightAt(x, z);
    const y = groundY + elevatedY;
    const { root, lid } = createChestMesh();
    root.position.set(x, y, z);
    this.scene.add(root);

    const chestObj: ChestObject = {
      id,
      x,
      y,
      z,
      rotation: 0,
      isOpened: false,
      mesh: root,
      lidMesh: lid,
    };
    this.lootManager.registerChest(chestObj);
  }

  // --- DAMAGE & HARVESTING ---

  public damageProp(
    propId: string,
    damage: number,
    onHarvest: (material: MaterialType, amount: number) => void
  ): boolean {
    const prop = this.destructibles.find((p) => p.id === propId);
    if (!prop || prop.isDead) return false;

    prop.hp -= damage;
    sound.playPickaxeHit(prop.materialType);

    // Subtle jiggle animation
    prop.mesh.scale.set(0.92, 1.08, 0.92);
    setTimeout(() => {
      if (prop.mesh) prop.mesh.scale.set(1, 1, 1);
    }, 80);

    // Yield materials proportional to hit
    const matYield = Math.max(5, Math.floor(damage * 0.4));
    onHarvest(prop.materialType, matYield);

    if (prop.hp <= 0) {
      prop.isDead = true;
      sound.playBuildBreak();
      this.scene.remove(prop.mesh);
      return true; // Destroyed!
    }

    return false;
  }

  public cleanup() {
    if (this.terrainMesh) this.scene.remove(this.terrainMesh);
    if (this.waterMesh) this.scene.remove(this.waterMesh);
    this.destructibles.forEach((p) => this.scene.remove(p.mesh));
    this.destructibles = [];
  }
}
