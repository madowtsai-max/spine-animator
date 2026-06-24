import type { AnimationTemplate } from '../../../types'

export const float: AnimationTemplate = {
  id: 'single-float',
  name: 'Float',
  description: 'Gentle idle bob — idle state icons, decorations',
  category: 'single',
  slotCount: 1,
  slotLabels: ['Image'],
  duration: 1.6,
  defaultLoop: true,
  animations: [
    {
      slotIndex: 0,
      keyframes: [
        { time: 0.0,  easing: 'easeInOut', props: { y: 0 } },
        { time: 0.8,  easing: 'easeInOut', props: { y: -14 } },
        { time: 1.6,  easing: 'easeInOut', props: { y: 0 } },
      ],
    },
  ],
}
