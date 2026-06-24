import { useStore } from '../store/useStore'
import type { AppMode } from '../types'

const MODES: { id: AppMode; label: string }[] = [
  { id: 'create',   label: 'Create Animation' },
  { id: 'replace',  label: 'Replace Images' },
  { id: 'particle', label: 'Particle FX' },
]

export function ModeSelector() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)

  return (
    <div className="flex gap-1 p-1 bg-surface-1 rounded-xl border border-border">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            mode === m.id
              ? 'bg-accent text-white shadow-lg shadow-accent/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
