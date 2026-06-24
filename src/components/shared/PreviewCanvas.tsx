import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import { AnimationRenderer } from '../../engine/renderer'

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<AnimationRenderer | null>(null)

  const template = useStore((s) => s.selectedTemplate)
  const uploadedImages = useStore((s) => s.uploadedImages)
  const settings = useStore((s) => s.settings)
  const isPlaying = useStore((s) => s.isPlaying)
  const setPlaying = useStore((s) => s.setPlaying)

  const [elapsed, setElapsed] = useState(0)

  // Init renderer
  useEffect(() => {
    if (!canvasRef.current) return
    const renderer = new AnimationRenderer(canvasRef.current, 512, 512)
    rendererRef.current = renderer
    renderer.onTick((t) => setElapsed(t))
    return () => { renderer.destroy(); rendererRef.current = null }
  }, [])

  // Load images when they change
  useEffect(() => {
    rendererRef.current?.loadImages(uploadedImages)
  }, [uploadedImages])

  // Apply template
  useEffect(() => {
    if (template) rendererRef.current?.setTemplate(template)
  }, [template])

  // Apply settings
  useEffect(() => {
    rendererRef.current?.setSettings(settings)
  }, [settings])

  // Play/pause
  useEffect(() => {
    if (isPlaying) rendererRef.current?.play()
    else rendererRef.current?.pause()
  }, [isPlaying])

  const canPlay = template !== null

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-widest">Preview</p>

      <div className="relative rounded-xl overflow-hidden bg-surface-2 border border-border">
        <canvas
          ref={canvasRef}
          className="w-full aspect-square block"
          style={{ imageRendering: 'pixelated' }}
        />

        {!canPlay && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
            Select a template to preview
          </div>
        )}
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-2">
        <button
          disabled={!canPlay}
          onClick={() => setPlaying(!isPlaying)}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-30 hover:bg-accent-hover transition-colors"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          disabled={!canPlay}
          onClick={() => { setPlaying(false); rendererRef.current?.reset() }}
          className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-gray-400 text-sm hover:text-white disabled:opacity-30 transition-colors"
        >
          Reset
        </button>

        {template && (
          <div className="flex-1 text-right">
            <span className="text-xs text-gray-600 tabular-nums">
              {elapsed.toFixed(2)}s / {template.duration}s
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
