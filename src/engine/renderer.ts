import * as PIXI from 'pixi.js'
import type { AnimationTemplate, AnimationSettings, AnimProps, Keyframe, EasingType } from '../types'

// --- Easing ---

function applyEasing(t: number, easing: EasingType): number {
  switch (easing) {
    case 'linear':    return t
    case 'easeIn':    return t * t
    case 'easeOut':   return t * (2 - t)
    case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    case 'bounce': {
      if (t < 1 / 2.75) return 7.5625 * t * t
      if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75 }
      if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375 }
      t -= 2.625 / 2.75
      return 7.5625 * t * t + 0.984375
    }
    case 'elastic': {
      if (t === 0 || t === 1) return t
      return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
    }
    default: return t
  }
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function interpolateProps(a: AnimProps, b: AnimProps, t: number): AnimProps {
  const result: AnimProps = {}
  const keys: (keyof AnimProps)[] = ['scaleX', 'scaleY', 'x', 'y', 'rotation', 'alpha']
  for (const k of keys) {
    const av = a[k] as number | undefined
    const bv = b[k] as number | undefined
    if (av !== undefined && bv !== undefined) {
      result[k] = lerpNum(av, bv, t) as never
    } else if (bv !== undefined) {
      result[k] = bv as never
    } else if (av !== undefined) {
      result[k] = av as never
    }
  }
  return result
}

function interpolateKeyframes(keyframes: Keyframe[], time: number, intensity: number): AnimProps {
  if (keyframes.length === 0) return {}
  if (time <= keyframes[0].time) return applyIntensity(keyframes[0].props, intensity)
  if (time >= keyframes[keyframes.length - 1].time)
    return applyIntensity(keyframes[keyframes.length - 1].props, intensity)

  for (let i = 0; i < keyframes.length - 1; i++) {
    const ka = keyframes[i]
    const kb = keyframes[i + 1]
    if (time >= ka.time && time <= kb.time) {
      const raw = (time - ka.time) / (kb.time - ka.time)
      const eased = applyEasing(raw, kb.easing)
      const interp = interpolateProps(ka.props, kb.props, eased)
      return applyIntensity(interp, intensity)
    }
  }
  return {}
}

function applyIntensity(props: AnimProps, intensity: number): AnimProps {
  const out: AnimProps = { ...props }
  // Scale deviations from neutral by intensity
  if (out.x !== undefined)        out.x *= intensity
  if (out.y !== undefined)        out.y *= intensity
  if (out.rotation !== undefined) out.rotation *= intensity
  if (out.scaleX !== undefined)   out.scaleX = 1 + (out.scaleX - 1) * intensity
  if (out.scaleY !== undefined)   out.scaleY = 1 + (out.scaleY - 1) * intensity
  return out
}

// --- Renderer ---

export class AnimationRenderer {
  private app: PIXI.Application
  private sprites: PIXI.Sprite[] = []
  private containers: PIXI.Container[] = []
  private elapsed = 0
  private playing = false
  private template: AnimationTemplate | null = null
  private settings: AnimationSettings = { speed: 1, intensity: 1, loop: true, delay: 0 }
  private onTickCallback?: (t: number) => void

  constructor(canvas: HTMLCanvasElement, width = 512, height = 512) {
    this.app = new PIXI.Application({
      view: canvas,
      width,
      height,
      backgroundColor: 0x1e1e36,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })
    this.app.ticker.add(this.update.bind(this))
  }

  private get cx() { return this.app.screen.width / 2 }
  private get cy() { return this.app.screen.height / 2 }

  loadImages(dataurls: (string | null)[]) {
    this.app.stage.removeChildren()
    this.sprites = []
    this.containers = []

    const validUrls = dataurls.filter(Boolean) as string[]
    for (const url of validUrls) {
      const container = new PIXI.Container()
      const texture = PIXI.Texture.from(url)
      const sprite = new PIXI.Sprite(texture)
      sprite.anchor.set(0.5)
      container.addChild(sprite)
      container.x = this.cx
      container.y = this.cy
      this.app.stage.addChild(container)
      this.sprites.push(sprite)
      this.containers.push(container)
    }

    // Re-apply current frame after loading
    if (this.template) this.applyFrame(this.elapsed)
  }

  setTemplate(template: AnimationTemplate) {
    this.template = template
    this.elapsed = 0
    this.applyFrame(0)
  }

  setSettings(settings: AnimationSettings) {
    this.settings = settings
  }

  play() {
    this.elapsed = 0
    this.playing = true
  }

  pause() {
    this.playing = false
  }

  resume() {
    this.playing = true
  }

  reset() {
    this.elapsed = 0
    this.playing = false
    this.applyFrame(0)
  }

  onTick(cb: (t: number) => void) {
    this.onTickCallback = cb
  }

  private update(delta: number) {
    if (!this.playing || !this.template) return

    this.elapsed += (delta / 60) * this.settings.speed

    const duration = this.template.duration
    if (this.elapsed >= duration) {
      if (this.settings.loop) {
        this.elapsed = this.elapsed % duration
      } else {
        this.elapsed = duration
        this.playing = false
      }
    }

    this.applyFrame(this.elapsed)
    this.onTickCallback?.(this.elapsed)
  }

  private applyFrame(time: number) {
    if (!this.template) return

    for (const slotAnim of this.template.animations) {
      const container = this.containers[slotAnim.slotIndex]
      if (!container) continue

      const props = interpolateKeyframes(slotAnim.keyframes, time, this.settings.intensity)

      container.x = this.cx + (props.x ?? 0)
      container.y = this.cy + (props.y ?? 0)
      container.scale.x = props.scaleX ?? 1
      container.scale.y = props.scaleY ?? 1
      container.rotation = ((props.rotation ?? 0) * Math.PI) / 180
      container.alpha = props.alpha ?? 1
    }
  }

  captureFrame(): string {
    return this.app.view.toDataURL?.('image/png') ?? ''
  }

  destroy() {
    this.app.destroy(false)
  }
}
