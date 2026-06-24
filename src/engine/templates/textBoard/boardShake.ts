import type { AnimationTemplate } from '../../../types'

export const boardShake: AnimationTemplate = {
  id: 'textboard-shake',
  name: 'Board Shake',
  description: 'Board shakes while text stays locked on top',
  category: 'textBoard',
  slotCount: 2,
  slotLabels: ['Board / Background', 'Text / Label'],
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
        { time: 0.35, easing: 'linear', props: { x: -4 } },
        { time: 0.5,  easing: 'linear', props: { x: 0 } },
      ],
    },
    {
      slotIndex: 1,
      keyframes: [
        { time: 0.0,  easing: 'linear', props: { x: 0 } },
        { time: 0.07, easing: 'linear', props: { x: -10 } },
        { time: 0.14, easing: 'linear', props: { x: 10 } },
        { time: 0.21, easing: 'linear', props: { x: -8 } },
        { time: 0.28, easing: 'linear', props: { x: 8 } },
        { time: 0.35, easing: 'linear', props: { x: -4 } },
        { time: 0.5,  easing: 'linear', props: { x: 0 } },
      ],
    },
  ],
}
