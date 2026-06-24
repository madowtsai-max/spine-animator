import type { AnimationTemplate, AnimationSettings } from '../../types'

const LOTTIE_FPS = 30

function easingToBezier(easing: string): number[] {
  switch (easing) {
    case 'easeIn':    return [0.42, 0, 1, 1]
    case 'easeOut':   return [0, 0, 0.58, 1]
    case 'easeInOut': return [0.42, 0, 0.58, 1]
    default:          return [0, 0, 1, 1] // linear
  }
}

export async function exportLottie(
  template: AnimationTemplate,
  uploadedImages: (string | null)[],
  settings: AnimationSettings,
  projectName = 'animation'
): Promise<void> {
  const W = 512, H = 512
  const totalFrames = Math.round(template.duration * LOTTIE_FPS / settings.speed)

  const assets: unknown[] = []
  const layers: unknown[] = []

  for (let slotIdx = 0; slotIdx < template.slotCount; slotIdx++) {
    const imgUrl = uploadedImages[slotIdx]
    if (!imgUrl) continue

    const assetId = `img_${slotIdx}`
    assets.push({ id: assetId, u: '', p: imgUrl, e: 1 })

    const slotAnim = template.animations.find((a) => a.slotIndex === slotIdx)

    const buildKFs = (
      extract: (props: { scaleX?: number; scaleY?: number; x?: number; y?: number; rotation?: number; alpha?: number }) => number[]
    ) => {
      if (!slotAnim) return [{ t: 0, s: extract({}), h: 1 }]
      return slotAnim.keyframes.map((kf, i) => {
        const next = slotAnim.keyframes[i + 1]
        const [ox, oy, ix, iy] = easingToBezier(next?.easing ?? 'linear')
        return {
          t: Math.round(kf.time * LOTTIE_FPS),
          s: extract(kf.props),
          o: { x: ox, y: oy },
          i: { x: ix, y: iy },
        }
      })
    }

    const posKFs = buildKFs((p) => [W / 2 + (p.x ?? 0) * settings.intensity, H / 2 + (p.y ?? 0) * settings.intensity, 0])
    const scaleKFs = buildKFs((p) => [
      (1 + ((p.scaleX ?? 1) - 1) * settings.intensity) * 100,
      (1 + ((p.scaleY ?? 1) - 1) * settings.intensity) * 100,
      100,
    ])
    const rotKFs = buildKFs((p) => [(p.rotation ?? 0) * settings.intensity])
    const alphaKFs = buildKFs((p) => [(p.alpha ?? 1) * 100])

    layers.push({
      ddd: 0,
      ind: slotIdx + 1,
      ty: 2,
      nm: template.slotLabels[slotIdx] ?? `slot_${slotIdx}`,
      refId: assetId,
      ks: {
        p: { a: 1, k: posKFs },
        s: { a: 1, k: scaleKFs },
        r: { a: 1, k: rotKFs },
        o: { a: 1, k: alphaKFs },
        a: { a: 0, k: [0, 0, 0] },
      },
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    })
  }

  const lottie = {
    v: '5.12.1',
    fr: LOTTIE_FPS,
    ip: 0,
    op: totalFrames,
    w: W,
    h: H,
    nm: projectName,
    ddd: 0,
    assets,
    layers,
  }

  const json = JSON.stringify(lottie, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName}.json`
  a.click()
  URL.revokeObjectURL(url)
}
