import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const APPEARANCE_STORAGE_KEY = 'appearance';
const APPEARANCE_COOKIE_KEY = 'appearance';
const APPEARANCE_EVENT = 'bccc:appearance-change';

function isAppearance(value: unknown): value is Appearance {
    return value === 'light' || value === 'dark' || value === 'system';
}

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const resolveStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') {
        return 'system';
    }

    const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return isAppearance(stored) ? stored : 'system';
};

const applyTheme = (appearance: Appearance) => {
    if (typeof document === 'undefined') {
        return;
    }

    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());
    const root = document.documentElement;

    root.classList.toggle('dark', isDark);
    root.dataset.appearance = appearance;
    root.dataset.theme = isDark ? 'dark' : 'light';
    root.style.colorScheme = isDark ? 'dark' : 'light';
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

function notifyAppearanceChange(appearance: Appearance) {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT, { detail: appearance }));
}

export function initializeTheme() {
    const savedAppearance = resolveStoredAppearance();
    applyTheme(savedAppearance);

    mediaQuery()?.addEventListener('change', () => applyTheme(resolveStoredAppearance()));
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(() => resolveStoredAppearance());

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);

        if (typeof window !== 'undefined') {
            localStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
        }

        setCookie(APPEARANCE_COOKIE_KEY, mode);
        applyTheme(mode);
        notifyAppearanceChange(mode);
    }, []);

    useEffect(() => {
        const syncFromStorage = () => {
            const next = resolveStoredAppearance();
            setAppearance(next);
            applyTheme(next);
        };

        const syncFromCustomEvent = (event: Event) => {
            const value = (event as CustomEvent<Appearance>).detail;
            if (isAppearance(value)) {
                setAppearance(value);
                applyTheme(value);
            }
        };

        const syncFromMedia = () => {
            applyTheme(resolveStoredAppearance());
        };

        syncFromStorage();

        window.addEventListener('storage', syncFromStorage);
        window.addEventListener(APPEARANCE_EVENT, syncFromCustomEvent as EventListener);
        mediaQuery()?.addEventListener('change', syncFromMedia);

        return () => {
            window.removeEventListener('storage', syncFromStorage);
            window.removeEventListener(APPEARANCE_EVENT, syncFromCustomEvent as EventListener);
            mediaQuery()?.removeEventListener('change', syncFromMedia);
        };
    }, []);

    return { appearance, updateAppearance } as const;
}
