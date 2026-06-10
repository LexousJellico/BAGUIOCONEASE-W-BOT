import AppNoticeCenter from '@/components/shared/app-notice-center';
import '../css/app.css';
import '../css/bccc-public-responsive-complete.css';
import '../css/bccc-system.css';
import '../css/public-motion-effects.css';

import ActionFeedbackPopup from '@/components/action-feedback-popup';
import ClientBookingAssistant from '@/components/client/client-booking-assistant';
import PencilBookedSuccessPopup from '@/components/success-popup';
import AppErrorBoundary from '@/components/system/app-error-boundary';
import RuntimeErrorOverlay from '@/components/system/runtime-error-overlay';
import GlobalConfirmDialog from '@/components/ui/bccc-confirm-dialog';
import PageTransition from '@/components/ui/page-transition';
import RouteLoadingOverlay from '@/components/ui/route-loading-overlay';
import StartupLoadingOverlay from '@/components/ui/startup-loading-overlay';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { useEffect, type ComponentType, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { installCsrfFetchProtection } from './lib/csrf-fetch';

type PageLayout = (page: ReactNode) => ReactNode;

type InertiaPageComponent = ComponentType<Record<string, unknown>> & {
    layout?: PageLayout;
    displayName?: string;
};

const appName = import.meta.env.VITE_APP_NAME || 'BCCC EASE';

installCsrfFetchProtection();
initializeTheme();

router.on('success', () => {
    if (typeof window === 'undefined') return;
    // Backend/admin pages and newly opened forms should always start at the top so the fixed header never hides the first fields.
    window.requestAnimationFrame(() =>
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' }),
    );
});

const CALENDAR_WHEEL_BRIDGE_SELECTOR = [
    '.role-calendar-scroll',
    '.calendar-manage-scroll',
    '.calendar-grid-scroll',
    '.calendar-index-panel',
    '.user-calendar-grid-scroll',
    '.bccc-booking-calendar-scroll',
    '.booking-calendar-card',
    '.booking-operational-calendar-shell',
    '.booking-calendar-card-detailed',
    '.alh-admin-panel',
    '.alh-calendar-main',
    '.bccc-availability-calendar-popover',
].join(',');

function scrollPageAroundCalendar(calendar: Element, deltaY: number) {
    let parent = calendar.parentElement;

    while (
        parent &&
        parent !== document.body &&
        parent !== document.documentElement
    ) {
        const style = window.getComputedStyle(parent);
        const scrollableY = /(auto|scroll|overlay)/.test(style.overflowY);

        if (scrollableY && parent.scrollHeight > parent.clientHeight + 2) {
            parent.scrollTop += deltaY;
            return;
        }

        parent = parent.parentElement;
    }

    const scrollingElement = document.scrollingElement;

    if (
        scrollingElement &&
        scrollingElement.scrollHeight > scrollingElement.clientHeight + 2
    ) {
        scrollingElement.scrollTop += deltaY;
        return;
    }

    window.scrollBy({ top: deltaY, left: 0, behavior: 'auto' });
}

function CalendarWheelScrollBridge() {
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleWheel = (event: WheelEvent) => {
            if (
                event.defaultPrevented ||
                event.shiftKey ||
                Math.abs(event.deltaY) <= Math.abs(event.deltaX)
            ) {
                return;
            }

            const target =
                event.target instanceof Element ? event.target : null;

            if (!target) return;
            if (
                target.closest(
                    'input, textarea, select, [contenteditable="true"]',
                )
            )
                return;

            const calendar = target.closest(CALENDAR_WHEEL_BRIDGE_SELECTOR);

            if (!calendar) return;

            event.preventDefault();
            scrollPageAroundCalendar(calendar, event.deltaY);
        };

        window.addEventListener('wheel', handleWheel, {
            capture: true,
            passive: false,
        });

        return () => {
            window.removeEventListener('wheel', handleWheel, { capture: true });
        };
    }, []);

    return null;
}

function BcccRuntimeUiStack() {
    return (
        <>
            <RouteLoadingOverlay
                logoSrc="/marketing/images/logo/bccc-seal.png"
                label="Loading..."
                sublabel="Preparing your experience"
                minimumVisibleMs={1500}
            />

            <ActionFeedbackPopup />
            <PencilBookedSuccessPopup />
            <GlobalConfirmDialog />
            <RuntimeErrorOverlay />
        </>
    );
}

function MissingPageFallback({ pageName }: { pageName: string }) {
    return (
        <main className="grid min-h-screen place-items-center bg-[#f7f3ea] px-4 text-[#21180d] dark:bg-[#0c0f14] dark:text-white">
            <section className="w-full max-w-2xl rounded-[1.75rem] border border-amber-200 bg-white/90 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.15)] backdrop-blur-2xl dark:border-amber-400/20 dark:bg-[#111827]/90">
                <p className="text-[10px] font-bold tracking-[0.24em] text-amber-700 uppercase dark:text-amber-300">
                    BCCC EASE Runtime Notice
                </p>

                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                    Page component could not be loaded
                </h1>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Inertia tried to render this page, but the matching React
                    file was not found or could not be imported.
                </p>

                <div className="mt-4 rounded-2xl border border-black/10 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    Requested page: {pageName}
                </div>
            </section>
        </main>
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    resolve: async (name) => {
        try {
            const pageModule = (await resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx'),
            )) as { default?: InertiaPageComponent };

            const CurrentPage = (pageModule.default ??
                pageModule) as InertiaPageComponent;
            const originalLayout = CurrentPage.layout;

            function ResolvedPageContent(pageProps: Record<string, unknown>) {
                const page = <CurrentPage {...pageProps} />;
                const pageWithLayout =
                    typeof originalLayout === 'function'
                        ? originalLayout(page)
                        : page;

                return (
                    <>
                        <PageTransition pageKey={name}>
                            {pageWithLayout}
                        </PageTransition>

                        <StartupLoadingOverlay
                            logoSrc="/marketing/images/logo/bccc-seal.png"
                            minimumMs={1500}
                        />

                        <BcccRuntimeUiStack />
                        <ClientBookingAssistant />
                    </>
                );
            }

            function SafeResolvedPage(pageProps: Record<string, unknown>) {
                return (
                    <AppErrorBoundary pageName={name}>
                        <ResolvedPageContent {...pageProps} />
                    </AppErrorBoundary>
                );
            }

            SafeResolvedPage.displayName =
                CurrentPage.displayName ||
                CurrentPage.name ||
                'BcccResolvedPage';

            return SafeResolvedPage as InertiaPageComponent;
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error(
                    `[BCCC EASE] Failed to resolve Inertia page: ${name}`,
                    error,
                );
            }

            function SafeMissingPage() {
                return (
                    <AppErrorBoundary pageName={name}>
                        <MissingPageFallback pageName={name} />

                        <StartupLoadingOverlay
                            logoSrc="/marketing/images/logo/bccc-seal.png"
                            minimumMs={1500}
                        />

                        <BcccRuntimeUiStack />
                    </AppErrorBoundary>
                );
            }

            return SafeMissingPage as InertiaPageComponent;
        }
    },

    setup({ el, App, props }) {
        createRoot(el).render(
            <>
                <App {...props} />
                <AppNoticeCenter />
                <CalendarWheelScrollBridge />
            </>,
        );
    },

    progress: {
        color: '#a98443',
        showSpinner: false,
    },
});
