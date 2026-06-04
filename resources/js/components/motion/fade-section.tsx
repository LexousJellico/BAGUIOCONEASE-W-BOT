import LuxuryReveal from '@/components/motion/luxury-reveal';
import { cn } from '@/lib/class-names';
import type { ReactNode } from 'react';

type FadeSectionProps = {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
  tight?: boolean;
  wide?: boolean;
  delay?: number;
};

export default function FadeSection({
  children,
  className,
  containerClassName,
  id,
  tight = false,
  wide = false,
  delay = 0,
}: FadeSectionProps) {
  return (
    <LuxuryReveal
      as="section"
      id={id}
      delay={delay}
      className={cn(tight ? 'public-section-tight' : 'public-section', className)}
    >
      <div className={cn(wide ? 'bccc-container-wide' : 'bccc-container', containerClassName)}>
        {children}
      </div>
    </LuxuryReveal>
  );
}
