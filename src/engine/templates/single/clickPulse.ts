import type { AnimationTemplate } from '../../../types'

export const clickPulse: AnimationTemplate = {
  id: 'single-click-pulse',
  name: 'Click Pulse',
  description: 'Quick scale burst on tap — button press feedback',
  category: 'single',
  slotCount: 1,
  slotLabels: ['Image'],
  duration: 0.3,
  defaultLoop: true,
  animations: [
    {
      slotIndex: 0,
      keyframes: [
        { time: 0.0,  easing: 'easeOut', props: { scaleX: 1.0, scaleY: 1.0 } },
        { time: 0.1,  easing: 'easeOut', props: { scaleX: 1.25, scaleY: 1.25 } },
        { time: 0.3,  easing: 'easeIn',  props: { scaleX: 1.0, scaleY: 1.0 } },
      ],
    },
  ],
}
