import type { AnimationTemplate } from '../../../types'

export const boardSlideThenText: AnimationTemplate = {
  id: 'textboard-slide-then-text',
  name: 'Slide In + Text Pop',
  description: 'Board slides in from left, then text pops up on top',
  category: 'textBoard',
  slotCount: 2,
  slotLabels: ['Board / Background', 'Text / Label'],
  duration: 0.8,
  defaultLoop: false,
  animations: [
    {
      slotIndex: 0,
      keyframes: [
        { time: 0.0,  easing: 'easeOut', props: { x: -320, alpha: 1 } },
        { time: 0.35, easing: 'easeOut', props: { x: 10,   alpha: 1 } },
        { time: 0.45, easing: 'easeOut', props: { x: 0,    alpha: 1 } },
      ],
    },
    {
      slotIndex: 1,
      keyframes: [
        { time: 0.0,  easing: 'linear',  props: { scaleX: 0, scaleY: 0, alpha: 0 } },
        { time: 0.35, easing: 'linear',  props: { scaleX: 0, scaleY: 0, alpha: 0 } },
        { time: 0.55, easing: 'easeOut', props: { scaleX: 1.2, scaleY: 1.2, alpha: 1 } },
        { time: 0.8,  easing: 'easeOut', props: { scaleX: 1.0, scaleY: 1.0, alpha: 1 } },
      ],
    },
  ],
}
