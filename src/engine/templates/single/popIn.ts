import type { AnimationTemplate } from '../../../types'

export const popIn: AnimationTemplate = {
  id: 'single-pop-in',
  name: 'Pop In',
  description: 'Scales up with a bounce settle — great for reward icons',
  category: 'single',
  slotCount: 1,
  slotLabels: ['Image'],
  duration: 0.6,
  defaultLoop: false,
  animations: [
    {
      slotIndex: 0,
      keyframes: [
        { time: 0.0, easing: 'linear',   props: { scaleX: 0,   scaleY: 0,   alpha: 0 } },
        { time: 0.1, easing: 'easeOut',  props: { scaleX: 0,   scaleY: 0,   alpha: 1 } },
        { time: 0.3, easing: 'easeOut',  props: { scaleX: 1.3, scaleY: 1.3, alpha: 1 } },
        { time: 0.45, easing: 'easeOut', props: { scaleX: 0.9, scaleY: 0.9, alpha: 1 } },
        { time: 0.6, easing: 'easeOut',  props: { scaleX: 1.0, scaleY: 1.0, alpha: 1 } },
      ],
    },
  ],
}
