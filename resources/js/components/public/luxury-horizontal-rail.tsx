import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    type PointerEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

type LuxuryHorizontalRailProps = {
    children: ReactNode;
    label?: string;
    className?: string;
    railClassName?: string;
    showControls?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export default function LuxuryHorizontalRail({
    children,
    label = 'Scrollable content',
    className,
    railClassName,
    showControls = true,
}: LuxuryHorizontalRailProps) {
    const reduceMotion = useReducedMotion();
    const railRef = useRef<HTMLDivElement | null>(null);

    const [canScrollPrevious, setCanScrollPrevious] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    const [dragging, setDragging] = useState(false);

    const dragStartX = useRef(0);
    const dragStartY = useRef(0);
    const dragStartScroll = useRef(0);
    const hasHorizontalIntent = useRef(false);

    const updateScrollState = useCallback(() => {
        const rail = railRef.current;

        if (!rail) {
            setCanScrollPrevious(false);
            setCanScrollNext(false);
            return;
        }

        const maxScroll = rail.scrollWidth - rail.clientWidth;

        setCanScrollPrevious(rail.scrollLeft > 4);
        setCanScrollNext(rail.scrollLeft < maxScroll - 4);
    }, []);

    useEffect(() => {
        const rail = railRef.current;

        updateScrollState();

        if (!rail) {
            return;
        }

        const handleScroll = () => updateScrollState();
        const handleResize = () => updateScrollState();

        rail.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);

        return () => {
            rail.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [updateScrollState]);

    const scrollByCard = (direction: 'previous' | 'next') => {
        const rail = railRef.current;

        if (!rail) {
            return;
        }

        const amount = Math.max(rail.clientWidth * 0.78, 320);

        rail.scrollBy({
            left: direction === 'next' ? amount : -amount,
            behavior: reduceMotion ? 'auto' : 'smooth',
        });
    };

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        const rail = railRef.current;

        if (!rail || event.button !== 0) {
            return;
        }

        setDragging(true);
        hasHorizontalIntent.current = false;
        dragStartX.current = event.clientX;
        dragStartY.current = event.clientY;
        dragStartScroll.current = rail.scrollLeft;
        rail.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const rail = railRef.current;

        if (!rail || !dragging) {
            return;
        }

        const deltaX = event.clientX - dragStartX.current;
        const deltaY = event.clientY - dragStartY.current;

        if (!hasHorizontalIntent.current && Math.abs(deltaX) > Math.abs(deltaY) + 4) {
            hasHorizontalIntent.current = true;
        }

        if (hasHorizontalIntent.current) {
            event.preventDefault();
            rail.scrollLeft = dragStartScroll.current - deltaX;
        }
    };

    const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
        const rail = railRef.current;

        setDragging(false);
        hasHorizontalIntent.current = false;

        if (rail && rail.hasPointerCapture(event.pointerId)) {
            rail.releasePointerCapture(event.pointerId);
        }
    };

    return (
        <div className={cx('relative', className)}>
            <style>
                {`
                    .bccc-luxury-rail {
                        scrollbar-width: none;
                        -ms-overflow-style: none;
                        overscroll-behavior-inline: contain;
                    }

                    .bccc-luxury-rail::-webkit-scrollbar {
                        display: none;
                    }

                    .bccc-luxury-rail.is-dragging,
                    .bccc-luxury-rail.is-dragging * {
                        cursor: grabbing !important;
                        user-select: none !important;
                    }
                `}
            </style>

            {showControls ? (
                <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => scrollByCard('previous')}
                        disabled={!canScrollPrevious}
                        className="pointer-events-auto -ml-1 grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/88 text-[#2c2114] shadow-[0_18px_50px_rgba(36,27,14,0.16)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-[#b08d48]/45 hover:bg-white disabled:pointer-events-none disabled:opacity-0 dark:border-white/10 dark:bg-[#111418]/90 dark:text-white dark:hover:bg-[#181f26] sm:-ml-2"
                        aria-label={`Scroll ${label} previous`}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => scrollByCard('next')}
                        disabled={!canScrollNext}
                        className="pointer-events-auto -mr-1 grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/88 text-[#2c2114] shadow-[0_18px_50px_rgba(36,27,14,0.16)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-[#b08d48]/45 hover:bg-white disabled:pointer-events-none disabled:opacity-0 dark:border-white/10 dark:bg-[#111418]/90 dark:text-white dark:hover:bg-[#181f26] sm:-mr-2"
                        aria-label={`Scroll ${label} next`}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            ) : null}

            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#f8f5ef] to-transparent dark:from-[#0d0f12]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#f8f5ef] to-transparent dark:from-[#0d0f12]" />

            <motion.div
                ref={railRef}
                className={cx(
                    'bccc-luxury-rail flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth py-2 pl-1 pr-10',
                    dragging && 'is-dragging',
                    railClassName,
                )}
                style={{
                    touchAction: dragging ? 'none' : 'pan-y',
                    cursor: dragging ? 'grabbing' : 'grab',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDragging}
                onPointerCancel={stopDragging}
                onPointerLeave={() => setDragging(false)}
                role="region"
                aria-label={label}
            >
                {children}
            </motion.div>
        </div>
    );
}
