import { useEffect } from 'react';

declare global {
    interface Window {
        __bookingScrollMotionTimer?: number;
    }
}

const HORIZONTAL_SCROLL_SELECTORS = [
    '.booking-hotel-carousel',
    '.booking-game-carousel',
    '.booking-guideline-carousel',
    '.booking-review-carousel',
    '.booking-field-carousel',
    '.booking-hotel-usage-strip',
    '.booking-usage-panel',
    '.booking-wizard-top-steps',
].join(',');

function closestHorizontalScroller(
    target: EventTarget | null,
): HTMLElement | null {
    if (!(target instanceof HTMLElement)) {
        return null;
    }

    return target.closest(HORIZONTAL_SCROLL_SELECTORS) as HTMLElement | null;
}

function hasHorizontalOverflow(element: HTMLElement): boolean {
    return element.scrollWidth > element.clientWidth + 4;
}

function markMotion() {
    document.documentElement.classList.add('booking-scroll-motion-active');

    window.clearTimeout(window.__bookingScrollMotionTimer);

    window.__bookingScrollMotionTimer = window.setTimeout(() => {
        document.documentElement.classList.remove(
            'booking-scroll-motion-active',
        );
    }, 190);
}

export function useBookingScrollMotion(active = true) {
    useEffect(() => {
        if (!active) return;

        document.documentElement.classList.add('booking-scroll-enhanced');

        function handleWheel(event: WheelEvent) {
            const scroller = closestHorizontalScroller(event.target);

            if (!scroller || !hasHorizontalOverflow(scroller)) {
                markMotion();
                return;
            }

            const deltaY = event.deltaY;
            const deltaX = event.deltaX;
            const dominantVerticalWheel = Math.abs(deltaY) >= Math.abs(deltaX);

            if (dominantVerticalWheel && Math.abs(deltaY) > 0) {
                event.preventDefault();
                event.stopPropagation();

                scroller.scrollBy({
                    left: deltaY,
                    top: 0,
                    behavior: 'smooth',
                });

                markMotion();
                return;
            }

            if (Math.abs(deltaX) > 0) {
                event.preventDefault();
                event.stopPropagation();

                scroller.scrollBy({
                    left: deltaX,
                    top: 0,
                    behavior: 'smooth',
                });

                markMotion();
            }
        }

        function handleScroll() {
            markMotion();
        }

        document.addEventListener('wheel', handleWheel, {
            passive: false,
            capture: true,
        });

        document.addEventListener('scroll', handleScroll, {
            passive: true,
            capture: true,
        });

        return () => {
            document.documentElement.classList.remove(
                'booking-scroll-enhanced',
                'booking-scroll-motion-active',
            );

            document.removeEventListener('wheel', handleWheel, true);
            document.removeEventListener('scroll', handleScroll, true);

            window.clearTimeout(window.__bookingScrollMotionTimer);
        };
    }, [active]);
}
