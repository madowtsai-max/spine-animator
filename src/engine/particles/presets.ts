import * as PIXI from 'pixi.js'

export interface ParticleParams {
  // Core — reset when switching presets
  count: number     // max particles
  speed: number     // movement speed multiplier
  lifetime: number  // seconds per particle
  size: number      // start scale
  spread: number    // directional spread 0–1
  // Visual — persist across preset changes
  sizeEnd?: number        // end scale (default 0.2)
  alphaStart?: number     // start opacity 0–1 (default 1)
  alphaEnd?: number       // end opacity 0–1 (default 0)
  gravity?: number        // -1 (up) to 1 (down) (default 0)
  spinSpeed?: number      // deg/s, negative = CCW (default 0)
  tintStart?: string      // hex without #, e.g. 'ffffff' (default white)
  tintEnd?: string        // hex without #
  blendMode?: 'normal' | 'add' | 'screen' | 'multiply'
  emitX?: number          // X offset from canvas center in px (default 0)
  emitY?: number          // Y offset from canvas center in px (default 0)
  emitRadius?: number     // spawn circle radius in px (default 8)
  // Lines
  linesEnabled?: boolean  // draw connections between nearby particles
  lineDistance?: number   // max distance to draw a line (default 100)
  lineColor?: string      // hex without # (default 'ffffff')
  lineOpacity?: number    // max line opacity (default 0.4)
  lineWidth?: number      // line width px (default 1)
  // Mouse
  mouseMode?: 'none' | 'repulse' | 'attract'
  mouseRadius?: number    // effect radius in px (default 120)
  mouseStrength?: number  // force strength (default 60)
  mouseClick?: boolean    // burst particles on click
}

export interface ParticlePresetDef {
  id: string
  name: string
  description: string
  icon: string
  looping: boolean
  defaultParams: ParticleParams
}

export const PARTICLE_PRESETS: ParticlePresetDef[] = [
  { id: 'burst',    name: 'Burst',    description: 'Explode outward — coin collect, reward',    icon: '💥', looping: false, defaultParams: { count: 40, speed: 1,   lifetime: 0.8, size: 1,   spread: 1   } },
  { id: 'sparkler', name: 'Sparkler', description: 'Continuous sparks — sparkler, fire, magic',  icon: '✴️', looping: true,  defaultParams: { count: 60, speed: 1.5, lifetime: 0.6, size: 0.5, spread: 1   } },
  { id: 'floatup',  name: 'Float Up', description: 'Rise and fade — score text, bubbles, smoke', icon: '🫧', looping: true,  defaultParams: { count: 25, speed: 0.7, lifetime: 2.0, size: 0.8, spread: 0.3 } },
  { id: 'rain',     name: 'Rain',     description: 'Fall from top — confetti, snow, leaves',     icon: '🌧', looping: true,  defaultParams: { count: 50, speed: 1,   lifetime: 1.5, size: 0.7, spread: 0.2 } },
  { id: 'fountain', name: 'Fountain', description: 'Arc up and fall — sparkles, fireworks',      icon: '⛲', looping: true,  defaultParams: { count: 35, speed: 1.2, lifetime: 1.2, size: 1,   spread: 0.6 } },
  { id: 'orbit',    name: 'Orbit',    description: 'Circle around center — glow, charge',        icon: '🌀', looping: true,  defaultParams: { count: 20, speed: 0.6, lifetime: 3.0, size: 0.8, spread: 0.1 } },
]

type EmitterBehavior = { type: string; config: unknown }

function alphaBehavior(startAlpha = 1, endAlpha = 0): EmitterBehavior {
  return {
    type: 'alpha',
    config: { alpha: { list: [{ value: startAlpha, time: 0 }, { value: endAlpha, time: 1 }] } },
  }
}

function scaleBehavior(startScale: number, endScale: number, minMult = 0.5): EmitterBehavior {
  return {
    type: 'scale',
    config: { scale: { list: [{ value: startScale, time: 0 }, { value: endScale, time: 1 }] }, minMult },
  }
}

function speedBehavior(startSpeed: number, endSpeed: number, minMult = 0.5): EmitterBehavior {
  return {
    type: 'moveSpeed',
    config: { speed: { list: [{ value: startSpeed, time: 0 }, { value: endSpeed, time: 1 }] }, minMult },
  }
}

function textureBehavior(texture: PIXI.Texture): EmitterBehavior {
  return { type: 'textureSingle', config: { texture } }
}

function animatedTextureBehavior(textures: PIXI.Texture[], speed: number): EmitterBehavior {
  return {
    type: 'animatedSingle',
    config: { anim: { textures, loop: true, framerate: Math.max(1, Math.round(12 * speed)), randomStart: true } },
  }
}

function resolveTextureBehavior(textures: PIXI.Texture[], speed: number): EmitterBehavior {
  return textures.length > 1 ? animatedTextureBehavior(textures, speed) : textureBehavior(textures[0])
}

function rotationBehavior(min = 0, max = 360): EmitterBehavior {
  return { type: 'rotationStatic', config: { min, max } }
}

function pointSpawn(radius = 5): EmitterBehavior {
  return {
    type: 'spawnShape',
    config: { type: 'torus', data: { x: 0, y: 0, radius, innerRadius: 0, affectRotation: false } },
  }
}

function ringSpawn(radius: number): EmitterBehavior {
  return {
    type: 'spawnShape',
    config: { type: 'torus', data: { x: 0, y: 0, radius, innerRadius: radius * 0.8, affectRotation: true } },
  }
}

function rectSpawn(x: number, y: number, w: number, h: number): EmitterBehavior {
  return { type: 'spawnShape', config: { type: 'rect', data: { x, y, w, h } } }
}

function gravityBehavior(gy: number): EmitterBehavior {
  return { type: 'moveAcceleration', config: { accel: { x: 0, y: gy }, maxSpeed: 800, rotate: true } }
}

function directionBehavior(minAngle: number, maxAngle: number): EmitterBehavior {
  return { type: 'rotationStatic', config: { min: minAngle, max: maxAngle } }
}

function colorBehavior(start: string, end: string): EmitterBehavior | null {
  if (start === 'ffffff' && end === 'ffffff') return null
  return {
    type: 'color',
    config: { color: { list: [{ value: start, time: 0 }, { value: end, time: 1 }] } },
  }
}

function blendModeBehavior(mode: string): EmitterBehavior | null {
  if (mode === 'normal') return null
  return { type: 'blendMode', config: { blendMode: mode } }
}

function spinBehavior(speed: number): EmitterBehavior {
  return {
    type: 'rotation',
    config: { minSpeed: speed, maxSpeed: speed, minStart: 0, maxStart: 360, accel: 0 },
  }
}

export function buildEmitterConfig(presetId: string, params: ParticleParams, textures: PIXI.Texture[]) {
  const s = params.speed
  const l = params.lifetime
  const sz = params.size
  const n = params.count
  const sp = params.spread

  const sizeEnd    = params.sizeEnd    ?? 0.2
  const aStart     = params.alphaStart ?? 1
  const aEnd       = params.alphaEnd   ?? 0
  const grav       = (params.gravity   ?? 0) * 600
  const spin       = params.spinSpeed  ?? 0
  const tintStart  = params.tintStart  ?? 'ffffff'
  const tintEnd    = params.tintEnd    ?? 'ffffff'
  const blend      = params.blendMode  ?? 'normal'
  const emitR      = params.emitRadius ?? 8

  // Shared behaviors derived from params
  const sharedBehaviors: EmitterBehavior[] = [
    resolveTextureBehavior(textures, s),
    alphaBehavior(aStart, aEnd),
    scaleBehavior(sz, sizeEnd),
  ]
  const colorBeh  = colorBehavior(tintStart, tintEnd)
  const blendBeh  = blendModeBehavior(blend)
  if (colorBeh) sharedBehaviors.push(colorBeh)
  if (blendBeh) sharedBehaviors.push(blendBeh)
  if (spin !== 0) sharedBehaviors.push(spinBehavior(spin))
  if (grav !== 0) sharedBehaviors.push(gravityBehavior(grav))

  switch (presetId) {
    case 'burst':
      return {
        lifetime: { min: l * 0.6, max: l },
        frequency: 0.001,
        emitterLifetime: 0.1,
        maxParticles: n,
        addAtBack: false,
        pos: { x: 0, y: 0 },
        behaviors: [
          ...sharedBehaviors,
          speedBehavior(s * 300, s * 60),
          rotationBehavior(0, 360),
          pointSpawn(emitR),
        ],
      }

    case 'sparkler':
      return {
        lifetime: { min: l * 0.3, max: l },
        frequency: 0.015 / (n / 60),
        emitterLifetime: -1,
        maxParticles: n,
        addAtBack: false,
        pos: { x: 0, y: 0 },
        behaviors: [
          ...sharedBehaviors,
          speedBehavior(s * 280, s * 10, 0.3),
          rotationBehavior(0, 360),
          pointSpawn(emitR),
        ],
      }

    case 'floatup':
      return {
        lifetime: { min: l * 0.7, max: l },
        frequency: 0.08 / (n / 25),
        emitterLifetime: -1,
        maxParticles: n,
        addAtBack: false,
        pos: { x: 0, y: 0 },
        behaviors: [
          ...sharedBehaviors,
          speedBehavior(s * 80, s * 20, 0.5),
          directionBehavior(250 - sp * 30, 290 + sp * 30),
          pointSpawn(emitR),
        ],
      }

    case 'rain':
      return {
        lifetime: { min: l * 0.8, max: l },
        frequency: 0.04 / (n / 50),
        emitterLifetime: -1,
        maxParticles: n,
        addAtBack: false,
        pos: { x: 0, y: 0 },
        behaviors: [
          ...sharedBehaviors,
          speedBehavior(s * 200, s * 180, 0.8),
          directionBehavior(80 - sp * 15, 100 + sp * 15),
          pointSpawn(emitR),
        ],
      }

    case 'fountain':
      return {
        lifetime: { min: l * 0.7, max: l },
        frequency: 0.04 / (n / 35),
        emitterLifetime: -1,
        maxParticles: n,
        addAtBack: false,
        pos: { x: 0, y: 0 },
        behaviors: [
          ...sharedBehaviors,
          speedBehavior(s * 380, s * 80, 0.5),
          directionBehavior(230 - sp * 60, 310 + sp * 60),
          pointSpawn(emitR),
        ],
      }

    case 'orbit':
      return {
        lifetime: { min: l * 0.9, max: l },
        frequency: 0.12 / (n / 20),
        emitterLifetime: -1,
        maxParticles: n,
        addAtBack: false,
        pos: { x: 0, y: 0 },
        behaviors: [
          ...sharedBehaviors,
          speedBehavior(s * 30, s * 15, 0.8),
          ringSpawn(Math.max(20, emitR * 2)),
        ],
      }

    default:
      return null
  }
}

export function buildClickBurst(textures: PIXI.Texture[], params: ParticleParams) {
  const s = params.speed
  const l = params.lifetime * 0.5
  const sz = params.size * 0.7
  return {
    lifetime: { min: l * 0.4, max: l },
    frequency: 0.001,
    emitterLifetime: 0.05,
    maxParticles: 15,
    addAtBack: false,
    pos: { x: 0, y: 0 },
    behaviors: [
      resolveTextureBehavior(textures, s),
      alphaBehavior(params.alphaStart ?? 1, params.alphaEnd ?? 0),
      scaleBehavior(sz, 0),
      speedBehavior(s * 180, s * 20),
      rotationBehavior(0, 360),
      pointSpawn(4),
    ],
  }
}
