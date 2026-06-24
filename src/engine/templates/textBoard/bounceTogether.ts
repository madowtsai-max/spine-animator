import type { AnimationTemplate } from '../../../types'

export const bounceTogether: AnimationTemplate = {
  id: 'textboard-bounce-together',
  name: 'Bounce Together',
  description: 'Board and text drop in together with bounce settle',
  category: 'textBoard',
  slotCount: 2,
  slotLabels: ['Board / Background', 'Text / Label'],
  duration: 0.7,
  defaultLoop: false,
  animations: [
    {
      slotIndex: 0,
      keyframes: [
        { time: 0.0,  easing: 'easeOut', props: { y: -200, scaleX: 0.8, scaleY: 0.8, alpha: 0 } },
        { time: 0.35, easing: 'easeOut', props: { y: 12,   scaleX: 1.0, scaleY: 1.0, alpha: 1 } },
        { time: 0.5,  easing: 'easeOut', props: { y: -5,   scaleX: 1.0, scaleY: 1.0, alpha: 1 } },
        { time: 0.7,  easing: 'easeOut', props: { y: 0,    scaleX: 1.0, scaleY: 1.0, alpha: 1 } },
      ],
    },
    {
      slotIndex: 1,
      keyframes: [
        { time: 0.0,  easing: 'easeOut', props: { y: -200, scaleX: 0.8, scaleY: 0.8, alpha: 0 } },
        { time: 0.4,  easing: 'easeOut', props: { y: 12,   scaleX: 1.0, scaleY: 1.0, alpha: 1 } },
        { time: 0.55, easing: 'easeOut', props: { y: -5,   scaleX: 1.0, scaleY: 1.0, alpha: 1 } },
        { time: 0.7,  easing: 'easeOut', props: { y: 0,    scaleX: 1.0, scaleY: 1.0, alpha: 1 } },
      ],
    },
  ],
}
