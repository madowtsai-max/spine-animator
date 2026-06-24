import { useRef } from 'react'
import { useStore } from '../../store/useStore'

export function ImageUploadSlots() {
  const template = useStore((s) => s.selectedTemplate)
  const uploadedImages = useStore((s) => s.uploadedImages)
  const setUploadedImage = useStore((s) => s.setUploadedImage)

  if (!template) return null

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 uppercase tracking-widest">Step 3 — Upload Images</p>
      <div className="space-y-2">
        {template.slotLabels.slice(0, template.slotCount).map((label, i) => (
          <ImageSlot
            key={i}
            index={i}
            label={label}
            dataUrl={uploadedImages[i]}
            onUpload={(url) => setUploadedImage(i, url)}
          />
        ))}
      </div>
    </div>
  )
}

function ImageSlot({
  index,
  label,
  dataUrl,
  onUpload,
}: {
  index: number
  label: string
  dataUrl: string | null
  onUpload: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => onUpload(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">
        Slot {index + 1} — <span className="text-gray-400">{label}</span>
      </p>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={`relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
          ${dataUrl
            ? 'border-accent/40 bg-accent/5 hover:border-accent/60'
            : 'border-dashed border-border bg-surface-2 hover:border-gray-500'
          }`}
      >
        {dataUrl ? (
          <>
            <img src={dataUrl} className="w-12 h-12 object-contain rounded-lg bg-surface-3" alt={label} />
            <div className="flex-1">
              <p className="text-sm text-white">Image loaded</p>
              <p className="text-xs text-gray-500">Click to replace</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onUpload('') }}
              className="text-gray-600 hover:text-gray-300 text-lg leading-none"
            >
              ×
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 w-full justify-center py-2">
            <span className="text-xl">+</span>
            <span className="text-sm">Drag or click to upload PNG</span>
          </div>
        )}
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
