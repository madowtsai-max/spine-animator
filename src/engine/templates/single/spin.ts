import type { AnimationTemplate } from '../../../types'

export const spin: AnimationTemplate = {
  id: 'single-spin',
  name: 'Spin',
  description: 'Full 360° rotation loop — loading spinner, coin flip',
  category: 'single',
  slotCount: 1,
  slotLabels: ['Image'],
  duration: 0.8,
  defaultLoop: true,
  animations: [
    {
      slotIndex: 0,
      keyframes: [
        { time: 0.0, easing: 'linear', props: { rotation: 0 } },
        { time: 0.8, easing: 'linear', props: { rotation: 360 } },
      ],
    },
  ],
}
