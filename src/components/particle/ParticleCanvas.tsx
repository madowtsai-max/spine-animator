import { useEffect, useRef, useState, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import { Emitter } from '@pixi/particle-emitter'
import { useStore } from '../../store/useStore'
import { buildEmitterConfig, buildClickBurst, PARTICLE_PRESETS } from '../../engine/particles/presets'
import { exportGif } from '../../engine/exporters/gifExporter'
import { exportVueComponent } from '../../engine/exporters/codeExporter'

const W = 512, H = 512

export function ParticleCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const appRef       = useRef<PIXI.Application | null>(null)
  const emitterRef   = useRef<Emitter | null>(null)
  const containerRef = useRef<PIXI.Container | null>(null)
  const graphicsRef  = useRef<PIXI.Graphics | null>(null)
  const tickerRef    = useRef<((delta: number) => void) | null>(null)
  const lastTimeRef  = useRef<number>(0)
  const loopRef      = useRef(false)
  const rebuildRef   = useRef<() => void>(() => {})
  const mouseRef     = useRef({ x: -9999, y: -9999 })

  // Refs for interactive params (no emitter rebuild on change)
  const linesEnabledRef  = useRef(false)
  const lineDistanceRef  = useRef(100)
  const lineColorRef     = useRef(0xffffff)
  const lineOpacityRef   = useRef(0.4)
  const lineWidthRef     = useRef(1)
  const mouseModeRef     = useRef<'none' | 'repulse' | 'attract'>('none')
  const mouseRadiusRef   = useRef(120)
  const mouseStrengthRef = useRef(60)
  const mouseClickRef    = useRef(false)

  const [playing, setPlaying]       = useState(false)
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [exporting, setExporting]   = useState(false)
  const [showCode, setShowCode]     = useState(false)
  const [codeText, setCodeText]     = useState('')
  const [copied, setCopied]         = useState(false)

  const imageUrl = useStore((s) => s.particleImageDataUrl)
  const frames   = useStore((s) => s.particleFrames)
  const presetId = useStore((s) => s.selectedParticlePresetId)
  const params   = useStore((s) => s.particleParams)

  // Sync loop ref
  useEffect(() => { loopRef.current = loopEnabled }, [loopEnabled])

  // Sync container position (no rebuild)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.x = W / 2 + (params.emitX ?? 0)
      containerRef.current.y = H / 2 + (params.emitY ?? 0)
    }
  }, [params.emitX, params.emitY])

  // Sync interactive param refs (no emitter rebuild)
  useEffect(() => {
    linesEnabledRef.current  = params.linesEnabled  ?? false
    lineDistanceRef.current  = params.lineDistance   ?? 100
    lineColorRef.current     = parseInt(params.lineColor ?? 'ffffff', 16)
    lineOpacityRef.current   = params.lineOpacity    ?? 0.4
    lineWidthRef.current     = params.lineWidth      ?? 1
    mouseModeRef.current     = params.mouseMode      ?? 'none'
    mouseRadiusRef.current   = params.mouseRadius    ?? 120
    mouseStrengthRef.current = params.mouseStrength  ?? 60
    mouseClickRef.current    = params.mouseClick     ?? false
  }, [params.linesEnabled, params.lineDistance, params.lineColor, params.lineOpacity,
      params.lineWidth, params.mouseMode, params.mouseRadius, params.mouseStrength, params.mouseClick])

  // Init Pixi once
  useEffect(() => {
    if (!canvasRef.current) return
    const app = new PIXI.Application({
      view: canvasRef.current,
      width: W, height: H,
      backgroundColor: 0x1e1e36,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })
    appRef.current = app

    const graphics = new PIXI.Graphics()
    app.stage.addChildAt(graphics, 0)
    graphicsRef.current = graphics

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rebuildEmitter = useCallback(() => {
    const app = appRef.current
    const container = containerRef.current
    if (!app || !container || frames.length === 0 || !presetId) return

    if (emitterRef.current) { emitterRef.current.destroy(); emitterRef.current = null }
    if (tickerRef.current)  { app.ticker.remove(tickerRef.current); tickerRef.current = null }
    container.removeChildren()
    graphicsRef.current?.clear()

    const textures = frames.map((url) => PIXI.Texture.from(url))
    const config = buildEmitterConfig(presetId, params, textures)
    if (!config) return

    const emitter = new Emitter(container, config)
    emitter.emit = true
    emitterRef.current = emitter
    lastTimeRef.current = performance.now()

    const preset = PARTICLE_PRESETS.find((p) => p.id === presetId)
    const isOneShot = !preset?.looping
    const restartAfter = params.lifetime * 1.3 + 0.15
    let elapsed = 0

    const tick = () => {
      const now = performance.now()
      const dt = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now
      emitter.update(dt)
      elapsed += dt

      // Mouse interaction
      const mode = mouseModeRef.current
      if (mode !== 'none') {
        const mx = mouseRef.current.x - container.x
        const my = mouseRef.current.y - container.y
        const radius = mouseRadiusRef.current
        const strength = mouseStrengthRef.current
        const dir = mode === 'repulse' ? 1 : -1
        container.children.forEach((sprite) => {
          const s = sprite as PIXI.Sprite
          const dx = s.x - mx, dy = s.y - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < radius && dist > 0) {
            const force = ((radius - dist) / radius) * strength * dt
            s.x += (dx / dist) * force * dir
            s.y += (dy / dist) * force * dir
          }
        })
      }

      // Line connections
      const g = graphicsRef.current
      if (g && linesEnabledRef.current) {
        g.clear()
        const sprites = container.children
        const maxDist = lineDistanceRef.current
        const color = lineColorRef.current
        const maxAlpha = lineOpacityRef.current
        const lw = lineWidthRef.current
        for (let i = 0; i < sprites.length; i++) {
          for (let j = i + 1; j < sprites.length; j++) {
            const a = sprites[i] as PIXI.Sprite
            const b = sprites[j] as PIXI.Sprite
            const wx1 = container.x + a.x, wy1 = container.y + a.y
            const wx2 = container.x + b.x, wy2 = container.y + b.y
            const dx = wx1 - wx2, dy = wy1 - wy2
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < maxDist) {
              g.lineStyle(lw, color, (1 - dist / maxDist) * maxAlpha)
              g.moveTo(wx1, wy1)
              g.lineTo(wx2, wy2)
            }
          }
        }
      } else {
        g?.clear()
      }

      if (loopRef.current && isOneShot && elapsed >= restartAfter) {
        rebuildRef.current()
      }
    }

    tickerRef.current = tick
    app.ticker.add(tick)
    setPlaying(true)
  }, [frames, presetId,
    params.count, params.speed, params.lifetime, params.size, params.spread,
    params.sizeEnd, params.alphaStart, params.alphaEnd, params.gravity, params.spinSpeed,
    params.tintStart, params.tintEnd, params.blendMode, params.emitRadius])

  rebuildRef.current = rebuildEmitter

  useEffect(() => { rebuildEmitter() }, [rebuildEmitter])

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    mouseRef.current = {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top)  * (H / rect.height),
    }
  }

  function handleMouseLeave() {
    mouseRef.current = { x: -9999, y: -9999 }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!mouseClickRef.current || !appRef.current || frames.length === 0) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = (e.clientX - rect.left) * (W / rect.width)
    const cy = (e.clientY - rect.top)  * (H / rect.height)

    const burstContainer = new PIXI.Container()
    burstContainer.x = cx
    burstContainer.y = cy
    appRef.current.stage.addChild(burstContainer)

    const textures = frames.map((url) => PIXI.Texture.from(url))
    const burstConfig = buildClickBurst(textures, params)
    const burst = new Emitter(burstContainer, burstConfig)
    burst.emit = true

    const start = performance.now()
    const burstTick = () => {
      const dt = (performance.now() - start) / 1000
      burst.update(dt / 60)
    }
    appRef.current.ticker.add(burstTick)
    setTimeout(() => {
      appRef.current?.ticker.remove(burstTick)
      burst.destroy()
      appRef.current?.stage.removeChild(burstContainer)
    }, (params.lifetime * 0.5 + 0.3) * 1000)
  }

  function handlePlayPause() {
    const emitter = emitterRef.current
    if (!emitter) return
    if (playing) { emitter.emit = false; setPlaying(false) }
    else         { emitter.emit = true;  setPlaying(true)  }
  }

  function handleLoop() {
    const next = !loopEnabled
    setLoopEnabled(next)
    if (next) {
      const preset = PARTICLE_PRESETS.find((p) => p.id === presetId)
      if (!preset?.looping) rebuildEmitter()
    }
  }

  function handleExportCode() {
    if (!presetId) return
    const code = exportVueComponent(presetId, params)
    setCodeText(code)
    setShowCode(true)
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
        <canvas
          ref={canvasRef}
          className="w-full aspect-square block cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
        />
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
        <button disabled={!canExport} onClick={handlePlayPause}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-30 hover:bg-accent-hover transition-colors">
          {playing ? 'Pause' : 'Play'}
        </button>
        <button disabled={!canExport} onClick={() => rebuildEmitter()}
          className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-gray-400 text-sm hover:text-white disabled:opacity-30 transition-colors">
          Replay
        </button>
        <button disabled={!canExport} onClick={handleLoop}
          className={`px-3 py-2 rounded-lg border text-sm transition-colors disabled:opacity-30 ${loopEnabled ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-surface-2 text-gray-400 hover:text-white'}`}>
          Loop
        </button>
      </div>

      {/* Export */}
      <div className="border-t border-border pt-4 space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-widest">Export</p>
        <div className="flex gap-2">
          <button disabled={!canExport || exporting} onClick={handleExportGif}
            className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-30 hover:bg-accent-hover transition-colors">
            {exporting ? 'Capturing...' : 'GIF'}
          </button>
          <button disabled={!canExport} onClick={() => {
            if (!canvasRef.current) return
            const a = document.createElement('a')
            a.href = canvasRef.current.toDataURL('image/png')
            a.download = `${presetId}_frame.png`; a.click()
          }} className="px-4 py-2.5 rounded-xl border border-border bg-surface-2 text-gray-400 text-sm hover:text-white disabled:opacity-30 transition-colors">
            PNG
          </button>
          <button disabled={!canExport} onClick={handleExportCode}
            className="px-4 py-2.5 rounded-xl border border-border bg-surface-2 text-gray-400 text-sm hover:text-white disabled:opacity-30 transition-colors">
            {'</>'}
          </button>
        </div>
        <p className="text-xs text-gray-600">GIF loops everywhere · &lt;/&gt; exports Vue component</p>
      </div>

      {/* Code export modal */}
      {showCode && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setShowCode(false)}>
          <div className="bg-surface-1 border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-sm font-semibold text-white">Vue Component</p>
              <div className="flex gap-2">
                <button onClick={() => {
                  navigator.clipboard.writeText(codeText)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }} className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors">
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => setShowCode(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-5 text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">
              {codeText}
            </pre>
            <div className="px-5 py-3 border-t border-border">
              <p className="text-xs text-gray-600">Replace <code className="text-gray-400">YOUR_TEXTURE.png</code> with your asset path. Requires <code className="text-gray-400">pixi.js</code> + <code className="text-gray-400">@pixi/particle-emitter</code>.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
