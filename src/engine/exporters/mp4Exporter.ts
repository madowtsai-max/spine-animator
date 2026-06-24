import type { AnimationRenderer } from '../renderer'
import type { AnimationTemplate, AnimationSettings } from '../../types'

export async function exportMp4(
  renderer: AnimationRenderer,
  template: AnimationTemplate,
  settings: AnimationSettings,
  canvas: HTMLCanvasElement,
  fps = 30,
  projectName = 'animation'
): Promise<void> {
  const stream = canvas.captureStream(fps)
  const chunks: Blob[] = []

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm'

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 })
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  const durationMs = (template.duration / settings.speed) * 1000
  const loopCount = settings.loop ? 2 : 1

  recorder.start()
  renderer.play()

  await new Promise<void>((resolve) => {
    setTimeout(() => {
      recorder.stop()
      stream.getTracks().forEach((t) => t.stop())
      resolve()
    }, durationMs * loopCount + 200)
  })

  await new Promise<void>((resolve) => { recorder.onstop = () => resolve() })

  const blob = new Blob(chunks, { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName}.webm`
  a.click()
  URL.revokeObjectURL(url)
}
