export type AppMode = 'create' | 'replace' | 'particle'
export type TemplateCategory = 'single' | 'textBoard' | 'iconEffect'
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic'
export type ExportFormat = 'spine' | 'lottie' | 'mp4' | 'png'

export interface AnimProps {
  scaleX?: number
  scaleY?: number
  x?: number
  y?: number
  rotation?: number
  alpha?: number
}

export interface Keyframe {
  time: number
  easing: EasingType
  props: AnimProps
}

export interface SlotAnimation {
  slotIndex: number
  keyframes: Keyframe[]
}

export interface AnimationTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  slotCount: number
  slotLabels: string[]
  duration: number
  defaultLoop: boolean
  animations: SlotAnimation[]
}

export interface AnimationSettings {
  speed: number
  intensity: number
  loop: boolean
  delay: number
}

// --- Atlas / Spine types ---

export interface AtlasRegion {
  name: string
  bounds: { x: number; y: number; w: number; h: number }
  offsets?: { x: number; y: number; w: number; h: number }
  rotate: boolean
  originalW: number
  originalH: number
}

export interface ParsedAtlas {
  textureName: string
  textureSize: { w: number; h: number }
  regions: AtlasRegion[]
}

export interface SpineSlot {
  name: string
  bone: string
  attachment?: string
}

export interface SpineBone {
  name: string
  parent?: string
  x?: number
  y?: number
  rotation?: number
}

export interface ParsedSpine {
  raw: Record<string, unknown>
  slots: SpineSlot[]
  bones: SpineBone[]
  animationNames: string[]
}

export interface SlotImage {
  name: string
  dataUrl: string
  replacementDataUrl?: string
  originalW: number
  originalH: number
}
