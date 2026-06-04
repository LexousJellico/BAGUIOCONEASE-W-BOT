import { AppContent } from '@/components/app-content';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import BackendRouteLoader from '@/components/ui/backend-route-loader';
import type { BreadcrumbItem } from '@/types';
import { AnimatePresence } from 'framer-motion';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type PropsWithChildren,
} from 'react';
import { createPortal } from 'react-dom';

const SIDEBAR_EXPANDED_WIDTH = '17.25rem';
const SIDEBAR_COLLAPSED_WIDTH = '0rem';
const BACKEND_TOPBAR_HEIGHT = '4.35rem';
const BACKEND_BREADCRUMB_HEIGHT = '2.55rem';

function getInitialSidebarState() {
    if (typeof window === 'undefined') {
        return false;
    }

    const stored = window.localStorage.getItem('bccc-sidebar-collapsed');

    if (stored === 'true') {
        return true;
    }

    if (stored === 'false') {
        return false;
    }

    return window.matchMedia('(min-width: 1024px) and (max-width: 1366px)')
        .matches;
}

function BackendChromePortal({
    breadcrumbs,
    collapsed,
    hoverOpen,
    onCollapsedChange,
    onHoverOpen,
    onHoverClose,
    onHoverKeepOpen,
    shellStyle,
}: {
    breadcrumbs: BreadcrumbItem[];
    collapsed: boolean;
    hoverOpen: boolean;
    onCollapsedChange: (value: boolean) => void;
    onHoverOpen: () => void;
    onHoverClose: () => void;
    onHoverKeepOpen: () => void;
    shellStyle: CSSProperties;
}) {
    const [mounted, setMounted] = useState(false);
    const temporarySidebarOpen = collapsed && hoverOpen;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className="bccc-backend-chrome-portal"
            data-backend-chrome="fixed"
            data-sidebar-collapsed={collapsed ? 'true' : 'false'}
            data-sidebar-hover-open={temporarySidebarOpen ? 'true' : 'false'}
            style={shellStyle}
        >
            {collapsed ? (
                <button
                    type="button"
                    className="bccc-sidebar-hover-rail"
                    aria-label="Reveal sidebar"
                    title="Reveal sidebar"
                    onMouseEnter={onHoverOpen}
                    onMouseLeave={onHoverClose}
                    onFocus={onHoverOpen}
                    onBlur={onHoverClose}
                />
            ) : null}
            <AnimatePresence initial={false}>
                {!collapsed || temporarySidebarOpen ? (
                    <AppSidebar
                        key={temporarySidebarOpen ? 'hover-open' : 'pinned'}
                        collapsed={false}
                        autoExpanded={temporarySidebarOpen}
                        onAutoExpandEnter={onHoverKeepOpen}
                        onAutoExpandLeave={onHoverClose}
                    />
                ) : null}
            </AnimatePresence>
            <AppSidebarHeader
                breadcrumbs={breadcrumbs}
                collapsed={collapsed}
                onCollapsedChange={onCollapsedChange}
            />
        </div>,
        document.body,
    );
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const [collapsed, setCollapsed] = useState(false);
    const [hoverOpen, setHoverOpen] = useState(false);
    const [ready, setReady] = useState(false);
    const hoverCloseTimerRef = useRef<number | null>(null);
    const hasBreadcrumbs = breadcrumbs.filter((item) => item.title).length > 1;

    useEffect(() => {
        setCollapsed(getInitialSidebarState());
        setReady(true);
    }, []);

    const updateCollapsed = useCallback((value: boolean) => {
        setCollapsed(value);
        setHoverOpen(false);

        if (typeof window !== 'undefined') {
            window.localStorage.setItem(
                'bccc-sidebar-collapsed',
                value ? 'true' : 'false',
            );
        }
    }, []);

    const clearHoverCloseTimer = useCallback(() => {
        if (
            hoverCloseTimerRef.current !== null &&
            typeof window !== 'undefined'
        ) {
            window.clearTimeout(hoverCloseTimerRef.current);
        }

        hoverCloseTimerRef.current = null;
    }, []);

    const openHoverSidebar = useCallback(() => {
        if (!collapsed) return;

        clearHoverCloseTimer();
        setHoverOpen(true);
    }, [clearHoverCloseTimer, collapsed]);

    const closeHoverSidebar = useCallback(() => {
        clearHoverCloseTimer();

        if (typeof window === 'undefined') {
            setHoverOpen(false);
            return;
        }

        hoverCloseTimerRef.current = window.setTimeout(() => {
            setHoverOpen(false);
            hoverCloseTimerRef.current = null;
        }, 140);
    }, [clearHoverCloseTimer]);

    useEffect(() => {
        if (!collapsed) {
            setHoverOpen(false);
            clearHoverCloseTimer();
        }
    }, [clearHoverCloseTimer, collapsed]);

    useEffect(
        () => () => {
            clearHoverCloseTimer();
        },
        [clearHoverCloseTimer],
    );

    const shellStyle = useMemo(
        () =>
            ({
                '--bccc-backend-sidebar-width': collapsed
                    ? SIDEBAR_COLLAPSED_WIDTH
                    : SIDEBAR_EXPANDED_WIDTH,
                '--bccc-sidebar-width': collapsed
                    ? SIDEBAR_COLLAPSED_WIDTH
                    : SIDEBAR_EXPANDED_WIDTH,
                '--bccc-backend-sidebar-expanded-width': SIDEBAR_EXPANDED_WIDTH,
                '--bccc-backend-sidebar-collapsed-width':
                    SIDEBAR_COLLAPSED_WIDTH,
                '--bccc-sidebar-width-expanded': SIDEBAR_EXPANDED_WIDTH,
                '--bccc-sidebar-width-collapsed': SIDEBAR_COLLAPSED_WIDTH,
                '--bccc-backend-topbar-height': BACKEND_TOPBAR_HEIGHT,
                '--bccc-app-header-height': BACKEND_TOPBAR_HEIGHT,
                '--bccc-backend-titlebar-height': BACKEND_TOPBAR_HEIGHT,
                '--bccc-backend-breadcrumb-height': hasBreadcrumbs
                    ? BACKEND_BREADCRUMB_HEIGHT
                    : '0rem',
                '--bccc-backend-chrome-height': `calc(${BACKEND_TOPBAR_HEIGHT} + ${hasBreadcrumbs ? BACKEND_BREADCRUMB_HEIGHT : '0rem'})`,
            }) as CSSProperties,
        [collapsed, hasBreadcrumbs],
    );

    return (
        <div
            className="backend-boneyard-root min-h-screen overflow-x-hidden bg-[#edf0ea] text-[#111827] antialiased dark:bg-[#080b10] dark:text-white"
            data-sidebar-collapsed={collapsed ? 'true' : 'false'}
            data-sidebar-ready={ready ? 'true' : 'false'}
            data-backend-has-breadcrumbs={hasBreadcrumbs ? 'true' : 'false'}
            style={shellStyle}
        >
            <div
                className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
                aria-hidden="true"
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(31,116,101,0.15),transparent_32%),radial-gradient(circle_at_92%_12%,rgba(77,96,124,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.80),rgba(232,236,232,0.84))] dark:bg-[radial-gradient(circle_at_12%_0%,rgba(125,215,198,0.12),transparent_32%),radial-gradient(circle_at_92%_12%,rgba(82,115,156,0.16),transparent_30%),linear-gradient(135deg,#080b10,#0d1118_45%,#0a0d12)]" />
                <div
                    className="absolute top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/50 to-transparent transition-[left] duration-300 lg:block dark:via-white/8"
                    style={{ left: 'var(--bccc-backend-sidebar-width)' }}
                />
                <div className="absolute inset-0 [background-image:linear-gradient(rgba(17,24,39,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.5)_1px,transparent_1px)] [background-size:38px_38px] opacity-[0.045] dark:[background-image:linear-gradient(rgba(255,255,255,0.42)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.42)_1px,transparent_1px)] dark:opacity-[0.08]" />
            </div>

            <BackendChromePortal
                breadcrumbs={breadcrumbs}
                collapsed={collapsed}
                hoverOpen={hoverOpen}
                onCollapsedChange={updateCollapsed}
                onHoverOpen={openHoverSidebar}
                onHoverClose={closeHoverSidebar}
                onHoverKeepOpen={clearHoverCloseTimer}
                shellStyle={shellStyle}
            />

            <div
                className="backend-shell relative z-10 min-h-screen"
                style={shellStyle}
            >
                <div className="backend-main min-w-0 transition-[padding,width] duration-300 ease-out">
                    <AppContent>{children}</AppContent>
                </div>
            </div>

            <BackendRouteLoader />
        </div>
    );
}
