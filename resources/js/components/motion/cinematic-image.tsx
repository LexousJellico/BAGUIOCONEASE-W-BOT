import { bcccMotion, bcccReveal } from '@/lib/design-tokens';
import { cn } from '@/lib/class-names';
import { motion, useReducedMotion } from 'framer-motion';
import type { ImgHTMLAttributes, ReactNode } from 'react';

type CinematicImageProps = {
  src: string;
  darkSrc?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  overlayClassName?: string;
  frame?: boolean;
  opening?: boolean;
  showVeil?: boolean;
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading'];
  children?: ReactNode;
};

export default function CinematicImage({
  src,
  darkSrc,
  alt,
  className,
  imageClassName,
  overlayClassName,
  frame = false,
  opening = true,
  showVeil = true,
  loading = 'eager',
  children,
}: CinematicImageProps) {
  const reduceMotion = useReducedMotion();

  const imageMotion =
    reduceMotion || !opening
      ? {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
        }
      : {
          initial: bcccReveal.imageOpen.hidden,
          animate: bcccReveal.imageOpen.visible,
        };

  const leftVeilMotion =
    reduceMotion || !showVeil
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 0 },
        }
      : {
          initial: { opacity: 1, scaleX: 1 },
          animate: { opacity: 0, scaleX: 0 },
          transition: {
            duration: 1.08,
            ease: bcccMotion.easeLuxury,
            delay: 0.12,
          },
        };

  const rightVeilMotion =
    reduceMotion || !showVeil
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 0 },
        }
      : {
          initial: { opacity: 1, scaleX: 1 },
          animate: { opacity: 0, scaleX: 0 },
          transition: {
            duration: 1.08,
            ease: bcccMotion.easeLuxury,
            delay: 0.2,
          },
        };

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden bg-[#080806] bccc-perspective',
        frame && 'bccc-image-frame',
        className,
      )}
    >
      <motion.div
        className="absolute inset-0 origin-center bccc-preserve-3d"
        {...imageMotion}
      >
        <img
          src={src}
          alt={alt}
          loading={loading}
          draggable={false}
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            darkSrc ? 'dark:hidden' : '',
            imageClassName,
          )}
        />

        {darkSrc ? (
          <img
            src={darkSrc}
            alt={alt}
            loading={loading}
            draggable={false}
            className={cn(
              'absolute inset-0 hidden h-full w-full object-cover dark:block',
              imageClassName,
            )}
          />
        ) : null}
      </motion.div>

      {showVeil ? (
        <>
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/2 origin-left bg-[#080806]"
            {...leftVeilMotion}
          />

          <motion.div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/2 origin-right bg-[#080806]"
            {...rightVeilMotion}
          />
        </>
      ) : null}

      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-[11] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,8,6,0.08)_42%,rgba(8,8,6,0.54)_100%)]',
          overlayClassName,
        )}
      />

      {children ? <div className="relative z-20">{children}</div> : null}
    </div>
  );
}
