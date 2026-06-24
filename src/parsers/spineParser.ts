import type { ParsedSpine, SpineSlot, SpineBone } from '../types'

export function parseSpineJson(jsonText: string): ParsedSpine {
  const raw = JSON.parse(jsonText) as Record<string, unknown>

  const slotsRaw = (raw.slots as Record<string, unknown>[] | undefined) ?? []
  const bonesRaw = (raw.bones as Record<string, unknown>[] | undefined) ?? []
  const animsRaw = (raw.animations as Record<string, unknown> | undefined) ?? {}

  const slots: SpineSlot[] = slotsRaw.map((s) => ({
    name: s.name as string,
    bone: s.bone as string,
    attachment: s.attachment as string | undefined,
  }))

  const bones: SpineBone[] = bonesRaw.map((b) => ({
    name: b.name as string,
    parent: b.parent as string | undefined,
    x: b.x as number | undefined,
    y: b.y as number | undefined,
    rotation: b.rotation as number | undefined,
  }))

  return {
    raw,
    slots,
    bones,
    animationNames: Object.keys(animsRaw),
  }
}
