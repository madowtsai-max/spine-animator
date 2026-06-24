import { popIn } from './single/popIn'
import { clickPulse } from './single/clickPulse'
import { float } from './single/float'
import { shake } from './single/shake'
import { spin } from './single/spin'
import { boardSlideThenText } from './textBoard/boardSlideThenText'
import { bounceTogether } from './textBoard/bounceTogether'
import { boardShake } from './textBoard/boardShake'
import { pulseRing } from './iconEffect/pulseRing'
import { bounceWithShadow } from './iconEffect/bounceWithShadow'
import type { AnimationTemplate, TemplateCategory } from '../../types'

export const ALL_TEMPLATES: AnimationTemplate[] = [
  popIn,
  clickPulse,
  float,
  shake,
  spin,
  boardSlideThenText,
  bounceTogether,
  boardShake,
  pulseRing,
  bounceWithShadow,
]

export function getTemplatesByCategory(cat: TemplateCategory): AnimationTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.category === cat)
}

export const CATEGORY_META: Record<TemplateCategory, { label: string; description: string; icon: string }> = {
  single: {
    label: 'Single Item',
    description: '1 image — icon, badge, coin, button',
    icon: '◆',
  },
  textBoard: {
    label: 'Text + Board',
    description: '2 images — background plate + text label',
    icon: '▬',
  },
  iconEffect: {
    label: 'Icon + Effect',
    description: '2 images — main icon + glow, ring, or shadow',
    icon: '✦',
  },
}
