import { BcccFullScreenLoader } from '@/components/shared/bccc-logo-loader';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

type StartupLoadingOverlayProps = {
    minimumMs?: number;
    logoSrc?: string;
};

export default function StartupLoadingOverlay({
    minimumMs = 1500,
    logoSrc = '/marketing/images/logo/bccc-seal.png',
}: StartupLoadingOverlayProps) {
    const [open, setOpen] = useState(true);

    useEffect(() => {
        const startedAt = performance.now();

        const finish = () => {
            const elapsed = performance.now() - startedAt;
            const remaining = Math.max(minimumMs - elapsed, 0);

            window.setTimeout(() => {
                setOpen(false);
                document.documentElement.dataset.bcccReady = 'true';
            }, remaining);
        };

        /**
         * This waits until the browser has painted the Inertia page behind the overlay.
         * That is why you will see a blurred version of the actual layout behind the loader.
         */
        const frameOne = window.requestAnimationFrame(() => {
            const frameTwo = window.requestAnimationFrame(finish);

            return () => window.cancelAnimationFrame(frameTwo);
        });

        return () => window.cancelAnimationFrame(frameOne);
    }, [minimumMs]);

    return (
        <AnimatePresence>
            {open ? (
                <BcccFullScreenLoader
                    open={open}
                    logoSrc={logoSrc}
                    label="Loading..."
                    sublabel="Preparing your experience"
                    size="lg"
                    variant="startup"
                />
            ) : null}
        </AnimatePresence>
    );
}
