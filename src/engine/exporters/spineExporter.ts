import JSZip from 'jszip'
import type { AnimationTemplate, AnimationSettings, SlotImage } from '../../types'

// Simple shelf atlas packer
interface PackedRegion {
  name: string
  x: number
  y: number
  w: number
  h: number
  dataUrl: string
}

function packImages(images: { name: string; w: number; h: number; dataUrl: string }[]): {
  packed: PackedRegion[]
  atlasW: number
  atlasH: number
} {
  const PAD = 2
  const MAX_W = 2048
  let x = PAD, y = PAD, rowH = 0, atlasW = PAD, atlasH = PAD

  const packed: PackedRegion[] = []
  for (const img of images) {
    if (x + img.w + PAD > MAX_W) {
      x = PAD
      y += rowH + PAD
      rowH = 0
    }
    packed.push({ name: img.name, x, y, w: img.w, h: img.h, dataUrl: img.dataUrl })
    atlasW = Math.max(atlasW, x + img.w + PAD)
    atlasH = Math.max(atlasH, y + img.h + PAD)
    rowH = Math.max(rowH, img.h)
    x += img.w + PAD
  }

  // Round up to next power-of-two for GPU friendliness
  atlasW = nextPow2(atlasW)
  atlasH = nextPow2(atlasH)
  return { packed, atlasW, atlasH }
}

function nextPow2(n: number): number {
  let p = 1
  while (p < n) p <<= 1
  return p
}

async function renderAtlasCanvas(packed: PackedRegion[], w: number, h: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  for (const r of packed) {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = r.dataUrl
    })
    ctx.drawImage(img, r.x, r.y)
  }

  return canvas
}

function buildAtlasText(textureName: string, packed: PackedRegion[], atlasW: number, atlasH: number): string {
  let out = `${textureName}\nsize:${atlasW},${atlasH}\nfilter:Linear,Linear\n`
  for (const r of packed) {
    out += `${r.name}\nbounds:${r.x},${r.y},${r.w},${r.h}\n`
  }
  return out
}

// Build Spine 4.x JSON for template-based create mode
function buildSpineJson(
  template: AnimationTemplate,
  images: { name: string; w: number; h: number }[],
  settings: AnimationSettings
): object {
  const W = 512, H = 512

  const bones = [{ name: 'root' }]
  const slots = images.map((img, i) => ({
    name: `slot_${i}`,
    bone: 'root',
    attachment: img.name,
  }))

  const skins = [
    {
      name: 'default',
      attachments: Object.fromEntries(
        images.map((img, i) => [
          `slot_${i}`,
          {
            [img.name]: { x: 0, y: 0, width: img.w, height: img.h },
          },
        ])
      ),
    },
  ]

  // Build animation keyframes per slot
  const boneTimelines: Record<string, Record<string, unknown[]>> = {}

  for (const slotAnim of template.animations) {
    const img = images[slotAnim.slotIndex]
    if (!img) continue
    const boneName = `root`
    // Use slot-specific pseudo-bone name to drive per-slot transforms
    // In practice: single-bone root drives all. For multi-slot, embed offsets.
    // We'll write to "slots" timeline instead of bones for alpha, bones for transforms.
    if (!boneTimelines[`slot_${slotAnim.slotIndex}`]) {
      boneTimelines[`slot_${slotAnim.slotIndex}`] = {}
    }
    void boneName // suppress lint
  }

  // Build per-slot bone structure for multi-slot
  const allBones = images.length > 1
    ? [
        { name: 'root' },
        ...images.map((_, i) => ({ name: `bone_slot_${i}`, parent: 'root' })),
      ]
    : [{ name: 'root' }]

  const allSlots = images.map((img, i) => ({
    name: `slot_${i}`,
    bone: images.length > 1 ? `bone_slot_${i}` : 'root',
    attachment: img.name,
  }))

  const animBones: Record<string, { translate?: unknown[]; scale?: unknown[]; rotate?: unknown[] }> = {}

  for (const slotAnim of template.animations) {
    const boneName = images.length > 1 ? `bone_slot_${slotAnim.slotIndex}` : 'root'
    if (!animBones[boneName]) animBones[boneName] = {}

    const translateKFs: { time: number; x: number; y: number; curve?: string }[] = []
    const scaleKFs: { time: number; x: number; y: number; curve?: string }[] = []
    const rotateKFs: { time: number; value: number; curve?: string }[] = []

    for (const kf of slotAnim.keyframes) {
      const { time, props, easing } = kf
      const curve = easing === 'linear' ? undefined : easing

      if (props.x !== undefined || props.y !== undefined) {
        translateKFs.push({ time, x: (props.x ?? 0) * settings.intensity, y: -(props.y ?? 0) * settings.intensity, ...(curve ? { curve } : {}) })
      }
      if (props.scaleX !== undefined || props.scaleY !== undefined) {
        scaleKFs.push({ time, x: props.scaleX ?? 1, y: props.scaleY ?? 1, ...(curve ? { curve } : {}) })
      }
      if (props.rotation !== undefined) {
        rotateKFs.push({ time, value: props.rotation * settings.intensity, ...(curve ? { curve } : {}) })
      }
    }

    if (translateKFs.length) animBones[boneName].translate = translateKFs
    if (scaleKFs.length) animBones[boneName].scale = scaleKFs
    if (rotateKFs.length) animBones[boneName].rotate = rotateKFs
  }

  // Alpha handled via slot color timeline
  const animSlots: Record<string, { attachment?: unknown[]; color?: unknown[] }> = {}
  for (const slotAnim of template.animations) {
    const alphaKFs = slotAnim.keyframes.filter((k) => k.props.alpha !== undefined)
    if (alphaKFs.length) {
      animSlots[`slot_${slotAnim.slotIndex}`] = {
        color: alphaKFs.map((k) => {
          const a = Math.round((k.props.alpha ?? 1) * 255).toString(16).padStart(2, '0')
          return { time: k.time, color: `ffffffff`.slice(0, 6) + a + 'ff' }
        }),
      }
    }
  }

  return {
    skeleton: {
      hash: Date.now().toString(36),
      spine: '4.2.43',
      x: -W / 2,
      y: -H / 2,
      width: W,
      height: H,
      images: './images/',
      audio: './audio',
    },
    bones: allBones,
    slots: allSlots,
    skins,
    animations: {
      [template.id]: {
        ...(Object.keys(animBones).length ? { bones: animBones } : {}),
        ...(Object.keys(animSlots).length ? { slots: animSlots } : {}),
      },
    },
  }
}

export async function exportSpineCreate(
  template: AnimationTemplate,
  uploadedImages: (string | null)[],
  settings: AnimationSettings,
  projectName = 'animation'
): Promise<void> {
  const validImages = uploadedImages
    .slice(0, template.slotCount)
    .map((url, i) => ({ url, name: template.slotLabels[i].replace(/\s+/g, '_').replace(/[^\w]/g, '') || `slot_${i}` }))
    .filter((x) => x.url !== null) as { url: string; name: string }[]

  if (validImages.length === 0) return

  // Get image dimensions
  const imageMeta = await Promise.all(
    validImages.map(
      (img) =>
        new Promise<{ name: string; w: number; h: number; dataUrl: string }>((resolve) => {
          const el = new Image()
          el.onload = () => resolve({ name: img.name, w: el.naturalWidth, h: el.naturalHeight, dataUrl: img.url })
          el.src = img.url
        })
    )
  )

  const { packed, atlasW, atlasH } = packImages(imageMeta)
  const atlasCanvas = await renderAtlasCanvas(packed, atlasW, atlasH)
  const atlasWebp = atlasCanvas.toDataURL('image/webp', 0.95)
  const atlasText = buildAtlasText(`${projectName}.webp`, packed, atlasW, atlasH)
  const spineJson = buildSpineJson(template, imageMeta, settings)

  const zip = new JSZip()
  zip.file(`${projectName}.json`, JSON.stringify(spineJson, null, 2))
  zip.file(`${projectName}.atlas`, atlasText)

  const webpBase64 = atlasWebp.split(',')[1]
  zip.file(`${projectName}.webp`, webpBase64, { base64: true })

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, `${projectName}_spine.zip`)
}

// Replace mode: swap images in existing Spine bundle and re-export
export async function exportSpineReplace(
  originalSpineJson: Record<string, unknown>,
  slotImages: SlotImage[],
  projectName = 'animation'
): Promise<void> {
  const imagesToPack = slotImages.map((slot) => ({
    name: slot.name,
    dataUrl: slot.replacementDataUrl ?? slot.dataUrl,
    w: slot.originalW,
    h: slot.originalH,
  }))

  // Re-measure dimensions for replacements
  const imageMeta = await Promise.all(
    imagesToPack.map(
      (img) =>
        new Promise<{ name: string; w: number; h: number; dataUrl: string }>((resolve) => {
          const el = new Image()
          el.onload = () => resolve({ name: img.name, w: el.naturalWidth, h: el.naturalHeight, dataUrl: img.dataUrl })
          el.src = img.dataUrl
        })
    )
  )

  const { packed, atlasW, atlasH } = packImages(imageMeta)
  const atlasCanvas = await renderAtlasCanvas(packed, atlasW, atlasH)
  const atlasWebp = atlasCanvas.toDataURL('image/webp', 0.95)
  const atlasText = buildAtlasText(`${projectName}.webp`, packed, atlasW, atlasH)

  const zip = new JSZip()
  zip.file(`${projectName}.json`, JSON.stringify(originalSpineJson, null, 2))
  zip.file(`${projectName}.atlas`, atlasText)

  const webpBase64 = atlasWebp.split(',')[1]
  zip.file(`${projectName}.webp`, webpBase64, { base64: true })

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, `${projectName}_replaced.zip`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
