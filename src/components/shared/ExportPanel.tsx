import { useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { exportSpineCreate, exportSpineReplace } from '../../engine/exporters/spineExporter'
import { exportMp4 } from '../../engine/exporters/mp4Exporter'
import { exportLottie } from '../../engine/exporters/lottieExporter'
import { AnimationRenderer } from '../../engine/renderer'
import type { ExportFormat } from '../../types'

const FORMATS: { id: ExportFormat; label: string; desc: string }[] = [
  { id: 'spine', label: 'Spine',  desc: '.json + .atlas + .webp (zip)' },
  { id: 'lottie', label: 'Lottie', desc: '.json (web / UI)' },
  { id: 'mp4',   label: 'Video',  desc: '.webm (preview / pitch)' },
  { id: 'png',   label: 'PNG',    desc: 'Single frame capture' },
]

export function ExportPanel({ canvasRef }: { canvasRef?: React.RefObject<HTMLCanvasElement> }) {
  const mode = useStore((s) => s.mode)
  const template = useStore((s) => s.selectedTemplate)
  const uploadedImages = useStore((s) => s.uploadedImages)
  const settings = useStore((s) => s.settings)
  const spineJson = useStore((s) => s.spineJson)
  const slotImages = useStore((s) => s.slotImages)

  const [format, setFormat] = useState<ExportFormat>('spine')
  const [exporting, setExporting] = useState(false)
  const [projectName, setProjectName] = useState('animation')

  const canExport =
    mode === 'replace'
      ? spineJson !== null && slotImages.length > 0
      : template !== null && uploadedImages.some(Boolean)

  async function handleExport() {
    if (!canExport || exporting) return
    setExporting(true)

    try {
      if (mode === 'replace' && spineJson) {
        await exportSpineReplace(spineJson.raw, slotImages, projectName)
        return
      }

      if (!template) return

      if (format === 'spine') {
        await exportSpineCreate(template, uploadedImages, settings, projectName)
      } else if (format === 'lottie') {
        await exportLottie(template, uploadedImages, settings, projectName)
      } else if (format === 'mp4' && canvasRef?.current) {
        const tempRenderer = new AnimationRenderer(document.createElement('canvas'))
        await exportMp4(tempRenderer, template, settings, canvasRef.current, 30, projectName)
        tempRenderer.destroy()
      } else if (format === 'png' && canvasRef?.current) {
        const url = canvasRef.current.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = url
        a.download = `${projectName}.png`
        a.click()
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-widest">Export</p>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 shrink-0">Project name</span>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value.replace(/\s+/g, '_'))}
          className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent"
          placeholder="animation"
        />
      </div>

      {mode === 'create' && (
        <div className="grid grid-cols-2 gap-1.5">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                format === f.id
                  ? 'border-accent bg-accent/10 text-white'
                  : 'border-border bg-surface-2 text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="text-sm font-semibold">{f.label}</div>
              <div className="text-xs text-gray-500">{f.desc}</div>
            </button>
          ))}
        </div>
      )}

      {mode === 'replace' && (
        <p className="text-xs text-gray-500">
          Exports Spine bundle (.json + .atlas + .webp) with replaced images
        </p>
      )}

      <button
        onClick={handleExport}
        disabled={!canExport || exporting}
        className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-30 hover:bg-accent-hover transition-colors"
      >
        {exporting ? 'Exporting...' : `Export ${mode === 'replace' ? 'Spine Bundle' : format.toUpperCase()}`}
      </button>
    </div>
  )
}
