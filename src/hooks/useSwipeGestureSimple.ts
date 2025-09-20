import { useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface UseSwipeGestureProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeDown?: () => void;
  disabled?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

// Animation constants
const SWIPE_THRESHOLD = 60;
const VERTICAL_SWIPE_THRESHOLD = 45;
const VERTICAL_VELOCITY_THRESHOLD = 0.4;
const ANIMATION_DELAY = 150;
const DRAG_RESISTANCE = 0.8;
const VERTICAL_RESISTANCE = 0.3;
const PROGRESS_DIVISOR = 150;

// Animation configs
const DEFAULT_CONFIG = { tension: 300, friction: 30 };
const EXIT_CONFIG = { tension: 180, friction: 26 };

// Reset position object
const RESET_POSITION = { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 };

export const useSwipeGestureSimple = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeDown,
  disabled = false,
  isFirst = false,
  isLast = false
}: UseSwipeGestureProps) => {

  const [{ x, y, opacity, scale, rotate }, api] = useSpring(() => ({
    ...RESET_POSITION,
    config: DEFAULT_CONFIG
  }));

  // Helper functions
  const resetToCenter = () => api.start(RESET_POSITION);

  const isAtEdge = (isLeftSwipe: boolean) =>
    (isFirst && !isLeftSwipe) || (isLast && isLeftSwipe);

  const executeSwipeAnimation = (isLeftSwipe: boolean) => {
    api.start({
      x: isLeftSwipe ? -window.innerWidth : window.innerWidth,
      opacity: 0,
      scale: 0.9,
      rotate: isLeftSwipe ? -15 : 15,
      config: EXIT_CONFIG
    });

    setTimeout(() => {
      if (isLeftSwipe) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
      api.set(RESET_POSITION);
    }, ANIMATION_DELAY);
  };

  const handleVerticalSwipe = (my: number, vy: number, directionY: number) => {
    const isMovingDown = directionY > 0 || my > 0;

    const hasEnoughDistance = Math.abs(my) > VERTICAL_SWIPE_THRESHOLD;
    const hasEnoughVelocity = Math.abs(vy) > VERTICAL_VELOCITY_THRESHOLD;

    if (isMovingDown && onSwipeDown && (hasEnoughDistance || hasEnoughVelocity)) {
      onSwipeDown();
    }
    resetToCenter();
  };

  const handleDragFeedback = (mx: number, my: number) => {
    const progress = Math.min(Math.abs(mx) / PROGRESS_DIVISOR, 1);
    api.start({
      x: mx * DRAG_RESISTANCE,
      y: my * VERTICAL_RESISTANCE,
      opacity: Math.max(0.85, 1 - progress * 0.15),
      scale: Math.max(0.97, 1 - progress * 0.03),
      rotate: mx / 15,
      immediate: true
    });
  };

  const bind = useDrag(({ down, movement: [mx, my], velocity: [, vy], direction: [, dy] }) => {
    if (disabled) return;

    if (!down) {
      const absX = Math.abs(mx);
      const absY = Math.abs(my);

      const isVerticalPreference =
        absY > absX && (absY > VERTICAL_SWIPE_THRESHOLD || Math.abs(vy) > VERTICAL_VELOCITY_THRESHOLD);

      if (isVerticalPreference) {
        handleVerticalSwipe(my, vy, dy);
        return;
      }

      if (absX > SWIPE_THRESHOLD) {
        const isLeftSwipe = mx < 0;

        if (isAtEdge(isLeftSwipe)) {
          resetToCenter();
          return;
        }

        executeSwipeAnimation(isLeftSwipe);
        return;
      }

      handleVerticalSwipe(my, vy, dy);
    } else {
      handleDragFeedback(mx, my);
    }
  });

  return {
    bind,
    style: {
      x,
      y,
      opacity,
      scale,
      transform: rotate.to(r => `rotate(${r}deg)`)
    }
  };
};