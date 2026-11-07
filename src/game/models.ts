/**
 * Procedural 3D Composite Models for Craft Royale
 * Built strictly according to the Three.js skill: 3-12 part composite groups (THREE.Group)
 * with grounded bottom pivots, distinct roughness/metalness, and zero external asset dependencies.
 */
import * as THREE from 'three';
import { textureGen } from './textures';

// Helper: Make standard box mesh
function createBox(
  w: number, h: number, d: number,
  color: number | string,
  roughness: number = 0.5,
  metalness: number = 0.1,
  castShadow: boolean = true
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

// 1. Procedural Character Composite (Player and Bots)
export interface CharacterRig {
  root: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponSlot: THREE.Group;
  animate: (walkCycle: number, isAiming: boolean, isSwinging: boolean) => void;
}

export function createCharacter(colorHex: number = 0x3b82f6, isPlayer: boolean = false): CharacterRig {
  const root = new THREE.Group();

  // Torso group
  const torso = new THREE.Group();
  torso.position.y = 0.9;
  root.add(torso);

  // Main chest
  const chestMesh = createBox(0.65, 0.75, 0.35, colorHex, 0.4, 0.2);
  torso.add(chestMesh);

  // Tactical armor vest plate
  const vestMesh = createBox(0.68, 0.5, 0.38, 0x1e293b, 0.8, 0.1);
  vestMesh.position.y = 0.05;
  torso.add(vestMesh);

  // Tactical belt with pouches
  const beltMesh = createBox(0.67, 0.12, 0.37, 0x0f172a, 0.9, 0.1);
  beltMesh.position.y = -0.32;
  torso.add(beltMesh);

  // Head
  const head = createBox(0.42, 0.42, 0.42, 0xfcd34d, 0.6, 0.0);
  head.position.y = 1.5;
  root.add(head);

  // Tactical Visor / Bandana
  const visor = createBox(0.44, 0.14, 0.44, isPlayer ? 0x06b6d4 : 0xef4444, 0.2, 0.8);
  visor.position.set(0, 1.52, 0.02);
  root.add(visor);

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.48, 1.2, 0);
  const leftArmMesh = createBox(0.24, 0.7, 0.24, colorHex, 0.5, 0.1);
  leftArmMesh.position.y = -0.3;
  leftArm.add(leftArmMesh);
  root.add(leftArm);

  // Right Arm (Weapon holding arm)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.48, 1.2, 0);
  const rightArmMesh = createBox(0.24, 0.7, 0.24, colorHex, 0.5, 0.1);
  rightArmMesh.position.y = -0.3;
  rightArm.add(rightArmMesh);

  // Weapon attachment socket
  const weaponSlot = new THREE.Group();
  weaponSlot.position.set(0, -0.6, 0.2);
  rightArm.add(weaponSlot);
  root.add(rightArm);

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.2, 0.55, 0);
  const leftPants = createBox(0.26, 0.55, 0.28, 0x334155, 0.7, 0.1);
  leftLeg.add(leftPants);
  const leftBoot = createBox(0.28, 0.22, 0.34, 0x0f172a, 0.4, 0.2);
  leftBoot.position.set(0, -0.22, 0.03);
  leftLeg.add(leftBoot);
  root.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.2, 0.55, 0);
  const rightPants = createBox(0.26, 0.55, 0.28, 0x334155, 0.7, 0.1);
  rightLeg.add(rightPants);
  const rightBoot = createBox(0.28, 0.22, 0.34, 0x0f172a, 0.4, 0.2);
  rightBoot.position.set(0, -0.22, 0.03);
  rightLeg.add(rightBoot);
  root.add(rightLeg);

  // Bottom contact shadow
  const shadowGeo = new THREE.PlaneGeometry(1.0, 1.0);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  // Animation controller
  const animate = (walkCycle: number, isAiming: boolean, isSwinging: boolean) => {
    const swingAmp = 0.65;
    leftLeg.rotation.x = Math.sin(walkCycle) * swingAmp;
    rightLeg.rotation.x = -Math.sin(walkCycle) * swingAmp;

    if (isSwinging) {
      rightArm.rotation.x = -Math.PI / 2 + Math.sin(walkCycle * 6) * 0.8;
      rightArm.rotation.z = -0.3;
      leftArm.rotation.x = -0.2;
    } else if (isAiming) {
      rightArm.rotation.x = -Math.PI / 2;
      rightArm.rotation.y = -0.2;
      leftArm.rotation.x = -Math.PI / 2.2;
      leftArm.rotation.y = 0.4;
    } else {
      leftArm.rotation.x = -Math.sin(walkCycle) * swingAmp;
      rightArm.rotation.x = Math.sin(walkCycle) * 0.3 - 0.2;
      rightArm.rotation.y = 0;
      rightArm.rotation.z = 0;
    }
  };

  return {
    root,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponSlot,
    animate,
  };
}

// 2. Procedural Weapons
export function createPickaxeMesh(): THREE.Group {
  const group = new THREE.Group();
  // Shaft
  const shaft = createBox(0.06, 0.9, 0.06, 0x78350f, 0.8, 0.1);
  shaft.position.y = 0.35;
  group.add(shaft);

  // Pick head crossbar
  const head = createBox(0.48, 0.12, 0.1, 0x64748b, 0.3, 0.6);
  head.position.y = 0.75;
  group.add(head);

  // Left & right pick tips
  const tip1 = createBox(0.12, 0.08, 0.08, 0x38bdf8, 0.2, 0.8);
  tip1.position.set(-0.28, 0.72, 0);
  tip1.rotation.z = 0.3;
  group.add(tip1);

  const tip2 = createBox(0.12, 0.08, 0.08, 0x38bdf8, 0.2, 0.8);
  tip2.position.set(0.28, 0.72, 0);
  tip2.rotation.z = -0.3;
  group.add(tip2);

  group.rotation.x = Math.PI / 2;
  return group;
}

export function createGunMesh(type: string): THREE.Group {
  const group = new THREE.Group();

  if (type === 'PUMP_SHOTGUN') {
    // Shotgun: heavy stock + wide barrel + pump slide
    const stock = createBox(0.08, 0.14, 0.35, 0x78350f, 0.7, 0.1);
    group.add(stock);
    const receiver = createBox(0.1, 0.15, 0.3, 0x1e293b, 0.3, 0.7);
    receiver.position.z = 0.3;
    group.add(receiver);
    const barrel = createBox(0.07, 0.07, 0.55, 0x475569, 0.2, 0.8);
    barrel.position.set(0, 0.03, 0.7);
    group.add(barrel);
    const pump = createBox(0.1, 0.09, 0.2, 0x92400e, 0.6, 0.2);
    pump.position.set(0, -0.02, 0.6);
    group.add(pump);
  } else if (type === 'SNIPER_RIFLE') {
    // Sniper: long barrel + optical scope
    const body = createBox(0.08, 0.15, 0.5, 0x0f172a, 0.4, 0.5);
    group.add(body);
    const longBarrel = createBox(0.05, 0.05, 0.9, 0x334155, 0.2, 0.8);
    longBarrel.position.set(0, 0.04, 0.7);
    group.add(longBarrel);
    const scope = createBox(0.09, 0.09, 0.35, 0x0284c7, 0.2, 0.9);
    scope.position.set(0, 0.15, 0.15);
    group.add(scope);
  } else if (type === 'ROCKET_LAUNCHER') {
    // RPG: massive green tube
    const tube = createBox(0.2, 0.2, 1.2, 0x166534, 0.4, 0.3);
    group.add(tube);
    const warhead = createBox(0.26, 0.26, 0.3, 0xca8a04, 0.3, 0.6);
    warhead.position.z = 0.7;
    group.add(warhead);
  } else {
    // Assault Rifle
    const body = createBox(0.08, 0.16, 0.45, 0x1e293b, 0.3, 0.6);
    group.add(body);
    const barrel = createBox(0.05, 0.05, 0.45, 0x475569, 0.2, 0.8);
    barrel.position.set(0, 0.03, 0.45);
    group.add(barrel);
    const mag = createBox(0.06, 0.22, 0.12, 0x0f172a, 0.5, 0.3);
    mag.position.set(0, -0.15, 0.15);
    mag.rotation.x = 0.2;
    group.add(mag);
  }

  group.rotation.y = Math.PI;
  return group;
}

// 3. Environmental Props & Landmarks (Biomes)

// Forest Pine Tree
export function createPineTreeMesh(): THREE.Group {
  const group = new THREE.Group();

  // Trunk
  const trunk = createBox(0.7, 3.5, 0.7, 0x78350f, 0.9, 0.0);
  trunk.position.y = 1.75;
  group.add(trunk);

  // 3 foliage tiers
  const tier1 = createBox(3.4, 1.5, 3.4, 0x15803d, 0.7, 0.0);
  tier1.position.y = 3.5;
  group.add(tier1);

  const tier2 = createBox(2.6, 1.4, 2.6, 0x16a34a, 0.7, 0.0);
  tier2.position.y = 4.8;
  group.add(tier2);

  const tier3 = createBox(1.6, 1.2, 1.6, 0x22c55e, 0.7, 0.0);
  tier3.position.y = 6.0;
  group.add(tier3);

  const tip = createBox(0.8, 0.8, 0.8, 0x4ade80, 0.7, 0.0);
  tip.position.y = 6.9;
  group.add(tip);

  return group;
}

// Forest Oak Tree
export function createOakTreeMesh(): THREE.Group {
  const group = new THREE.Group();

  const trunk = createBox(0.9, 2.8, 0.9, 0x92400e, 0.9, 0.0);
  trunk.position.y = 1.4;
  group.add(trunk);

  // Large canopy cluster
  const centerCanopy = createBox(3.6, 2.6, 3.6, 0x15803d, 0.8, 0.0);
  centerCanopy.position.y = 3.5;
  group.add(centerCanopy);

  const sideCanopy1 = createBox(2.2, 1.8, 2.2, 0x16a34a, 0.8, 0.0);
  sideCanopy1.position.set(1.2, 3.8, 0.6);
  group.add(sideCanopy1);

  const sideCanopy2 = createBox(2.0, 1.8, 2.0, 0x15803d, 0.8, 0.0);
  sideCanopy2.position.set(-1.1, 3.6, -0.8);
  group.add(sideCanopy2);

  return group;
}

// Desert Cactus
export function createCactusMesh(): THREE.Group {
  const group = new THREE.Group();

  // Central column
  const main = createBox(0.65, 4.2, 0.65, 0x16a34a, 0.8, 0.0);
  main.position.y = 2.1;
  group.add(main);

  // Left arm
  const arm1H = createBox(0.9, 0.5, 0.5, 0x15803d, 0.8, 0.0);
  arm1H.position.set(-0.7, 2.4, 0);
  group.add(arm1H);
  const arm1V = createBox(0.5, 1.5, 0.5, 0x15803d, 0.8, 0.0);
  arm1V.position.set(-1.1, 3.1, 0);
  group.add(arm1V);

  // Right arm
  const arm2H = createBox(0.9, 0.5, 0.5, 0x16a34a, 0.8, 0.0);
  arm2H.position.set(0.7, 1.7, 0);
  group.add(arm2H);
  const arm2V = createBox(0.5, 1.6, 0.5, 0x16a34a, 0.8, 0.0);
  arm2V.position.set(1.1, 2.4, 0);
  group.add(arm2V);

  return group;
}

// Rock Formation
export function createRockMesh(): THREE.Group {
  const group = new THREE.Group();

  const main = createBox(2.6, 1.8, 2.4, 0x64748b, 0.8, 0.1);
  main.position.y = 0.9;
  main.rotation.y = 0.2;
  group.add(main);

  const side1 = createBox(1.6, 1.2, 1.8, 0x475569, 0.9, 0.1);
  side1.position.set(1.1, 0.6, 0.4);
  side1.rotation.y = -0.3;
  group.add(side1);

  const side2 = createBox(1.4, 1.4, 1.4, 0x94a3b8, 0.8, 0.1);
  side2.position.set(-0.9, 0.7, -0.6);
  side2.rotation.y = 0.4;
  group.add(side2);

  return group;
}

// Frost Ice Spire
export function createIceSpireMesh(): THREE.Group {
  const group = new THREE.Group();

  const base = createBox(2.2, 3.5, 2.2, 0x93c5fd, 0.2, 0.4);
  base.position.y = 1.75;
  base.rotation.y = 0.4;
  group.add(base);

  const tip = createBox(1.2, 2.4, 1.2, 0xdbeafe, 0.1, 0.5);
  tip.position.y = 4.2;
  tip.rotation.y = -0.2;
  group.add(tip);

  return group;
}

// POI 1: Forest Sniper Watchtower
export function createWatchtowerMesh(): THREE.Group {
  const group = new THREE.Group();

  // 4 corner posts
  const postH = 8.0;
  const corners = [
    [-2.2, -2.2],
    [2.2, -2.2],
    [-2.2, 2.2],
    [2.2, 2.2],
  ];

  corners.forEach(([cx, cz]) => {
    const post = createBox(0.4, postH, 0.4, 0x78350f, 0.9, 0.0);
    post.position.set(cx, postH / 2, cz);
    group.add(post);
  });

  // Elevated sniper platform floor
  const floor = createBox(5.2, 0.3, 5.2, 0x92400e, 0.8, 0.0);
  floor.position.y = postH;
  group.add(floor);

  // Parapet railings
  const railFront = createBox(5.2, 1.0, 0.2, 0x78350f, 0.8, 0.0);
  railFront.position.set(0, postH + 0.65, 2.5);
  group.add(railFront);

  const railBack = createBox(5.2, 1.0, 0.2, 0x78350f, 0.8, 0.0);
  railBack.position.set(0, postH + 0.65, -2.5);
  group.add(railBack);

  const railLeft = createBox(0.2, 1.0, 5.2, 0x78350f, 0.8, 0.0);
  railLeft.position.set(-2.5, postH + 0.65, 0);
  group.add(railLeft);

  const railRight = createBox(0.2, 1.0, 5.2, 0x78350f, 0.8, 0.0);
  railRight.position.set(2.5, postH + 0.65, 0);
  group.add(railRight);

  // Roof
  const roof = createBox(5.8, 0.5, 5.8, 0xb45309, 0.7, 0.0);
  roof.position.y = postH + 3.2;
  group.add(roof);

  return group;
}

// POI 2: Industrial Shipping Container (Dusty Depot)
export function createCargoContainerMesh(colorHex: number = 0xd97706): THREE.Group {
  const group = new THREE.Group();

  const container = createBox(3.4, 3.2, 8.0, colorHex, 0.4, 0.6);
  container.position.y = 1.6;
  group.add(container);

  // Steel corner locks
  const lock1 = createBox(0.3, 3.3, 0.3, 0x1e293b, 0.3, 0.8);
  lock1.position.set(1.6, 1.6, 3.9);
  group.add(lock1);

  const lock2 = createBox(0.3, 3.3, 0.3, 0x1e293b, 0.3, 0.8);
  lock2.position.set(-1.6, 1.6, 3.9);
  group.add(lock2);

  return group;
}

// Interactive Chest Composite
export function createChestMesh(): { root: THREE.Group; lid: THREE.Group } {
  const root = new THREE.Group();

  // Base box
  const baseMesh = createBox(1.1, 0.7, 0.8, 0xd97706, 0.3, 0.5);
  baseMesh.position.y = 0.35;
  root.add(baseMesh);

  // Lid with pivot hinge at back
  const lid = new THREE.Group();
  lid.position.set(0, 0.7, -0.4);

  const lidMesh = createBox(1.12, 0.3, 0.82, 0xfbbf24, 0.2, 0.6);
  lidMesh.position.set(0, 0.15, 0.4);
  lid.add(lidMesh);

  // Latch lock
  const lockMesh = createBox(0.18, 0.22, 0.1, 0x1c1917, 0.2, 0.8);
  lockMesh.position.set(0, 0.05, 0.82);
  lid.add(lockMesh);

  root.add(lid);

  // Golden aura light inside
  const light = new THREE.PointLight(0xfbbf24, 1.5, 4);
  light.position.set(0, 0.8, 0);
  root.add(light);

  return { root, lid };
}
