import { bcccMotion } from '@/lib/design-tokens';
import { cn } from '@/lib/class-names';
import { motion, useReducedMotion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type PageTransitionProps = Omit<HTMLMotionProps<'main'>, 'children'> & {
  children: ReactNode;
  className?: string;
  mode?: 'soft' | 'cinematic' | 'plain';
};

export default function PageTransition({
  children,
  className,
  mode = 'soft',
  ...props
}: PageTransitionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion || mode === 'plain') {
    return (
      <main className={className} {...(props as ComponentPropsWithoutRef<'main'>)}>
        {children}
      </main>
    );
  }

  const variants = {
    soft: {
      initial: {
        opacity: 0,
        y: 14,
        filter: 'blur(7px)',
      },
      animate: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      },
      transition: {
        duration: 0.5,
        ease: bcccMotion.easeLuxury,
      },
    },
    cinematic: {
      initial: {
        opacity: 0,
        y: 28,
        scale: 0.985,
        filter: 'blur(12px)',
      },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      },
      transition: {
        duration: 0.78,
        ease: bcccMotion.easeLuxury,
      },
    },
  } as const;

  return (
    <motion.main
      className={cn('min-w-0 will-change-transform', className)}
      initial={variants[mode].initial}
      animate={variants[mode].animate}
      transition={variants[mode].transition}
      {...(props as HTMLMotionProps<'main'>)}
    >
      {children}
    </motion.main>
  );
}
