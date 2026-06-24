import { useRef, Component } from 'react'
import type { ReactNode } from 'react'
import { useStore } from './store/useStore'
import { ModeSelector } from './components/ModeSelector'
import { TemplatePicker } from './components/create/TemplatePicker'
import { ImageUploadSlots } from './components/create/ImageUploadSlots'
import { AnimationControls } from './components/create/AnimationControls'
import { PreviewCanvas } from './components/shared/PreviewCanvas'
import { ExportPanel } from './components/shared/ExportPanel'
import { SpineUploader } from './components/replace/SpineUploader'
import { SlotGrid } from './components/replace/SlotGrid'
import { ParticleControls } from './components/particle/ParticleControls'
import { ParticleCanvas } from './components/particle/ParticleCanvas'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-8">
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-6 max-w-lg text-center">
            <p className="text-red-400 font-semibold mb-2">Something went wrong</p>
            <p className="text-gray-400 text-sm">{this.state.error}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const mode = useStore((s) => s.mode)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-surface text-white flex flex-col">
        {/* Header */}
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Spine Animator</h1>
            <p className="text-xs text-gray-600 mt-0.5">Create basic animations for game UI</p>
          </div>
          {/* <ModeSelector /> — hidden, particle FX only for now */}
        </header>

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — controls */}
          <div className="w-96 border-r border-border overflow-y-auto p-5 space-y-6 shrink-0">
            {mode === 'create' && <CreatePanel />}
            {mode === 'replace' && <ReplacePanel />}
            {mode === 'particle' && <ParticleControls />}
          </div>

          {/* Right panel — preview */}
          <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
            <div className="max-w-xl mx-auto w-full space-y-5">
              {mode === 'particle' ? (
                <ParticleCanvas />
              ) : (
                <>
                  <PreviewCanvas />
                  <ExportPanel canvasRef={canvasRef} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

function CreatePanel() {
  return (
    <>
      <TemplatePicker />
      <ImageUploadSlots />
      <AnimationControls />
    </>
  )
}

function ReplacePanel() {
  return (
    <>
      <SpineUploader />
      <SlotGrid />
    </>
  )
}
