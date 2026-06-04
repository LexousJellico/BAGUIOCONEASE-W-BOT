import { usePage } from '@inertiajs/react';
import { useLayoutEffect } from 'react';

const REVEAL_SELECTOR = [
    '.bccc-public-main > section',
    '.bccc-public-main > article',
    '.bccc-public-main > div > section',
    '.bccc-public-main main > section',
    '.bccc-public-main section',
    '.bccc-public-main article',
    '.bccc-public-main header:not(.bccc-public-header)',
    '.bccc-public-main .public-section',
    '.bccc-public-main .public-section-shell',
    '.bccc-public-main .facility-info-section',
    '.bccc-public-main .public-display-card',
    '.bccc-public-main .public-motion-item',
    '.bccc-public-main [data-public-reveal]',
].join(',');

const CARD_HINTS = [
    'card',
    'panel',
    'tile',
    'item',
    'offer',
    'facility',
    'space',
    'member',
    'stat',
];

const RAIL_HINTS = [
    'rail',
    'carousel',
    'slider',
    'track',
    'horizontal',
];

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function shouldSkipElement(element: Element) {
    if (!(element instanceof HTMLElement)) {
        return true;
    }

    if (element.dataset.publicMotion === 'off') {
        return true;
    }

    if (element.closest('[data-public-motion="off"], .bccc-public-motion-skip')) {
        return true;
    }

    const className = element.className.toString();

    if (className.includes('fixed') || className.includes('pointer-events-none')) {
        return true;
    }

    if (element.offsetHeight < 8 && element.offsetWidth < 8) {
        return true;
    }

    return false;
}

function revealStyleFor(element: HTMLElement) {
    const className = element.className.toString().toLowerCase();
    const tag = element.tagName.toLowerCase();

    if (element.dataset.publicReveal) {
        return element.dataset.publicReveal;
    }

    if (className.includes('hero') || tag === 'header') {
        return 'hero';
    }

    if (RAIL_HINTS.some((hint) => className.includes(hint))) {
        return 'rail';
    }

    if (CARD_HINTS.some((hint) => className.includes(hint))) {
        return 'card';
    }

    if (tag === 'h1' || tag === 'h2' || tag === 'p') {
        return 'text';
    }

    return 'section';
}

function delayFor(index: number, element: HTMLElement) {
    const explicitDelay = element.dataset.publicRevealDelay;

    if (explicitDelay) {
        return explicitDelay.endsWith('ms') ? explicitDelay : `${explicitDelay}ms`;
    }

    const rowDelay = Math.min((index % 7) * 48, 288);

    return `${rowDelay}ms`;
}

function updateSmoothScrollAnchors() {
    const handleClick = (event: MouseEvent) => {
        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        const anchor = target.closest<HTMLAnchorElement>('a[href]');

        if (!anchor) {
            return;
        }

        const href = anchor.getAttribute('href');

        if (!href || href === '#' || anchor.target === '_blank' || anchor.dataset.smoothScroll === 'off') {
            return;
        }

        let url: URL;

        try {
            url = new URL(href, window.location.href);
        } catch {
            return;
        }

        if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) {
            return;
        }

        const id = decodeURIComponent(url.hash.slice(1));
        const destination = document.getElementById(id);

        if (!destination) {
            return;
        }

        event.preventDefault();

        destination.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start',
        });

        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener('click', handleClick, { passive: false });

    return () => document.removeEventListener('click', handleClick);
}

function scrollToHashAfterNavigation() {
    if (!window.location.hash) {
        return;
    }

    const id = decodeURIComponent(window.location.hash.slice(1));

    window.requestAnimationFrame(() => {
        const destination = document.getElementById(id);

        if (!destination) {
            return;
        }

        destination.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start',
        });
    });
}

export default function PublicMotionEffects() {
    const page = usePage();
    const pageUrl = page.url;

    useLayoutEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const root = document.querySelector<HTMLElement>('.bccc-public-main');

        if (!root) {
            return;
        }

        const html = document.documentElement;
        html.classList.add('bccc-public-motion-ready');

        if (prefersReducedMotion()) {
            root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element) => {
                element.dataset.bcccReveal = 'shown';
            });

            return;
        }

        let cancelled = false;
        let scanFrame = 0;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    const element = entry.target as HTMLElement;
                    element.dataset.bcccReveal = 'shown';
                    observer.unobserve(element);
                });
            },
            {
                root: null,
                rootMargin: '0px 0px -7% 0px',
                threshold: 0.08,
            },
        );

        const prepareElement = (element: HTMLElement, index: number) => {
            if (shouldSkipElement(element)) {
                return;
            }

            if (!element.dataset.bcccReveal) {
                element.dataset.bcccReveal = 'pending';
                element.dataset.bcccRevealStyle = revealStyleFor(element);
                element.style.setProperty('--bccc-reveal-delay', delayFor(index, element));
            }

            observer.observe(element);
        };

        const scan = () => {
            if (cancelled) {
                return;
            }

            const elements = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
            elements.forEach(prepareElement);
        };

        const scheduleScan = () => {
            window.cancelAnimationFrame(scanFrame);
            scanFrame = window.requestAnimationFrame(scan);
        };

        scheduleScan();
        scrollToHashAfterNavigation();

        const mutationObserver = new MutationObserver(scheduleScan);
        mutationObserver.observe(root, {
            childList: true,
            subtree: true,
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(scanFrame);
            observer.disconnect();
            mutationObserver.disconnect();
        };
    }, [pageUrl]);

    useLayoutEffect(() => updateSmoothScrollAnchors(), []);

    return null;
}
