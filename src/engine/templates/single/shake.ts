import type { AnimationTemplate } from '../../../types'

export const shake: AnimationTemplate = {
  id: 'single-shake',
  name: 'Shake',
  description: 'Horizontal shake — warning or error feedback',
  category: 'single',
  slotCount: 1,
  slotLabels: ['Image'],
  duration: 0.5,
  defaultLoop: false,
  animations: [
    {
      slotIndex: 0,
      keyframes: [
        { time: 0.0,  easing: 'linear', props: { x: 0 } },
        { time: 0.07, easing: 'linear', props: { x: -10 } },
        { time: 0.14, easing: 'linear', props: { x: 10 } },
        { time: 0.21, easing: 'linear', props: { x: -8 } },
        { time: 0.28, easing: 'linear', props: { x: 8 } },
        { time: 0.35, easing: 'linear', props: { x: -5 } },
        { time: 0.42, easing: 'linear', props: { x: 5 } },
        { time: 0.5,  easing: 'linear', props: { x: 0 } },
      ],
    },
  ],
}
