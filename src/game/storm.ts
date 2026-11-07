/**
 * Dynamic Battle Royale Storm System for Craft Royale
 * Creates a shrinking electric storm barrier, safe zone visualizer, and damage-over-time loop.
 */
import * as THREE from 'three';
import { StormState } from '../types/game';
import { sound } from './sound';
import { textureGen } from './textures';

export class StormSystem {
  public state: StormState;
  private stormMesh: THREE.Mesh;
  private safeZoneGuideMesh: THREE.Mesh;
  private scene: THREE.Scene;
  private stormTex: THREE.CanvasTexture;
  private dpsAccumulator: number = 0;
  private warningPlayed: boolean = false;

  // Pre-configured phase stages (duration in seconds, target radius, DPS)
  private phases = [
    { duration: 45, radius: 110, dps: 1 },
    { duration: 40, radius: 70,  dps: 2 },
    { duration: 35, radius: 40,  dps: 4 },
    { duration: 25, radius: 18,  dps: 8 },
    { duration: 20, radius: 2,   dps: 15 },
  ];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    const initialRadius = 145;
    this.state = {
      centerX: 0,
      centerZ: 0,
      currentRadius: initialRadius,
      targetRadius: this.phases[0].radius,
      targetCenterX: (Math.random() - 0.5) * 30,
      targetCenterZ: (Math.random() - 0.5) * 30,
      isShrinking: false,
      timeRemaining: this.phases[0].duration,
      phase: 1,
      maxPhases: this.phases.length,
      dps: this.phases[0].dps,
      isPlayerInStorm: false,
    };

    this.stormTex = textureGen.getStormTexture();

    // Giant outer storm cylinder
    const stormGeo = new THREE.CylinderGeometry(
      initialRadius,
      initialRadius,
      70,
      48,
      1,
      true
    );
    const stormMat = new THREE.MeshBasicMaterial({
      map: this.stormTex,
      color: 0xc084fc,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.stormMesh = new THREE.Mesh(stormGeo, stormMat);
    this.stormMesh.position.set(0, 30, 0);
    this.scene.add(this.stormMesh);

    // Target Safe Zone Guide Ring (cyan/white dashed guide on terrain)
    const guideGeo = new THREE.RingGeometry(
      this.state.targetRadius - 0.5,
      this.state.targetRadius + 0.5,
      64
    );
    const guideMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.safeZoneGuideMesh = new THREE.Mesh(guideGeo, guideMat);
    this.safeZoneGuideMesh.rotation.x = -Math.PI / 2;
    this.safeZoneGuideMesh.position.set(
      this.state.targetCenterX,
      0.5,
      this.state.targetCenterZ
    );
    this.scene.add(this.safeZoneGuideMesh);
  }

  public update(dt: number, playerPos: THREE.Vector3, onDamagePlayer: (dps: number) => void) {
    // Texture animation
    this.stormTex.offset.x += dt * 0.08;
    this.stormTex.offset.y += dt * 0.02;

    this.state.timeRemaining -= dt;

    if (this.state.timeRemaining <= 0) {
      if (this.state.phase < this.state.maxPhases) {
        this.advancePhase();
      } else {
        this.state.timeRemaining = 0;
      }
    } else if (this.state.timeRemaining <= 10 && !this.warningPlayed) {
      sound.playStormWarning();
      this.warningPlayed = true;
    }

    // Shrink radius and move center smoothly
    const currentPhaseData = this.phases[this.state.phase - 1];
    const totalPhaseDuration = currentPhaseData ? currentPhaseData.duration : 40;
    const progress = Math.max(0, 1 - (this.state.timeRemaining / totalPhaseDuration));

    // Lerp radius
    this.state.currentRadius = THREE.MathUtils.damp(
      this.state.currentRadius,
      this.state.targetRadius,
      0.8,
      dt
    );

    // Lerp center
    this.state.centerX = THREE.MathUtils.damp(
      this.state.centerX,
      this.state.targetCenterX,
      0.6,
      dt
    );
    this.state.centerZ = THREE.MathUtils.damp(
      this.state.centerZ,
      this.state.targetCenterZ,
      0.6,
      dt
    );

    // Update 3D storm mesh scale and position
    const scaleFactor = Math.max(0.01, this.state.currentRadius / 145);
    this.stormMesh.scale.set(scaleFactor, 1, scaleFactor);
    this.stormMesh.position.set(this.state.centerX, 30, this.state.centerZ);

    // Update safe zone guide ring
    this.safeZoneGuideMesh.position.set(
      this.state.targetCenterX,
      0.5,
      this.state.targetCenterZ
    );
    const guideScale = Math.max(0.01, this.state.targetRadius / (this.phases[0].radius));
    this.safeZoneGuideMesh.scale.set(guideScale, guideScale, 1);

    // Check if player is outside the current storm radius
    const dx = playerPos.x - this.state.centerX;
    const dz = playerPos.z - this.state.centerZ;
    const distSq = dx * dx + dz * dz;
    const radSq = this.state.currentRadius * this.state.currentRadius;

    this.state.isPlayerInStorm = distSq > radSq;

    if (this.state.isPlayerInStorm) {
      this.dpsAccumulator += dt;
      if (this.dpsAccumulator >= 1.0) {
        this.dpsAccumulator = 0;
        onDamagePlayer(this.state.dps);
      }
    } else {
      this.dpsAccumulator = 0;
    }
  }

  private advancePhase() {
    this.state.phase++;
    this.warningPlayed = false;
    const nextIdx = this.state.phase - 1;
    const phaseConfig = this.phases[nextIdx];

    if (phaseConfig) {
      this.state.targetRadius = phaseConfig.radius;
      this.state.timeRemaining = phaseConfig.duration;
      this.state.dps = phaseConfig.dps;

      // Random new target center within current target radius
      const maxOffset = this.state.currentRadius * 0.35;
      this.state.targetCenterX = this.state.centerX + (Math.random() - 0.5) * maxOffset;
      this.state.targetCenterZ = this.state.centerZ + (Math.random() - 0.5) * maxOffset;
    }
  }

  public isOutsideStorm(x: number, z: number): boolean {
    const dx = x - this.state.centerX;
    const dz = z - this.state.centerZ;
    return (dx * dx + dz * dz) > (this.state.currentRadius * this.state.currentRadius);
  }

  public dispose() {
    this.scene.remove(this.stormMesh);
    this.scene.remove(this.safeZoneGuideMesh);
    if (this.stormMesh.geometry) this.stormMesh.geometry.dispose();
    if (this.safeZoneGuideMesh.geometry) this.safeZoneGuideMesh.geometry.dispose();
  }
}
