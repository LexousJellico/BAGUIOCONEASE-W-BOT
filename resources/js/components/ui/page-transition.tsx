import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

type PageTransitionProps = {
    children: ReactNode;
    pageKey?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function PageTransition({ children, pageKey = 'page' }: PageTransitionProps) {
    const reduceMotion = useReducedMotion();

    if (reduceMotion) {
        return <>{children}</>;
    }

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pageKey}
                initial={{
                    opacity: 0,
                    y: 16,
                    scale: 0.992,
                    filter: 'blur(8px)',
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    filter: 'blur(0px)',
                }}
                exit={{
                    opacity: 0,
                    y: -10,
                    scale: 0.996,
                    filter: 'blur(6px)',
                }}
                transition={{
                    duration: 0.46,
                    ease,
                }}
                style={{
                    minWidth: 0,
                    willChange: 'opacity, transform, filter',
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
