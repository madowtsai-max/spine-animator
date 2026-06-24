import { useStore } from '../../store/useStore'

export function AnimationControls() {
  const template = useStore((s) => s.selectedTemplate)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)

  if (!template) return null

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-widest">Step 4 — Adjust</p>

      <SliderRow
        label="Speed"
        value={settings.speed}
        min={0.2}
        max={3}
        step={0.1}
        format={(v) => `${v.toFixed(1)}×`}
        onChange={(v) => setSettings({ speed: v })}
      />

      <SliderRow
        label="Intensity"
        value={settings.intensity}
        min={0.1}
        max={2}
        step={0.05}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => setSettings({ intensity: v })}
      />

      <div className="flex items-center justify-between py-1">
        <span className="text-sm text-gray-400">Loop</span>
        <button
          onClick={() => setSettings({ loop: !settings.loop })}
          className={`w-11 h-6 rounded-full transition-colors relative ${
            settings.loop ? 'bg-accent' : 'bg-surface-3'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
              settings.loop ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-16 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-accent h-1"
      />
      <span className="text-sm text-gray-300 w-10 text-right tabular-nums">{format(value)}</span>
    </div>
  )
}
