import { bcccMotion } from '@/lib/design-tokens';
import { cn } from '@/lib/class-names';
import { motion, useReducedMotion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { ComponentType, ReactNode } from 'react';

type StaggeredListTag = 'div' | 'ul' | 'ol' | 'section';
type StaggeredItemTag = 'div' | 'li' | 'article';

type StaggeredListProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children: ReactNode;
  as?: StaggeredListTag;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
  once?: boolean;
  amount?: number;
};

type StaggeredItemProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children: ReactNode;
  as?: StaggeredItemTag;
  className?: string;
  y?: number;
};

const listElements = {
  div: motion.div,
  ul: motion.ul,
  ol: motion.ol,
  section: motion.section,
};

const itemElements = {
  div: motion.div,
  li: motion.li,
  article: motion.article,
};

export function StaggeredList({
  children,
  as = 'div',
  className,
  delayChildren = 0.08,
  staggerChildren = 0.075,
  once = true,
  amount = 0.16,
  ...props
}: StaggeredListProps) {
  const reduceMotion = useReducedMotion();
  const MotionElement = listElements[as] as ComponentType<HTMLMotionProps<'div'>>;

  if (reduceMotion) {
    return (
      <MotionElement className={className} {...props}>
        {children}
      </MotionElement>
    );
  }

  return (
    <MotionElement
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once,
        amount,
      }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren,
            staggerChildren,
          },
        },
      }}
      {...props}
    >
      {children}
    </MotionElement>
  );
}

export function StaggeredItem({
  children,
  as = 'div',
  className,
  y = 18,
  ...props
}: StaggeredItemProps) {
  const reduceMotion = useReducedMotion();
  const MotionElement = itemElements[as] as ComponentType<HTMLMotionProps<'div'>>;

  if (reduceMotion) {
    return (
      <MotionElement className={className} {...props}>
        {children}
      </MotionElement>
    );
  }

  return (
    <MotionElement
      className={cn('will-change-transform', className)}
      variants={{
        hidden: {
          opacity: 0,
          y,
          scale: 0.985,
          filter: 'blur(8px)',
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          transition: {
            duration: bcccMotion.duration.slow,
            ease: bcccMotion.easeLuxury,
          },
        },
      }}
      {...props}
    >
      {children}
    </MotionElement>
  );
}
