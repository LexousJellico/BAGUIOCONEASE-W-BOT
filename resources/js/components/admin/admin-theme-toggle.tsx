import { useAppearance } from '@/hooks/use-appearance';
import { MoonStar, SunMedium } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function AdminThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();
    const [systemDark, setSystemDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const sync = () => setSystemDark(mq.matches);

        sync();
        setMounted(true);

        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    const isDark = useMemo(() => {
        if (appearance === 'dark') return true;
        if (appearance === 'light') return false;
        return systemDark;
    }, [appearance, systemDark]);

    return (
        <button
            type="button"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/85 text-[#1f1f1c] shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-[#18191d] dark:text-white dark:hover:bg-[#22242a]"
            aria-label={
                mounted
                    ? isDark
                        ? 'Switch to light mode'
                        : 'Switch to dark mode'
                    : 'Toggle theme'
            }
            title={
                mounted ? (isDark ? 'Light mode' : 'Dark mode') : 'Toggle theme'
            }
        >
            {mounted ? (
                isDark ? (
                    <SunMedium className="h-5 w-5" />
                ) : (
                    <MoonStar className="h-5 w-5" />
                )
            ) : (
                <SunMedium className="h-5 w-5" />
            )}
        </button>
    );
}
