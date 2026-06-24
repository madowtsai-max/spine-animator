import type { AtlasRegion, SlotImage } from '../types'

export async function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

export function extractRegion(source: HTMLImageElement | HTMLCanvasElement, region: AtlasRegion): HTMLCanvasElement {
  const { bounds, offsets, rotate, originalW, originalH } = region
  const { x: bx, y: by, w: bw, h: bh } = bounds

  const out = document.createElement('canvas')
  out.width = originalW
  out.height = originalH
  const ctx = out.getContext('2d')!

  const ox = offsets?.x ?? 0
  const oy = offsets?.y ?? 0

  if (rotate) {
    // Stored 90° clockwise in atlas — draw un-rotated
    ctx.save()
    ctx.translate(ox + bh / 2, oy + bw / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.drawImage(source, bx, by, bw, bh, -bw / 2, -bh / 2, bw, bh)
    ctx.restore()
  } else {
    ctx.drawImage(source, bx, by, bw, bh, ox, oy, bw, bh)
  }

  return out
}

export async function extractAllSlotImages(
  textureDataUrl: string,
  regions: AtlasRegion[]
): Promise<SlotImage[]> {
  const img = await loadImageFromDataUrl(textureDataUrl)

  const atlasCanvas = document.createElement('canvas')
  atlasCanvas.width = img.naturalWidth
  atlasCanvas.height = img.naturalHeight
  atlasCanvas.getContext('2d')!.drawImage(img, 0, 0)

  return regions.map((region) => {
    const regionCanvas = extractRegion(atlasCanvas, region)
    return {
      name: region.name,
      dataUrl: regionCanvas.toDataURL('image/png'),
      originalW: region.originalW,
      originalH: region.originalH,
    }
  })
}
