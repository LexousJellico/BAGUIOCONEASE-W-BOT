import { BcccFullScreenLoader } from '@/components/shared/bccc-logo-loader';
import { router } from '@inertiajs/react';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type RouteLoadingOverlayProps = {
    logoSrc?: string;
    label?: string;
    sublabel?: string;
    delay?: number;
    minimumVisibleMs?: number;
};

export default function RouteLoadingOverlay({
    logoSrc = '/marketing/images/logo/bccc-seal.png',
    label = 'Loading...',
    sublabel = 'Preparing your experience',
    delay = 80,
    minimumVisibleMs = 1500,
}: RouteLoadingOverlayProps) {
    const [visible, setVisible] = useState(false);

    const visibleRef = useRef(false);
    const openedAtRef = useRef(0);
    const showTimerRef = useRef<number | null>(null);
    const hideTimerRef = useRef<number | null>(null);

    useEffect(() => {
        visibleRef.current = visible;
    }, [visible]);

    useEffect(() => {
        const clearShowTimer = () => {
            if (showTimerRef.current) {
                window.clearTimeout(showTimerRef.current);
                showTimerRef.current = null;
            }
        };

        const clearHideTimer = () => {
            if (hideTimerRef.current) {
                window.clearTimeout(hideTimerRef.current);
                hideTimerRef.current = null;
            }
        };

        const show = () => {
            clearShowTimer();
            clearHideTimer();

            showTimerRef.current = window.setTimeout(() => {
                openedAtRef.current = Date.now();
                visibleRef.current = true;
                setVisible(true);
            }, delay);
        };

        const hide = () => {
            clearShowTimer();

            if (!visibleRef.current) {
                setVisible(false);
                return;
            }

            const elapsed = Date.now() - openedAtRef.current;
            const remaining = Math.max(minimumVisibleMs - elapsed, 0);

            clearHideTimer();

            hideTimerRef.current = window.setTimeout(() => {
                visibleRef.current = false;
                setVisible(false);
            }, remaining);
        };

        const offStart = router.on('start', show);
        const offFinish = router.on('finish', hide);
        const offNavigate = router.on('navigate', hide);
        const offError = router.on('error', hide);
        const offCancel = router.on('cancel', hide);

        return () => {
            clearShowTimer();
            clearHideTimer();

            offStart();
            offFinish();
            offNavigate();
            offError();
            offCancel();
        };
    }, [delay, minimumVisibleMs]);

    return (
        <AnimatePresence>
            {visible ? (
                <BcccFullScreenLoader
                    open={visible}
                    logoSrc={logoSrc}
                    label={label}
                    sublabel={sublabel}
                    size="lg"
                    variant="route"
                />
            ) : null}
        </AnimatePresence>
    );
}
