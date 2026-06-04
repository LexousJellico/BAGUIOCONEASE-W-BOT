import { motion, useReducedMotion } from 'framer-motion';
import { MoonStar, SunMedium } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';

const easeLuxury = [0.22, 1, 0.36, 1] as const;

export default function ThemeToggle() {
  const { appearance, updateAppearance } = useAppearance();

  const reduceMotion = useReducedMotion();

  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const sync = () => {
      setSystemDark(mediaQuery.matches);
    };

    sync();
    setMounted(true);

    mediaQuery.addEventListener('change', sync);

    return () => {
      mediaQuery.removeEventListener('change', sync);
    };
  }, []);

  const isDark = useMemo(() => {
    if (appearance === 'dark') {
      return true;
    }

    if (appearance === 'light') {
      return false;
    }

    return systemDark;
  }, [appearance, systemDark]);

  const toggleTheme = () => {
    updateAppearance(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="group relative inline-flex h-11 w-11 items-center justify-center overflow-hidden border border-white/18 bg-white/[0.08] text-white shadow-[0_14px_38px_rgba(0,0,0,0.14)] backdrop-blur-xl transition duration-500 hover:-translate-y-0.5 hover:border-[#f4dfad]/40 hover:bg-white/[0.13] dark:border-white/14"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,223,173,0.20),transparent_48%)] opacity-0 transition duration-500 group-hover:opacity-100" />

      {mounted ? (
        <motion.span
          key={isDark ? 'dark' : 'light'}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.86, filter: 'blur(6px)' }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.86, filter: 'blur(6px)' }}
          transition={{ duration: 0.28, ease: easeLuxury }}
          className="relative z-10"
        >
          {isDark ? (
            <MoonStar className="h-4.5 w-4.5 text-[#f4dfad]" />
          ) : (
            <SunMedium className="h-4.5 w-4.5 text-[#f4dfad]" />
          )}
        </motion.span>
      ) : (
        <span className="relative z-10 h-4 w-4 border border-[#f4dfad]/50" />
      )}

      <span className="pointer-events-none absolute bottom-1 left-1 right-1 h-px origin-left scale-x-0 bg-[#f4dfad]/70 transition duration-500 group-hover:scale-x-100" />
    </button>
  );
}
