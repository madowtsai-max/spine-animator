// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — gifenc has no type declarations
import { GIFEncoder, quantize, applyPalette } from 'gifenc'

function captureFrame(source: HTMLCanvasElement): Uint8ClampedArray {
  const tmp = document.createElement('canvas')
  tmp.width = source.width
  tmp.height = source.height
  tmp.getContext('2d')!.drawImage(source, 0, 0)
  return tmp.getContext('2d')!.getImageData(0, 0, tmp.width, tmp.height).data
}

export async function exportGif(
  canvas: HTMLCanvasElement,
  duration: number,
  fps = 24,
  loops = 0,
  projectName = 'animation'
): Promise<void> {
  const W = canvas.width
  const H = canvas.height
  const frameCount = Math.ceil(duration * fps)
  const delay = Math.round(1000 / fps)

  const encoder = GIFEncoder()
  const frames: Uint8ClampedArray[] = []

  // Capture frames over the animation duration
  let captured = 0
  await new Promise<void>((resolve) => {
    const startTime = performance.now()
    const totalMs = duration * 1000

    function tick() {
      const now = performance.now()
      const elapsed = now - startTime
      const expectedFrame = Math.floor((elapsed / totalMs) * frameCount)

      while (captured <= expectedFrame && captured < frameCount) {
        frames.push(captureFrame(canvas))
        captured++
      }

      if (captured < frameCount) {
        requestAnimationFrame(tick)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(tick)
  })

  // Encode all frames
  for (const data of frames) {
    const palette = quantize(data, 256, { format: 'rgba4444' })
    const index = applyPalette(data, palette)
    encoder.writeFrame(index, W, H, { palette, delay, repeat: loops })
  }

  encoder.finish()
  const bytes = encoder.bytesView()
  const blob = new Blob([bytes], { type: 'image/gif' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName}.gif`
  a.click()
  URL.revokeObjectURL(url)
}
