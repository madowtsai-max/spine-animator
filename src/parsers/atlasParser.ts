import type { ParsedAtlas, AtlasRegion } from '../types'

export function parseAtlas(text: string): ParsedAtlas {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  let i = 0

  const textureName = lines[i++]
  const size = parseKV(lines[i++], 'size')
  const [tw, th] = size.split(',').map(Number)

  // skip filter line
  while (i < lines.length && lines[i].startsWith('filter:')) i++

  const regions: AtlasRegion[] = []

  while (i < lines.length) {
    const name = lines[i++]
    if (!name || name.includes(':')) { i--; break }

    let bounds = { x: 0, y: 0, w: 0, h: 0 }
    let offsets: { x: number; y: number; w: number; h: number } | undefined
    let rotate = false
    let originalW = 0
    let originalH = 0

    while (i < lines.length && lines[i].includes(':')) {
      const line = lines[i++]
      const colonIdx = line.indexOf(':')
      const key = line.slice(0, colonIdx).trim()
      const val = line.slice(colonIdx + 1).trim()

      if (key === 'bounds') {
        const [x, y, w, h] = val.split(',').map(Number)
        bounds = { x, y, w, h }
      } else if (key === 'offsets') {
        const [ox, oy, ow, oh] = val.split(',').map(Number)
        offsets = { x: ox, y: oy, w: ow, h: oh }
      } else if (key === 'rotate') {
        rotate = val === 'true' || val === '90'
      }
    }

    if (rotate) {
      originalW = offsets?.w ?? bounds.h
      originalH = offsets?.h ?? bounds.w
    } else {
      originalW = offsets?.w ?? bounds.w
      originalH = offsets?.h ?? bounds.h
    }

    regions.push({ name, bounds, offsets, rotate, originalW, originalH })
  }

  return { textureName, textureSize: { w: tw, h: th }, regions }
}

function parseKV(line: string, key: string): string {
  const parts = line.split(':')
  if (parts[0].trim() !== key) return ''
  return parts.slice(1).join(':').trim()
}
