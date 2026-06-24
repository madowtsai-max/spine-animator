import type { AnimationTemplate } from '../../../types'

export const bounceWithShadow: AnimationTemplate = {
  id: 'iconeffect-bounce-shadow',
  name: 'Bounce + Shadow',
  description: 'Icon bounces up while shadow squishes below it',
  category: 'iconEffect',
  slotCount: 2,
  slotLabels: ['Icon', 'Shadow / Base'],
  duration: 1.0,
  defaultLoop: true,
  animations: [
    {
      slotIndex: 0,
      keyframes: [
        { time: 0.0,  easing: 'easeIn',  props: { y: 0 } },
        { time: 0.35, easing: 'easeOut', props: { y: -40 } },
        { time: 0.7,  easing: 'easeIn',  props: { y: 0 } },
        { time: 0.85, easing: 'easeOut', props: { y: -12 } },
        { time: 1.0,  easing: 'easeOut', props: { y: 0 } },
      ],
    },
    {
      slotIndex: 1,
      keyframes: [
        { time: 0.0,  easing: 'easeIn',  props: { scaleX: 1.0, scaleY: 1.0, alpha: 0.6 } },
        { time: 0.35, easing: 'easeOut', props: { scaleX: 0.5, scaleY: 0.5, alpha: 0.2 } },
        { time: 0.7,  easing: 'easeIn',  props: { scaleX: 1.0, scaleY: 1.0, alpha: 0.6 } },
        { time: 0.85, easing: 'easeOut', props: { scaleX: 0.75, scaleY: 0.75, alpha: 0.4 } },
        { time: 1.0,  easing: 'easeOut', props: { scaleX: 1.0, scaleY: 1.0, alpha: 0.6 } },
      ],
    },
  ],
}
