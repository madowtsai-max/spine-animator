# Spine Animator — Claude Code Context

Internal web tool for game studio designers to produce basic animations without needing Spine knowledge. Built with React + TypeScript + Vite + Pixi.js v7.

**Local dev:** `npm run dev` → http://localhost:5173

---

## Who uses this

Designers and non-animators who need to produce tip popups, click animations, and basic UI animations when animators are off. Output goes directly into the game (Pixi.js renderer, Spine runtime).

---

## Project structure

```
src/
  types/index.ts                  — all shared TypeScript types
  store/useStore.ts               — Zustand global state (all 3 modes)
  App.tsx                         — layout, mode switching, error boundary

  components/
    ModeSelector.tsx              — Create / Replace / Particle FX tabs
    create/
      TemplatePicker.tsx          — category + template selection grid
      ImageUploadSlots.tsx        — drag-drop image upload (1 or 2 slots)
      AnimationControls.tsx       — speed, intensity, loop sliders
    replace/
      SpineUploader.tsx           — upload .json + .atlas + texture
      SlotGrid.tsx                — displays extracted slots, handles swap
    shared/
      PreviewCanvas.tsx           — Pixi.js animation preview + transport
      ExportPanel.tsx             — format picker + export button
    particle/
      ParticleControls.tsx        — image upload + preset picker + sliders
      ParticleCanvas.tsx          — Pixi.js particle preview + GIF export

  engine/
    renderer.ts                   — AnimationRenderer class (Pixi.js)
    templates/
      index.ts                    — template registry + CATEGORY_META
      single/                     — 1-image templates
      textBoard/                  — 2-image board+text templates
      iconEffect/                 — 2-image icon+effect templates
    particles/
      presets.ts                  — PARTICLE_PRESETS + buildEmitterConfig()
    exporters/
      spineExporter.ts            — Spine JSON + atlas packer + ZIP
      lottieExporter.ts           — Lottie JSON generator
      mp4Exporter.ts              — WebM via MediaRecorder
      gifExporter.ts              — GIF via gifenc (particle mode)

  parsers/
    atlasParser.ts                — parse Spine .atlas text format
    atlasExtractor.ts             — extract image regions from atlas texture
    spineParser.ts                — parse Spine .json
```

---

## Adding a new animation template

1. Create a file in the right category folder, e.g. `src/engine/templates/single/wobble.ts`
2. Export an `AnimationTemplate` object. Follow this pattern:

```typescript
import type { AnimationTemplate } from '../../../types'

export const wobble: AnimationTemplate = {
  id: 'single-wobble',            // must be unique
  name: 'Wobble',
  description: 'Side-to-side rotation — idle attention grab',
  category: 'single',             // 'single' | 'textBoard' | 'iconEffect'
  slotCount: 1,                   // 1 or 2
  slotLabels: ['Image'],
  duration: 1.0,                  // seconds
  defaultLoop: true,
  animations: [
    {
      slotIndex: 0,
      keyframes: [
        { time: 0.0,  easing: 'easeInOut', props: { rotation: 0 } },
        { time: 0.25, easing: 'easeInOut', props: { rotation: 15 } },
        { time: 0.75, easing: 'easeInOut', props: { rotation: -15 } },
        { time: 1.0,  easing: 'easeInOut', props: { rotation: 0 } },
      ],
    },
  ],
}
```

**AnimProps fields:** `scaleX`, `scaleY`, `x`, `y`, `rotation` (degrees), `alpha` (0–1)

**Easing options:** `linear` | `easeIn` | `easeOut` | `easeInOut` | `bounce` | `elastic`

**Intensity** multiplies deviations from neutral: x/y offsets, rotation, and scale overshoot scale with it. Design keyframes at intensity=1.

3. Register in `src/engine/templates/index.ts`:

```typescript
import { wobble } from './single/wobble'

export const ALL_TEMPLATES: AnimationTemplate[] = [
  // ... existing ...
  wobble,
]
```

That's it — it appears in the UI automatically.

---

## Adding a new particle preset

1. Add a new entry to the `PARTICLE_PRESETS` array in `src/engine/particles/presets.ts`:

```typescript
{ id: 'spiral', name: 'Spiral', description: 'Spiral outward — magic, portal effect', icon: '🌪', looping: true,
  defaultParams: { count: 30, speed: 1, lifetime: 1.5, size: 1, spread: 0.4 } },
```

2. Add a case to `buildEmitterConfig()` in the same file. Use the existing cases as reference. Key behaviors:
   - `textureBehavior(texture)` — required, sets particle image
   - `alphaBehavior(start, end)` — opacity over lifetime
   - `scaleBehavior(start, end)` — scale over lifetime
   - `speedBehavior(start, end)` — movement speed
   - `rotationBehavior(min, max)` — spawn direction
   - `pointSpawn(radius)` — spawn from a point
   - `rectSpawn(x, y, w, h)` — spawn from a rectangle
   - `ringSpawn(radius)` — spawn from a ring
   - `gravityBehavior(gy)` — adds downward gravity

**Emitter config fields:**
- `frequency` — seconds between emissions (lower = more frequent)
- `emitterLifetime` — `-1` for infinite loop, positive number for one-shot burst
- `maxParticles` — cap on simultaneous particles

---

## Spine file format (based on team's actual files)

Real example: `Ultra_Jet.json` + `Ultra_Jet.atlas` + `Ultra_Jet.webp`

- The `.atlas` file maps image names → pixel regions in the texture
- `rotate: 90` in atlas means the region is stored rotated clockwise — `atlasExtractor.ts` handles this
- The `.json` has `bones`, `slots`, `skins`, `animations`
- Slots reference attachments (images) by name — these match atlas region names
- Spine version used by team: **4.2.43**

When exporting from Create mode, the generated Spine JSON targets Spine 4.2.43 and uses a simple bone-per-slot hierarchy. Animators can open and refine it in Spine editor.

---

## State shape (Zustand)

Three modes share one store (`src/store/useStore.ts`):
- **Create mode:** `category`, `selectedTemplate`, `uploadedImages[]`, `settings`
- **Replace mode:** `spineJson`, `spineAtlas`, `spineTextureDataUrl`, `slotImages[]`
- **Particle mode:** `particleImageDataUrl`, `selectedParticlePresetId`, `particleParams`

`isPlaying` is shared across create and particle modes.

---

## Key dependencies

| Package | Version | Purpose |
|---|---|---|
| `pixi.js` | ^7.4.2 | Canvas rendering (matches game engine) |
| `@pixi/particle-emitter` | ^5.0.10 | Particle system |
| `zustand` | ^4.5.2 | State management |
| `jszip` | ^3.10.1 | ZIP export for Spine bundles |
| `gifenc` | ^1.0.3 | GIF encoding for particle export |

---

## Known limitations (v1)

- MP4 export outputs `.webm` (browser limitation — no FFmpeg)
- Spine export from Create mode uses a simplified bone structure — good for starting point, animators should refine in Spine editor
- Particle effects cannot be exported to Spine format (Spine has no native particle system)
- Atlas packer uses simple shelf algorithm — large images may not pack optimally
