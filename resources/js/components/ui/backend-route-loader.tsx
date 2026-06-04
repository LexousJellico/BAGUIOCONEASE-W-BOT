import { BcccFullScreenLoader } from '@/components/shared/bccc-logo-loader';
import { router } from '@inertiajs/react';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type BackendRouteLoaderProps = {
    delay?: number;
    minimumVisibleMs?: number;
};

export default function BackendRouteLoader({
    delay = 80,
    minimumVisibleMs = 1500,
}: BackendRouteLoaderProps) {
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

        const reveal = () => {
            clearShowTimer();
            clearHideTimer();

            showTimerRef.current = window.setTimeout(() => {
                openedAtRef.current = Date.now();
                visibleRef.current = true;
                setVisible(true);
            }, delay);
        };

        const conceal = () => {
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

        const offStart = router.on('start', reveal);
        const offFinish = router.on('finish', conceal);
        const offNavigate = router.on('navigate', conceal);
        const offError = router.on('error', conceal);
        const offCancel = router.on('cancel', conceal);

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
                    logoSrc="/marketing/images/logo/bccc-seal.png"
                    label="Loading workspace..."
                    sublabel="Preparing your workspace"
                    size="lg"
                    variant="route"
                />
            ) : null}
        </AnimatePresence>
    );
}
