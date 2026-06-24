import type { AnimationTemplate } from '../../../types'

export const pulseRing: AnimationTemplate = {
  id: 'iconeffect-pulse-ring',
  name: 'Pulse + Ring',
  description: 'Icon pulses while a ring expands and fades behind it',
  category: 'iconEffect',
  slotCount: 2,
  slotLabels: ['Icon (front)', 'Ring / Glow (back)'],
  duration: 1.0,
  defaultLoop: true,
  animations: [
    {
      slotIndex: 1,
      keyframes: [
        { time: 0.0,  easing: 'easeOut', props: { scaleX: 0.6, scaleY: 0.6, alpha: 0.9 } },
        { time: 0.7,  easing: 'easeOut', props: { scaleX: 1.8, scaleY: 1.8, alpha: 0 } },
        { time: 1.0,  easing: 'linear',  props: { scaleX: 0.6, scaleY: 0.6, alpha: 0 } },
      ],
    },
    {
      slotIndex: 0,
      keyframes: [
        { time: 0.0,  easing: 'easeInOut', props: { scaleX: 1.0, scaleY: 1.0 } },
        { time: 0.2,  easing: 'easeInOut', props: { scaleX: 1.1, scaleY: 1.1 } },
        { time: 0.5,  easing: 'easeInOut', props: { scaleX: 0.95, scaleY: 0.95 } },
        { time: 1.0,  easing: 'easeInOut', props: { scaleX: 1.0, scaleY: 1.0 } },
      ],
    },
  ],
}
