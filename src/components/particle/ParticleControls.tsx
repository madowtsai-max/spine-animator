import { useRef } from 'react'
import { useStore } from '../../store/useStore'
import { PARTICLE_PRESETS } from '../../engine/particles/presets'

type ShapeId = 'blurball' | 'ball' | 'star' | 'line'
const SHAPES: { id: ShapeId; label: string; icon: string }[] = [
  { id: 'blurball', label: 'Blur Ball', icon: '◎' },
  { id: 'ball',     label: 'Ball',      icon: '●' },
  { id: 'star',     label: 'Star',      icon: '★' },
  { id: 'line',     label: 'Line',      icon: '—' },
]

function generateShape(shape: ShapeId): string {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')!
  const cx = size / 2, cy = size / 2, r = size / 2 - 2
  ctx.clearRect(0, 0, size, size)

  if (shape === 'blurball') {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0,   'rgba(255,255,255,1)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.6)')
    g.addColorStop(1,   'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  } else if (shape === 'ball') {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()
  } else if (shape === 'star') {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2
      const rad = i % 2 === 0 ? r : r * 0.4
      const x = cx + Math.cos(angle) * rad
      const y = cy + Math.sin(angle) * rad
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = 'white'
    ctx.fill()
  } else if (shape === 'line') {
    const h = Math.max(3, size * 0.12)
    ctx.fillStyle = 'white'
    ctx.fillRect(2, cy - h / 2, size - 4, h)
  }

  return canvas.toDataURL('image/png')
}

export function ParticleControls() {
  const imageUrl = useStore((s) => s.particleImageDataUrl)
  const frames   = useStore((s) => s.particleFrames)
  const presetId = useStore((s) => s.selectedParticlePresetId)
  const params   = useStore((s) => s.particleParams)
  const setImage  = useStore((s) => s.setParticleImage)
  const setFrames = useStore((s) => s.setParticleFrames)
  const setPreset = useStore((s) => s.setParticlePreset)
  const setParams = useStore((s) => s.setParticleParams)

  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(fileList: FileList | File[]) {
    const sorted = Array.from(fileList)
      .filter((f) => f.type.startsWith('image/'))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    if (sorted.length === 0) return
    Promise.all(
      sorted.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target!.result as string)
            reader.readAsDataURL(file)
          })
      )
    ).then((urls) => setFrames(urls))
  }

  const p = params

  return (
    <div className="space-y-5">

      {/* Step 1 — Image */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Step 1 — Particle Image</p>
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          onDragOver={(e) => e.preventDefault()}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            imageUrl
              ? 'border-accent/40 bg-accent/5 hover:border-accent/60'
              : 'border-dashed border-border bg-surface-2 hover:border-gray-500'
          }`}
        >
          {imageUrl ? (
            <>
              <img src={imageUrl} className="w-12 h-12 object-contain rounded-lg bg-surface-3" alt="particle" />
              <div className="flex-1">
                {frames.length > 1 ? (
                  <>
                    <p className="text-sm text-white">PNG sequence — {frames.length} frames</p>
                    <p className="text-xs text-gray-500">Sorted by filename · each particle animates through frames</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-white">Particle image loaded</p>
                    <p className="text-xs text-gray-500">Click to replace · drop multiple PNGs for a sequence</p>
                  </>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); setImage(null) }} className="text-gray-600 hover:text-gray-300 text-lg">×</button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 w-full justify-center py-2">
              <span className="text-xl">+</span>
              <div className="text-sm">
                <p>Drag or click to upload particle image</p>
                <p className="text-xs text-gray-600 mt-0.5">Single PNG or drop multiple for a sequence</p>
              </div>
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/webp,image/jpeg" multiple className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files) }} />
        <div className="flex gap-1.5 mt-2">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => setFrames([generateShape(s.id)])}
              className="flex-1 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all"
            >
              <span className="mr-1">{s.icon}</span>{s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Effect Type (compact) */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Step 2 — Effect Type</p>
        <div className="grid grid-cols-3 gap-1.5">
          {PARTICLE_PRESETS.map((preset) => {
            const active = presetId === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => setPreset(preset.id, preset.defaultParams)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-border bg-surface-2 text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{preset.icon}</span>
                <span className="text-xs font-semibold truncate">{preset.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step 3 — Adjust (unlocks after preset) */}
      {presetId && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Step 3 — Adjust</p>

          <Section label="Emission">
            <ParamSlider label="Count"    value={p.count}    min={5}   max={150} step={5}    fmt={(v) => `${v}`}              onChange={(v) => setParams({ count: v })} />
            <ParamSlider label="Lifetime" value={p.lifetime} min={0.3} max={4}   step={0.1}  fmt={(v) => `${v.toFixed(1)}s`}  onChange={(v) => setParams({ lifetime: v })} />
            <ParamSlider label="Speed"    value={p.speed}    min={0.3} max={3}   step={0.1}  fmt={(v) => `${v.toFixed(1)}×`}  onChange={(v) => setParams({ speed: v })} />
            <ParamSlider label="Spread"   value={p.spread}   min={0}   max={1}   step={0.05} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setParams({ spread: v })} />
          </Section>

          <Section label="Spawn Area">
            <ParamSlider label="X"      value={p.emitX      ?? 0} min={-200} max={200} step={1} fmt={(v) => `${v}px`} onChange={(v) => setParams({ emitX: v })} />
            <ParamSlider label="Y"      value={p.emitY      ?? 0} min={-200} max={200} step={1} fmt={(v) => `${v}px`} onChange={(v) => setParams({ emitY: v })} />
            <ParamSlider label="Radius" value={p.emitRadius ?? 8} min={0}    max={150} step={1} fmt={(v) => `${v}px`} onChange={(v) => setParams({ emitRadius: v })} />
          </Section>

          <Section label="Size">
            <ParamSlider label="Start" value={p.size}            min={0.1} max={3} step={0.1} fmt={(v) => `${v.toFixed(1)}×`} onChange={(v) => setParams({ size: v })} />
            <ParamSlider label="End"   value={p.sizeEnd  ?? 0.2} min={0}   max={3} step={0.1} fmt={(v) => `${v.toFixed(1)}×`} onChange={(v) => setParams({ sizeEnd: v })} />
          </Section>

          <Section label="Opacity">
            <ParamSlider label="Start" value={p.alphaStart ?? 1} min={0} max={1} step={0.05} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setParams({ alphaStart: v })} />
            <ParamSlider label="End"   value={p.alphaEnd   ?? 0} min={0} max={1} step={0.05} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setParams({ alphaEnd: v })} />
          </Section>

          <Section label="Motion">
            <ParamSlider
              label="Gravity"
              value={p.gravity ?? 0}
              min={-1} max={1} step={0.05}
              fmt={(v) => v === 0 ? 'none' : v > 0 ? `↓ ${v.toFixed(2)}` : `↑ ${Math.abs(v).toFixed(2)}`}
              onChange={(v) => setParams({ gravity: v })}
            />
            <ParamSlider
              label="Spin"
              value={p.spinSpeed ?? 0}
              min={-360} max={360} step={10}
              fmt={(v) => v === 0 ? 'none' : `${v > 0 ? '+' : ''}${v}°/s`}
              onChange={(v) => setParams({ spinSpeed: v })}
            />
          </Section>

          <Section label="Color">
            <ColorRow
              label="Tint Start"
              value={`#${p.tintStart ?? 'ffffff'}`}
              onChange={(hex) => setParams({ tintStart: hex.replace('#', '') })}
            />
            <ColorRow
              label="Tint End"
              value={`#${p.tintEnd ?? 'ffffff'}`}
              onChange={(hex) => setParams({ tintEnd: hex.replace('#', '') })}
            />
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-20 shrink-0">Blend</span>
              <div className="flex gap-1 flex-1">
                {(['normal', 'add', 'screen', 'multiply'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setParams({ blendMode: mode })}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                      (p.blendMode ?? 'normal') === mode
                        ? 'bg-accent text-white'
                        : 'bg-surface-3 text-gray-500 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-2 rounded-xl p-3 space-y-2.5 border border-border">
      <p className="text-xs text-gray-600 uppercase tracking-widest">{label}</p>
      {children}
    </div>
  )
}

function ParamSlider({ label, value, min, max, step, fmt, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  fmt: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-12 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-accent h-1" />
      <span className="text-sm text-gray-300 w-16 text-right tabular-nums">{fmt(value)}</span>
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-20 shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
        />
        <span className="text-sm text-gray-400 tabular-nums">{value.toUpperCase()}</span>
      </div>
    </div>
  )
}
