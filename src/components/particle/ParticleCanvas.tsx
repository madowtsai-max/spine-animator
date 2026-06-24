import { useEffect, useRef, useState, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import { Emitter } from '@pixi/particle-emitter'
import { useStore } from '../../store/useStore'
import { buildEmitterConfig, PARTICLE_PRESETS } from '../../engine/particles/presets'
import { exportGif } from '../../engine/exporters/gifExporter'

const W = 512, H = 512

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const emitterRef = useRef<Emitter | null>(null)
  const containerRef = useRef<PIXI.Container | null>(null)
  const tickerRef = useRef<((delta: number) => void) | null>(null)
  const lastTimeRef = useRef<number>(0)
  const loopRef = useRef(false)
  const rebuildRef = useRef<() => void>(() => {})

  const [playing, setPlaying] = useState(false)
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [exporting, setExporting] = useState(false)

  const imageUrl = useStore((s) => s.particleImageDataUrl)
  const frames = useStore((s) => s.particleFrames)
  const presetId = useStore((s) => s.selectedParticlePresetId)
  const params = useStore((s) => s.particleParams)

  // Keep loopRef in sync with state
  useEffect(() => { loopRef.current = loopEnabled }, [loopEnabled])

  // Sync emit origin position
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.x = W / 2 + (params.emitX ?? 0)
      containerRef.current.y = H / 2 + (params.emitY ?? 0)
    }
  }, [params.emitX, params.emitY])

  // Init Pixi app once
  useEffect(() => {
    if (!canvasRef.current) return
    const app = new PIXI.Application({
      view: canvasRef.current,
      width: W,
      height: H,
      backgroundColor: 0x1e1e36,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })
    appRef.current = app

    const container = new PIXI.Container()
    container.x = W / 2 + (params.emitX ?? 0)
    container.y = H / 2 + (params.emitY ?? 0)
    app.stage.addChild(container)
    containerRef.current = container

    return () => {
      emitterRef.current?.destroy()
      app.destroy(false)
      appRef.current = null
    }
  }, [])

  const rebuildEmitter = useCallback(() => {
    const app = appRef.current
    const container = containerRef.current
    if (!app || !container || frames.length === 0 || !presetId) return

    if (emitterRef.current) {
      emitterRef.current.destroy()
      emitterRef.current = null
    }
    if (tickerRef.current) {
      app.ticker.remove(tickerRef.current)
      tickerRef.current = null
    }
    container.removeChildren()

    const textures = frames.map((url) => PIXI.Texture.from(url))
    const config = buildEmitterConfig(presetId, params, textures)
    if (!config) return

    const emitter = new Emitter(container, config)
    emitter.emit = true
    emitterRef.current = emitter

    lastTimeRef.current = performance.now()

    const preset = PARTICLE_PRESETS.find((p) => p.id === presetId)
    const isOneShot = !preset?.looping
    // How long until a one-shot effect is fully faded and ready to replay
    const restartAfter = params.lifetime * 1.3 + 0.15

    let elapsed = 0

    const tick = () => {
      const now = performance.now()
      const dt = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now
      emitter.update(dt)
      elapsed += dt
      if (loopRef.current && isOneShot && elapsed >= restartAfter) {
        rebuildRef.current()
      }
    }
    tickerRef.current = tick
    app.ticker.add(tick)
    setPlaying(true)
  }, [frames, presetId, params])

  // Keep rebuildRef pointing to latest closure
  rebuildRef.current = rebuildEmitter

  // Rebuild when image/preset/params change
  useEffect(() => {
    rebuildEmitter()
  }, [rebuildEmitter])

  function handlePlayPause() {
    const emitter = emitterRef.current
    if (!emitter) return
    if (playing) {
      emitter.emit = false
      setPlaying(false)
    } else {
      emitter.emit = true
      setPlaying(true)
    }
  }

  function handleLoop() {
    const next = !loopEnabled
    setLoopEnabled(next)
    // If turning on loop and effect is one-shot, restart it now
    if (next) {
      const preset = PARTICLE_PRESETS.find((p) => p.id === presetId)
      if (!preset?.looping) rebuildEmitter()
    }
  }

  async function handleExportGif() {
    if (!canvasRef.current || !presetId) return
    setExporting(true)
    const preset = PARTICLE_PRESETS.find((p) => p.id === presetId)
    const duration = preset?.looping ? params.lifetime * 2.5 : params.lifetime * 2

    if (emitterRef.current) emitterRef.current.emit = true
    setPlaying(true)

    await exportGif(canvasRef.current, duration, 24, 0, presetId)
    setExporting(false)
  }

  const canExport = !!imageUrl && !!presetId

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-widest">Preview</p>

      <div className="relative rounded-xl overflow-hidden bg-surface-2 border border-border">
        <canvas ref={canvasRef} className="w-full aspect-square block" />
        {!imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
            Upload a particle image to preview
          </div>
        )}
        {imageUrl && !presetId && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
            Pick an effect type
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          disabled={!canExport}
          onClick={handlePlayPause}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-30 hover:bg-accent-hover transition-colors"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          disabled={!canExport}
          onClick={() => rebuildEmitter()}
          className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-gray-400 text-sm hover:text-white disabled:opacity-30 transition-colors"
        >
          Replay
        </button>
        <button
          disabled={!canExport}
          onClick={handleLoop}
          className={`px-3 py-2 rounded-lg border text-sm transition-colors disabled:opacity-30 ${
            loopEnabled
              ? 'border-accent bg-accent/15 text-accent'
              : 'border-border bg-surface-2 text-gray-400 hover:text-white'
          }`}
        >
          Loop
        </button>
      </div>

      {/* Export */}
      <div className="border-t border-border pt-4 space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-widest">Export</p>
        <div className="flex gap-2">
          <button
            disabled={!canExport || exporting}
            onClick={handleExportGif}
            className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-30 hover:bg-accent-hover transition-colors"
          >
            {exporting ? 'Capturing...' : 'Export GIF'}
          </button>
          <button
            disabled={!canExport}
            onClick={() => {
              if (!canvasRef.current) return
              const url = canvasRef.current.toDataURL('image/png')
              const a = document.createElement('a')
              a.href = url; a.download = `${presetId}_frame.png`; a.click()
            }}
            className="px-4 py-2.5 rounded-xl border border-border bg-surface-2 text-gray-400 text-sm hover:text-white disabled:opacity-30 transition-colors"
          >
            PNG
          </button>
        </div>
        <p className="text-xs text-gray-600">GIF loops forever — plays anywhere (Slack, Discord, etc.)</p>
      </div>
    </div>
  )
}
