/**
 * Procedural Canvas Textures for Craft Royale
 * Zero external asset dependencies - generates all pixelated voxel textures via HTML5 Canvas.
 */
import * as THREE from 'three';

class TextureGenerator {
  private cache = new Map<string, THREE.CanvasTexture>();

  private createPixelCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return [canvas, ctx];
  }

  private wrapTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // --- BIOME VOXEL TEXTURES ---

  public getGrassTexture(): THREE.CanvasTexture {
    if (this.cache.has('grass')) return this.cache.get('grass')!;
    const [canvas, ctx] = this.createPixelCanvas(32, 32);
    
    // Checkered pixelated vibrant grass
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 0, 32, 32);
    
    const shades = ['#16a34a', '#15803d', '#4ade80', '#14532d'];
    for (let x = 0; x < 32; x += 2) {
      for (let y = 0; y < 32; y += 2) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    const tex = this.wrapTexture(canvas);
    this.cache.set('grass', tex);
    return tex;
  }

  public getDirtTexture(): THREE.CanvasTexture {
    if (this.cache.has('dirt')) return this.cache.get('dirt')!;
    const [canvas, ctx] = this.createPixelCanvas(32, 32);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 32, 32);

    const shades = ['#92400e', '#592207', '#a16207', '#451a03'];
    for (let x = 0; x < 32; x += 2) {
      for (let y = 0; y < 32; y += 2) {
        if (Math.random() > 0.35) {
          ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    const tex = this.wrapTexture(canvas);
    this.cache.set('dirt', tex);
    return tex;
  }

  public getSandTexture(): THREE.CanvasTexture {
    if (this.cache.has('sand')) return this.cache.get('sand')!;
    const [canvas, ctx] = this.createPixelCanvas(32, 32);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(0, 0, 32, 32);

    const shades = ['#eab308', '#facc15', '#ca8a04', '#fef08a'];
    for (let x = 0; x < 32; x += 2) {
      for (let y = 0; y < 32; y += 2) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    const tex = this.wrapTexture(canvas);
    this.cache.set('sand', tex);
    return tex;
  }

  public getSnowTexture(): THREE.CanvasTexture {
    if (this.cache.has('snow')) return this.cache.get('snow')!;
    const [canvas, ctx] = this.createPixelCanvas(32, 32);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 32, 32);

    const shades = ['#e2e8f0', '#cbd5e1', '#f1f5f9', '#93c5fd'];
    for (let x = 0; x < 32; x += 2) {
      for (let y = 0; y < 32; y += 2) {
        if (Math.random() > 0.45) {
          ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    const tex = this.wrapTexture(canvas);
    this.cache.set('snow', tex);
    return tex;
  }

  public getStoneTexture(): THREE.CanvasTexture {
    if (this.cache.has('stone')) return this.cache.get('stone')!;
    const [canvas, ctx] = this.createPixelCanvas(32, 32);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 32, 32);

    // Chiseled brick patterns
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 15, 32, 2);
    ctx.fillRect(15, 0, 2, 15);
    ctx.fillRect(31, 16, 2, 16);
    ctx.fillRect(7, 16, 2, 16);

    const shades = ['#475569', '#94a3b8', '#1e293b'];
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
      ctx.fillRect(
        Math.floor(Math.random() * 16) * 2,
        Math.floor(Math.random() * 16) * 2,
        2, 2
      );
    }
    const tex = this.wrapTexture(canvas);
    this.cache.set('stone', tex);
    return tex;
  }

  public getWoodPlanksTexture(): THREE.CanvasTexture {
    if (this.cache.has('wood')) return this.cache.get('wood')!;
    const [canvas, ctx] = this.createPixelCanvas(32, 32);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, 0, 32, 32);

    // Planks lines
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 7, 32, 1);
    ctx.fillRect(0, 15, 32, 1);
    ctx.fillRect(0, 23, 32, 1);
    ctx.fillRect(0, 31, 32, 1);

    // Wood grain accents
    ctx.fillStyle = '#b45309';
    for (let y = 0; y < 32; y += 4) {
      for (let x = 0; x < 32; x += 4) {
        if (Math.random() > 0.4) {
          ctx.fillRect(x, y, 3, 1);
        }
      }
    }
    const tex = this.wrapTexture(canvas);
    this.cache.set('wood', tex);
    return tex;
  }

  public getMetalTexture(): THREE.CanvasTexture {
    if (this.cache.has('metal')) return this.cache.get('metal')!;
    const [canvas, ctx] = this.createPixelCanvas(32, 32);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 32, 32);

    // Border riveted frame
    ctx.fillStyle = '#334155';
    ctx.strokeRect(1, 1, 30, 30);
    // Corner rivets
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(28, 2, 2, 2);
    ctx.fillRect(2, 28, 2, 2);
    ctx.fillRect(28, 28, 2, 2);

    // Cross brace
    ctx.fillStyle = '#1e293b';
    for (let i = 4; i < 28; i += 2) {
      ctx.fillRect(i, i, 2, 2);
      ctx.fillRect(30 - i, i, 2, 2);
    }
    const tex = this.wrapTexture(canvas);
    this.cache.set('metal', tex);
    return tex;
  }

  // --- CHEST & PROPS ---

  public getChestTexture(): THREE.CanvasTexture {
    if (this.cache.has('chest')) return this.cache.get('chest')!;
    const [canvas, ctx] = this.createPixelCanvas(32, 32);
    // Golden bronze chest with latch
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 0, 32, 32);
    // Gold trims
    ctx.fillStyle = '#fbbf24';
    ctx.strokeRect(2, 2, 28, 28);
    ctx.fillRect(13, 12, 6, 8); // center latch
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(15, 15, 2, 3); // keyhole
    const tex = this.wrapTexture(canvas);
    this.cache.set('chest', tex);
    return tex;
  }

  // --- STORM ENERGY BARRIER TEXTURE ---

  public getStormTexture(): THREE.CanvasTexture {
    if (this.cache.has('storm')) return this.cache.get('storm')!;
    const [canvas, ctx] = this.createPixelCanvas(64, 64);
    
    // Electric violet gradient with luminous lattice lines
    ctx.fillStyle = 'rgba(126, 34, 206, 0.45)';
    ctx.fillRect(0, 0, 64, 64);

    ctx.strokeStyle = 'rgba(232, 121, 249, 0.85)';
    ctx.lineWidth = 2;
    // Hexagonal / diamond lightning grid
    ctx.beginPath();
    for (let y = 0; y <= 64; y += 16) {
      ctx.moveTo(0, y);
      ctx.lineTo(64, y);
    }
    for (let x = 0; x <= 64; x += 16) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 64);
    }
    ctx.stroke();

    // Floating electric spark nodes
    ctx.fillStyle = '#fdf4ff';
    for (let i = 0; i < 16; i++) {
      ctx.fillRect(
        Math.floor(Math.random() * 32) * 2,
        Math.floor(Math.random() * 32) * 2,
        3, 3
      );
    }

    const tex = this.wrapTexture(canvas);
    tex.repeat.set(8, 2);
    this.cache.set('storm', tex);
    return tex;
  }
}

export const textureGen = new TextureGenerator();
