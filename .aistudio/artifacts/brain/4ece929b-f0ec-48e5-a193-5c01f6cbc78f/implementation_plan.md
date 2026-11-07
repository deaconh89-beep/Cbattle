# Craft Royale: 3D Voxel Battle Royale

A fast-paced 3D battle royale game blending Minecraft voxel aesthetics and destructible environments with Fortnite over-the-shoulder third-person shooting, instant grid building, resource harvesting, and a shrinking storm circle.

## User Review & Critical Decisions

> [!IMPORTANT]
> The game design incorporates all three confirmed gameplay preferences from the interactive clarification phase:

- **Confirmed Decision 1 (Camera & Controls)**: Third-person over-the-shoulder action perspective with responsive mouse-look crosshair targeting, strafing, jumping, and crouch/sprint.
- **Confirmed Decision 2 (Building & Destruction)**: Fortnite-style instant grid building (Walls, Ramps, Floors) combined with destructible voxel terrain, trees, and rocks that yield Wood, Stone, and Metal resources when mined with a pickaxe or blasted with weapons.
- **Confirmed Decision 3 (Match Format & Opponents)**: Fast-paced 10-player battle royale match featuring a shrinking electric storm barrier and 9 intelligent bot opponents that engage in combat, build defensive cover, and seek the safe zone until the last player standing claims the Victory Royale.

---

## 1. Overview & Core Concept

- **What It Does**: Puts the player onto a voxel island arena with 9 competing AI survivors. Players harvest trees, boulders, and structures for building resources; loot weapon chests for rifles, shotguns, and shield potions; place defensive walls and ramps mid-combat; outrun the shrinking storm circle; and battle until only one survivor remains.
- **Target Audience / Persona**: Gamers and fans of Minecraft and Fortnite seeking an instant-play, zero-install, 60fps browser battle royale with tactile voxel destruction and fast build-fights.
- **Key Value**: Delivers the signature thrill of 90-degree crank builds, shotgun peak duels, and storm rotations in a seamless Three.js engine with zero external asset dependencies and zero 404 risks.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Title Screen & Live Preview**:
   - The game launches into a live 3D showcase: the camera smoothly pans across the voxel landscape showing pine trees, stone cliffs, and a stylized voxel combatant in an idle breathing stance.
   - Bespoke blocky inline SVG title lockup: **CRAFT ROYALE: BATTLE TILL THE END**.
   - Primary Start CTA (`Press Space or Click to Drop`) and clear control summary (`WASD Move · Click Shoot/Mine · Q/E/F Build · Esc Pause`).
2. **Drop & Loot Phase**:
   - Player drops onto the procedurally arranged voxel island (rolling hills, tree groves, boulder clusters, and loot chests).
   - Equips default Harvesting Tool (Pickaxe). Cracking trees yields +Wood; mining rocks yields +Stone. Chests drop Assault Rifle, Pump Shotgun, and Shield Potions.
3. **Combat & Build Fights**:
   - Toggling build mode (or pressing hotkeys `Q` Wall, `E` Ramp, `F` Floor) renders a translucent green holographic grid blueprint in front of the player.
   - Left-clicking instantly erects the structure with a satisfying block-snap sound and particle burst.
   - Opponents dynamically shoot and build defensive barricades. All structures and environment obstacles have health bars and destructible fracture stages.
4. **Storm Convergence & Endgame**:
   - A shimmering purple cylinder storm wall contracts inwards in timed phases, forcing surviving players into closer proximity.
   - Elimination feed displays real-time frags (`Bot Raven eliminated Bot Jonesy with Pump Shotgun`).
   - Ending in a cinematic slow-motion Victory Royale or Spectate/Retry screen with kill counts, building count, and damage stats.

### Visual Identity & Theme

- **Aesthetic Direction**: Stylized blocky voxel craft aesthetic with modern PBR lighting, soft shadows, warm sunlight, cool atmospheric fog, and vibrant saturated accents.
- **Color Palette**:
  - Dominant Canvas: Sky gradient (`#38bdf8` to `#0284c7`), verdant voxel terrain (`#22c55e`, `#15803d`, `#84cc16`), stone gray (`#64748b`, `#475569`), wood brown (`#78350f`, `#92400e`).
  - Storm Eye: Electric violet/magenta energy field (`#a855f7`, `#7e22ce`) with luminous rim fresnel.
  - UI Accents: Classic battle royale shield blue (`#0284c7`), health green (`#10b981`), critical warning crimson (`#ef4444`), gold victory banner (`#f59e0b`).
- **Typography & Low-Occlusion HUD**:
  - Clean athletic display type (`Plus Jakarta Sans` / `Outfit`) for title and announcements.
  - Tabular monospace numbers (`tabular-nums`) for health (100), shield (100), ammo (30/120), materials (Wood: 240, Stone: 80), and player counter (`Alive: 10`).
  - Playfield occlusion strictly under 15%: thin crosshair in center, bottom-left HP/Shield bars, bottom-center weapon & build hotbar, top-right mini-radar and storm timer, top-left elimination ticker.

### Interactive Feedback & Sound (Procedural Web Audio)

- **Sound Synthesizer**: Custom zero-dependency Web Audio engine producing:
  - Pickaxe swing whoosh and solid thud on wood/stone impact.
  - Crisp rifle burst (`noise buffer + bandpass filter`) and punchy shotgun blast.
  - Building snap sound with debris chime.
  - Shield potion gulp and armor recharge hum.
  - Distant storm rumble and rhythmic heartbeat when health is low.
  - Hit marker audio tick (higher pitch for critical headshot).
- **Juice & Feel**:
  - Micro hitstop (30-50ms) on heavy pickaxe and shotgun impacts.
  - Directional damage indicator wedge on the screen pointing to attackers.
  - Camera recoil shake with exponential damping.
  - Floating damage numbers (white for body, yellow for headshot, blue for shield).
  - Voxel particle explosions when structures or trees collapse.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Procedural Voxel Assets vs External Models**
  - *Chosen Approach*: 100% procedural geometric construction using Three.js composite groups (`THREE.Group` with 4–8 distinct blocky primitives, bevels, and custom canvas textures) for characters, weapons, trees, rocks, and buildings.
  - *Why*: Eliminates all 404 network failures, external CORS issues, and asset loading lag; guarantees instant startup and silky 60fps performance across devices.
- **Decision 2: Hybrid Voxel Terrain + Grid Building System**
  - *Chosen Approach*: Continuous ground collision mesh combined with a discrete spatial voxel grid for placeable walls, ramps, and floors that snap to player facing directions.
  - *Why*: Allows true Fortnite-style 90s, high-ground ramps, and protective boxes while keeping raycasting and collision queries ultra-fast ($O(1)$ grid lookup).
- **Decision 3: Serverless Client-Authoritative AI Simulation**
  - *Chosen Approach*: Standalone client-side AI behavior tree for 9 bots with state machines (Looting -> Roaming -> Combat -> Building Cover -> Storm Escaping).
  - *Why*: Enables immediate zero-latency play without requiring remote multiplayer servers or matchmaking queues.
- **Decision 4: Software-WebGL Safe Rendering Loop**
  - *Chosen Approach*: Automatic detection of software WebGL engines, adaptive pixel ratio, pre-allocated math vectors (`_vec3`, `_quat`) to eliminate garbage collection pauses, and delta-time clamping (`Math.min(dt, 0.05)`).
  - *Why*: Ensures stable 60fps performance and prevents freeze states even during intense build battles.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                             REACT SHELL                                │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │     Title / Menu UI     │  │          In-Game HUD Overlay        │  │
│  │ (Title, Controls, Audio)│  │ (HP/Shield, Ammo, Mats, Storm, Feed)│  │
│  └────────────┬────────────┘  └──────────────────┬──────────────────┘  │
│               │                                  │                     │
│               ▼                                  ▼                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    GAME CONTROLLER / BRIDGE                      │  │
│  │          (Zero re-render refs, Input Buffers, HUD sync)          │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼──────────────────────────────────┐
│                      THREE.JS BATTLE ENGINE                            │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │  World / Terrain│  │  Building Grid   │  │    Audio Synthesizer  │  │
│  │ (Voxels, Trees, │  │ (Walls, Ramps,   │  │   (Procedural SFX,    │  │
│  │  Rocks, Chests) │  │  Floors, Health) │  │    Hits, Gunshots)    │  │
│  └────────┬────────┘  └─────────┬────────┘  └───────────┬───────────┘  │
│           │                     │                       │              │
│  ┌────────▼────────┐  ┌─────────▼────────┐  ┌───────────▼───────────┐  │
│  │ Player Controller│ │  AI Bot System   │  │     Storm Manager     │  │
│  │ (TPS Cam, Move, │  │ (9 Bots, States, │  │ (Shrinking Cylinder,  │  │
│  │  Shoot, Harvest)│  │  Combat, Build)  │  │  Safe Zone, Tick Dmg) │  │
│  └─────────────────┘  └──────────────────┘  └───────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Entities & State

- **Player State**: Position, velocity, yaw/pitch, health (0–100), shield (0–100), inventory (Pickaxe, AR, Shotgun, Minis), materials (Wood, Stone, Metal), active build mode piece.
- **Bot Entity**: Position, velocity, target destination, enemy target, current weapon, health, shield, state (`IDLE`, `LOOTING`, `CHASING`, `ATTACKING`, `BUILDING_DEFENSE`, `FLEEING_STORM`).
- **Building Grid**: `Map<string, PlacedStructure>` with key `x,y,z,type`, containing structure type (`WALL`, `RAMP`, `FLOOR`), current HP (e.g. 150/150), material type (`WOOD`, `STONE`), and 3D mesh.
- **Destructible Props**: Trees, rocks, and chests with hit-points, shake feedback, and resource drop logic.
- **Storm Zone**: Current radius, target radius, center point, shrink velocity, phase countdown, and DPS tick rates.
