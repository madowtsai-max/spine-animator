import { useRef } from 'react'
import { useStore } from '../../store/useStore'
import type { SlotImage } from '../../types'

export function SlotGrid() {
  const slotImages = useStore((s) => s.slotImages)
  const spineJson = useStore((s) => s.spineJson)
  const replaceSlotImage = useStore((s) => s.replaceSlotImage)

  if (!spineJson || slotImages.length === 0) return null

  const hasReplacement = slotImages.some((s) => s.replacementDataUrl)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-widest">Step 2 — Replace Images</p>
        <span className="text-xs text-gray-600">{slotImages.length} slots</span>
      </div>

      {hasReplacement && (
        <div className="text-xs text-accent bg-accent/10 border border-accent/20 px-3 py-2 rounded-lg">
          {slotImages.filter((s) => s.replacementDataUrl).length} image(s) replaced — export when ready
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
        {slotImages.map((slot) => (
          <SlotCard key={slot.name} slot={slot} onReplace={(url) => replaceSlotImage(slot.name, url)} />
        ))}
      </div>
    </div>
  )
}

function SlotCard({ slot, onReplace }: { slot: SlotImage; onReplace: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const displayUrl = slot.replacementDataUrl ?? slot.dataUrl
  const isReplaced = !!slot.replacementDataUrl

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => onReplace(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      isReplaced ? 'border-accent/40' : 'border-border'
    } bg-surface-2`}>
      <div className="relative aspect-square bg-surface-3 flex items-center justify-center overflow-hidden">
        {displayUrl ? (
          <img src={displayUrl} className="w-full h-full object-contain p-1" alt={slot.name} />
        ) : (
          <span className="text-gray-600 text-xs">No image</span>
        )}
        {isReplaced && (
          <div className="absolute top-1 right-1 bg-accent text-white text-xs px-1.5 py-0.5 rounded">
            New
          </div>
        )}
      </div>

      <div className="p-2">
        <p className="text-xs text-gray-400 truncate mb-1" title={slot.name}>{slot.name}</p>
        <p className="text-xs text-gray-600 mb-2">{slot.originalW}×{slot.originalH}</p>

        <div className="flex gap-1">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex-1 py-1 rounded-lg bg-surface-3 border border-border text-xs text-gray-400 hover:text-white hover:border-accent/40 transition-colors"
          >
            Replace
          </button>
          {isReplaced && (
            <button
              onClick={() => onReplace('')}
              className="py-1 px-2 rounded-lg bg-surface-3 border border-border text-xs text-gray-600 hover:text-gray-300 transition-colors"
              title="Revert to original"
            >
              ↩
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
