import { cn } from '@/lib/class-names';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { MouseEvent, ReactNode } from 'react';

type MagneticHoverProps = Omit<HTMLMotionProps<'div'>, 'children' | 'onMouseMove' | 'onMouseLeave'> & {
  children: ReactNode;
  className?: string;
  strength?: number;
  rotateStrength?: number;
  disabled?: boolean;
};

export default function MagneticHover({
  children,
  className,
  strength = 10,
  rotateStrength = 2.5,
  disabled = false,
  ...props
}: MagneticHoverProps) {
  const reduceMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const x = useSpring(rawX, {
    stiffness: 180,
    damping: 18,
    mass: 0.45,
  });

  const y = useSpring(rawY, {
    stiffness: 180,
    damping: 18,
    mass: 0.45,
  });

  const rotateX = useTransform(y, [-strength, strength], [rotateStrength, -rotateStrength]);
  const rotateY = useTransform(x, [-strength, strength], [-rotateStrength, rotateStrength]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || disabled) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - bounds.left;
    const relativeY = event.clientY - bounds.top;

    const centeredX = relativeX - bounds.width / 2;
    const centeredY = relativeY - bounds.height / 2;

    rawX.set((centeredX / bounds.width) * strength * 2);
    rawY.set((centeredY / bounds.height) * strength * 2);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  if (reduceMotion || disabled) {
    return (
      <motion.div className={className} {...props}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn('will-change-transform [transform-style:preserve-3d]', className)}
      style={{
        x,
        y,
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </motion.div>
  );
}
