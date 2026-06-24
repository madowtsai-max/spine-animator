import { create } from 'zustand'
import type {
  AppMode,
  TemplateCategory,
  AnimationTemplate,
  AnimationSettings,
  ParsedAtlas,
  ParsedSpine,
  SlotImage,
} from '../types'
import type { ParticleParams } from '../engine/particles/presets'

interface AppState {
  mode: AppMode
  category: TemplateCategory | null
  selectedTemplate: AnimationTemplate | null
  uploadedImages: (string | null)[]
  settings: AnimationSettings
  isPlaying: boolean

  // Replace mode
  spineJson: ParsedSpine | null
  spineAtlas: ParsedAtlas | null
  spineTextureDataUrl: string | null
  slotImages: SlotImage[]

  // Particle mode
  particleImageDataUrl: string | null
  particleFrames: string[]
  selectedParticlePresetId: string | null
  particleParams: ParticleParams

  // Actions
  setMode: (mode: AppMode) => void
  setCategory: (cat: TemplateCategory) => void
  setTemplate: (t: AnimationTemplate) => void
  setUploadedImage: (index: number, dataUrl: string) => void
  clearUploadedImages: () => void
  setSettings: (s: Partial<AnimationSettings>) => void
  setPlaying: (v: boolean) => void

  setSpineData: (json: ParsedSpine, atlas: ParsedAtlas, textureDataUrl: string, slots: SlotImage[]) => void
  replaceSlotImage: (name: string, dataUrl: string) => void
  clearSpineData: () => void

  setParticleImage: (url: string | null) => void
  setParticleFrames: (frames: string[]) => void
  setParticlePreset: (id: string, defaults: ParticleParams) => void
  setParticleParams: (p: Partial<ParticleParams>) => void
}

export const useStore = create<AppState>((set) => ({
  mode: 'particle',
  category: null,
  selectedTemplate: null,
  uploadedImages: [null, null],
  settings: { speed: 1, intensity: 1, loop: true, delay: 0 },
  isPlaying: false,

  spineJson: null,
  spineAtlas: null,
  spineTextureDataUrl: null,
  slotImages: [],

  particleImageDataUrl: null,
  particleFrames: [],
  selectedParticlePresetId: null,
  particleParams: {
    count: 40, speed: 1, lifetime: 1, size: 1, spread: 0.5,
    sizeEnd: 0.2, alphaStart: 1, alphaEnd: 0,
    gravity: 0, spinSpeed: 0,
    tintStart: 'ffffff', tintEnd: 'ffffff', blendMode: 'normal' as const,
    emitX: 0, emitY: 0, emitRadius: 8,
  },

  setMode: (mode) => set({ mode, category: null, selectedTemplate: null }),
  setCategory: (category) => set({ category, selectedTemplate: null }),
  setTemplate: (selectedTemplate) => set({ selectedTemplate, settings: { speed: 1, intensity: 1, loop: selectedTemplate.defaultLoop, delay: 0 } }),
  setUploadedImage: (index, dataUrl) =>
    set((s) => {
      const imgs = [...s.uploadedImages]
      imgs[index] = dataUrl
      return { uploadedImages: imgs }
    }),
  clearUploadedImages: () => set({ uploadedImages: [null, null] }),
  setSettings: (s) => set((prev) => ({ settings: { ...prev.settings, ...s } })),
  setPlaying: (isPlaying) => set({ isPlaying }),

  setSpineData: (spineJson, spineAtlas, spineTextureDataUrl, slotImages) =>
    set({ spineJson, spineAtlas, spineTextureDataUrl, slotImages }),
  replaceSlotImage: (name, dataUrl) =>
    set((s) => ({
      slotImages: s.slotImages.map((img) =>
        img.name === name ? { ...img, replacementDataUrl: dataUrl } : img
      ),
    })),
  clearSpineData: () => set({ spineJson: null, spineAtlas: null, spineTextureDataUrl: null, slotImages: [] }),

  setParticleImage: (url) => set({ particleImageDataUrl: url, particleFrames: url ? [url] : [] }),
  setParticleFrames: (frames) => set({ particleFrames: frames, particleImageDataUrl: frames[0] ?? null }),
  setParticlePreset: (id, defaults) => set((s) => ({
    selectedParticlePresetId: id,
    particleParams: { ...s.particleParams, ...defaults },
  })),
  setParticleParams: (p) => set((s) => ({ particleParams: { ...s.particleParams, ...p } })),
}))
