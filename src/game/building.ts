/**
 * Fortnite-style Instant Grid Building System for Craft Royale
 * Supports Walls, Ramps, and Floors with Wood, Stone, and Metal materials,
 * placement ghost preview, material costs, collision boxes, and destruction.
 */
import * as THREE from 'three';
import { StructureType, MaterialType } from '../types/game';
import { textureGen } from './textures';
import { sound } from './sound';

export interface PlacedStructure {
  id: string;
  type: StructureType;
  material: MaterialType;
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  hp: number;
  maxHp: number;
  boundingBox: THREE.Box3;
}

const GRID_SIZE = 4.0;
const GRID_HEIGHT = 3.5;

export class BuildingSystem {
  private scene: THREE.Scene;
  public structures: Map<string, PlacedStructure> = new Map();
  public ghostMesh: THREE.Group;
  private ghostMaterialValid: THREE.MeshBasicMaterial;
  private ghostMaterialInvalid: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.ghostMaterialValid = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.ghostMaterialInvalid = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.ghostMesh = new THREE.Group();
    this.scene.add(this.ghostMesh);
    this.ghostMesh.visible = false;
  }

  // Calculate grid position and orientation in front of player
  public getPlacementTransform(
    playerPos: THREE.Vector3,
    playerYaw: number,
    type: StructureType
  ): { x: number; y: number; z: number; rotationY: number } {
    // Project 3 meters forward
    const forwardDist = type === 'FLOOR' ? 1.5 : 3.0;
    const targetX = playerPos.x - Math.sin(playerYaw) * forwardDist;
    const targetZ = playerPos.z - Math.cos(playerYaw) * forwardDist;
    const targetY = playerPos.y;

    // Snap to nearest grid coordinate
    const snapX = Math.round(targetX / GRID_SIZE) * GRID_SIZE;
    const snapZ = Math.round(targetZ / GRID_SIZE) * GRID_SIZE;
    const snapY = Math.round(targetY / GRID_HEIGHT) * GRID_HEIGHT;

    // Cardinal snap rotation: 0, PI/2, PI, 3PI/2
    let snappedYaw = Math.round(playerYaw / (Math.PI / 2)) * (Math.PI / 2);

    return {
      x: snapX,
      y: Math.max(0, snapY),
      z: snapZ,
      rotationY: snappedYaw,
    };
  }

  public updateGhost(
    playerPos: THREE.Vector3,
    playerYaw: number,
    type: StructureType,
    material: MaterialType,
    hasEnoughMaterials: boolean,
    isBuildingActive: boolean
  ) {
    if (!isBuildingActive) {
      this.ghostMesh.visible = false;
      return;
    }

    this.ghostMesh.visible = true;
    const transform = this.getPlacementTransform(playerPos, playerYaw, type);

    this.ghostMesh.position.set(transform.x, transform.y, transform.z);
    this.ghostMesh.rotation.y = transform.rotationY;

    // Rebuild ghost geometry if type changed
    while (this.ghostMesh.children.length > 0) {
      const child = this.ghostMesh.children[0] as THREE.Mesh;
      this.ghostMesh.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    const mat = hasEnoughMaterials ? this.ghostMaterialValid : this.ghostMaterialInvalid;

    if (type === 'WALL') {
      const geo = new THREE.BoxGeometry(GRID_SIZE, GRID_HEIGHT, 0.2);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = GRID_HEIGHT / 2;
      this.ghostMesh.add(mesh);
    } else if (type === 'RAMP') {
      const rampLength = Math.sqrt(GRID_SIZE * GRID_SIZE + GRID_HEIGHT * GRID_HEIGHT);
      const geo = new THREE.BoxGeometry(GRID_SIZE, 0.2, rampLength);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.atan2(GRID_HEIGHT, GRID_SIZE);
      mesh.position.y = GRID_HEIGHT / 2;
      this.ghostMesh.add(mesh);
    } else {
      // FLOOR
      const geo = new THREE.BoxGeometry(GRID_SIZE, 0.2, GRID_SIZE);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.1;
      this.ghostMesh.add(mesh);
    }
  }

  public placeStructure(
    playerPos: THREE.Vector3,
    playerYaw: number,
    type: StructureType,
    material: MaterialType
  ): PlacedStructure | null {
    const transform = this.getPlacementTransform(playerPos, playerYaw, type);
    const key = `${transform.x},${transform.y},${transform.z},${type}`;

    if (this.structures.has(key)) {
      return null; // Already occupied
    }

    const maxHp = material === 'WOOD' ? 150 : material === 'STONE' ? 300 : 500;
    const texture =
      material === 'WOOD'
        ? textureGen.getWoodPlanksTexture()
        : material === 'STONE'
        ? textureGen.getStoneTexture()
        : textureGen.getMetalTexture();

    const group = new THREE.Group();
    group.position.set(transform.x, transform.y, transform.z);
    group.rotation.y = transform.rotationY;

    const boxMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: material === 'METAL' ? 0.6 : 0.1,
    });

    let mainMesh: THREE.Mesh;
    if (type === 'WALL') {
      const geo = new THREE.BoxGeometry(GRID_SIZE, GRID_HEIGHT, 0.25);
      mainMesh = new THREE.Mesh(geo, boxMat);
      mainMesh.position.y = GRID_HEIGHT / 2;
      mainMesh.castShadow = true;
      mainMesh.receiveShadow = true;
      group.add(mainMesh);
    } else if (type === 'RAMP') {
      const rampLength = Math.sqrt(GRID_SIZE * GRID_SIZE + GRID_HEIGHT * GRID_HEIGHT);
      const geo = new THREE.BoxGeometry(GRID_SIZE, 0.25, rampLength);
      mainMesh = new THREE.Mesh(geo, boxMat);
      mainMesh.rotation.x = Math.atan2(GRID_HEIGHT, GRID_SIZE);
      mainMesh.position.y = GRID_HEIGHT / 2;
      mainMesh.castShadow = true;
      mainMesh.receiveShadow = true;
      group.add(mainMesh);
    } else {
      // FLOOR
      const geo = new THREE.BoxGeometry(GRID_SIZE, 0.25, GRID_SIZE);
      mainMesh = new THREE.Mesh(geo, boxMat);
      mainMesh.position.y = 0.12;
      mainMesh.castShadow = true;
      mainMesh.receiveShadow = true;
      group.add(mainMesh);
    }

    this.scene.add(group);
    sound.playBuildPlace();

    // Spawn place pop animation
    group.scale.set(0.9, 0.9, 0.9);
    setTimeout(() => {
      group.scale.set(1, 1, 1);
    }, 60);

    const boundingBox = new THREE.Box3().setFromObject(group);

    const structure: PlacedStructure = {
      id: key,
      type,
      material,
      mesh: group,
      x: transform.x,
      y: transform.y,
      z: transform.z,
      rotationY: transform.rotationY,
      hp: maxHp,
      maxHp,
      boundingBox,
    };

    this.structures.set(key, structure);
    return structure;
  }

  public damageStructure(id: string, damage: number): boolean {
    const struct = this.structures.get(id);
    if (!struct) return false;

    struct.hp -= damage;
    sound.playPickaxeHit(struct.material);

    // Hit reaction jiggle
    struct.mesh.scale.set(0.95, 1.05, 0.95);
    setTimeout(() => {
      struct.mesh.scale.set(1, 1, 1);
    }, 60);

    if (struct.hp <= 0) {
      sound.playBuildBreak();
      this.scene.remove(struct.mesh);
      this.structures.delete(id);
      return true; // Destroyed
    }

    return false;
  }

  public checkPlayerCollision(pos: THREE.Vector3, radius: number = 0.6): THREE.Vector3 {
    // Collision resolution against walls and ramps
    const adjustedPos = pos.clone();
    for (const [_, struct] of this.structures) {
      if (struct.type === 'WALL') {
        const dx = Math.abs(pos.x - struct.x);
        const dz = Math.abs(pos.z - struct.z);
        if (dx < GRID_SIZE / 2 + radius && dz < 0.25 / 2 + radius && pos.y >= struct.y && pos.y <= struct.y + GRID_HEIGHT) {
          // Push out along wall normal
          const normalZ = Math.cos(struct.rotationY);
          const normalX = Math.sin(struct.rotationY);
          adjustedPos.x += normalX * 0.1;
          adjustedPos.z += normalZ * 0.1;
        }
      }
    }
    return adjustedPos;
  }

  public cleanup() {
    for (const [_, struct] of this.structures) {
      this.scene.remove(struct.mesh);
    }
    this.structures.clear();
    this.ghostMesh.visible = false;
  }
}
