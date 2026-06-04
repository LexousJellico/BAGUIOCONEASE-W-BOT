import { bcccMotion } from '@/lib/design-tokens';
import { cn } from '@/lib/class-names';
import { motion, useReducedMotion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { ComponentType, ReactNode } from 'react';

type MotionTag = 'div' | 'section' | 'article' | 'header' | 'footer' | 'aside' | 'li';

type LuxuryRevealProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children: ReactNode;
  as?: MotionTag;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  scale?: number;
  blur?: number;
  once?: boolean;
  amount?: number;
  immediate?: boolean;
};

const motionElements = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  footer: motion.footer,
  aside: motion.aside,
  li: motion.li,
};

export default function LuxuryReveal({
  children,
  as = 'div',
  className,
  delay = 0,
  duration = bcccMotion.duration.slow,
  y = 22,
  scale = 0.985,
  blur = 8,
  once = true,
  amount = 0.18,
  immediate = false,
  ...props
}: LuxuryRevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionElement = motionElements[as] as ComponentType<HTMLMotionProps<'div'>>;

  if (reduceMotion || immediate) {
    return (
      <MotionElement className={className} {...props}>
        {children}
      </MotionElement>
    );
  }

  return (
    <MotionElement
      className={cn('will-change-transform', className)}
      initial={{
        opacity: 0,
        y,
        scale,
        filter: `blur(${blur}px)`,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      viewport={{
        once,
        amount,
      }}
      transition={{
        duration,
        delay,
        ease: bcccMotion.easeLuxury,
      }}
      {...props}
    >
      {children}
    </MotionElement>
  );
}
