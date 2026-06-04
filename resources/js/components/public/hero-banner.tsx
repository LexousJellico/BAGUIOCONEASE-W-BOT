import SafeImage from '@/components/system/safe-image';
import type { SiteMetricPayload } from '@/types/public-content';
import { Link } from '@inertiajs/react';
import {
    motion,
    useReducedMotion,
    useScroll,
    useSpring,
    useTransform,
} from 'framer-motion';
import { ArrowRight, CalendarDays, ChevronDown, MapPinned } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Props = {
    siteMetric?: SiteMetricPayload | null;
};

const HERO_IMAGE = '/marketing/images/hero/bccc.png';
const HERO_FALLBACK = '/marketing/images/hero/noon2.jpg';

const LOADER_SELECTORS = [
    '[data-bccc-loader]',
    '[data-system-loader]',
    '[data-app-loader]',
    '#bccc-loader',
    '#app-loader',
    '#global-loader',
    '#loading-screen',
    '.bccc-loader',
    '.app-loader',
    '.system-loader',
    '.global-loader',
    '.loading-screen',
    '.preloader',
    '.page-loader',
];

function isElementVisible(element: Element) {
    const target = element as HTMLElement;
    const style = window.getComputedStyle(target);
    const rect = target.getBoundingClientRect();

    return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity || 1) > 0.03 &&
        rect.width > 0 &&
        rect.height > 0
    );
}

function hasVisibleLoader() {
    if (typeof window === 'undefined') return false;

    return LOADER_SELECTORS.some((selector) => {
        try {
            return Array.from(document.querySelectorAll(selector)).some(
                isElementVisible,
            );
        } catch {
            return false;
        }
    });
}

function useHeroIntroAfterSystemLoader() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let done = false;
        let frame = 0;
        let settleTimer = 0;
        let fallbackTimer = 0;

        const finish = (delay = 180) => {
            if (done) return;

            window.clearTimeout(settleTimer);

            settleTimer = window.setTimeout(() => {
                if (done) return;
                done = true;
                setReady(true);
            }, delay);
        };

        const check = () => {
            if (done) return;

            const loaded =
                document.readyState === 'complete' ||
                document.readyState === 'interactive';

            if (loaded && !hasVisibleLoader()) {
                finish(260);
                return;
            }

            frame = window.requestAnimationFrame(check);
        };

        const handleLoaderFinished = () => finish(140);

        window.addEventListener('load', check);
        window.addEventListener('bccc:loader-finished', handleLoaderFinished);
        window.addEventListener('bccc:loading-finished', handleLoaderFinished);
        window.addEventListener('app:loader-finished', handleLoaderFinished);

        const observer = new MutationObserver(check);

        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'class',
                    'style',
                    'hidden',
                    'aria-hidden',
                    'data-state',
                ],
            });
        }

        /*
         * Safety fallback: if the loader has a different class/id,
         * this still waits long enough so the intro does not happen behind it.
         */
        fallbackTimer = window.setTimeout(() => finish(0), 3600);

        check();

        return () => {
            done = true;
            window.cancelAnimationFrame(frame);
            window.clearTimeout(settleTimer);
            window.clearTimeout(fallbackTimer);
            observer.disconnect();
            window.removeEventListener('load', check);
            window.removeEventListener(
                'bccc:loader-finished',
                handleLoaderFinished,
            );
            window.removeEventListener(
                'bccc:loading-finished',
                handleLoaderFinished,
            );
            window.removeEventListener(
                'app:loader-finished',
                handleLoaderFinished,
            );
        };
    }, []);

    return ready;
}

function MountainMistLayer({ active }: { active: boolean }) {
    return (
        <div className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
            <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, y: 70 }}
                animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 70 }}
                transition={{
                    duration: 1.35,
                    delay: 0.18,
                    ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute inset-x-[-8vw] bottom-[12svh] h-[34svh]"
            >
                <div
                    className="absolute inset-x-0 bottom-0 h-[72%] bg-[#08231f]/42 blur-[0.2px]"
                    style={{
                        clipPath:
                            'polygon(0% 80%, 7% 52%, 13% 66%, 21% 31%, 30% 61%, 39% 25%, 48% 58%, 57% 34%, 66% 63%, 76% 28%, 84% 57%, 93% 39%, 100% 70%, 100% 100%, 0% 100%)',
                    }}
                />
                <div
                    className="absolute inset-x-0 bottom-0 h-[55%] bg-[#0f4f44]/26 blur-[1px]"
                    style={{
                        clipPath:
                            'polygon(0% 88%, 9% 66%, 17% 78%, 26% 48%, 36% 75%, 45% 43%, 55% 76%, 64% 55%, 73% 80%, 82% 47%, 91% 72%, 100% 55%, 100% 100%, 0% 100%)',
                    }}
                />
            </motion.div>

            <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={
                    active
                        ? {
                              opacity: [0.12, 0.32, 0.22],
                              x: ['-6%', '4%', '-2%'],
                          }
                        : { opacity: 0 }
                }
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                    delay: 0.4,
                }}
                className="absolute bottom-[21svh] left-[-10vw] h-[10svh] w-[68vw] rounded-full bg-white/10 blur-3xl"
            />

            <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={
                    active
                        ? {
                              opacity: [0.08, 0.26, 0.18],
                              x: ['8%', '-5%', '2%'],
                          }
                        : { opacity: 0 }
                }
                transition={{
                    duration: 21,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                    delay: 0.7,
                }}
                className="absolute right-[-12vw] bottom-[25svh] h-[12svh] w-[72vw] rounded-full bg-[#c9fff4]/10 blur-3xl"
            />
        </div>
    );
}

function CloudLayer({ active }: { active: boolean }) {
    return (
        <div className="pointer-events-none absolute inset-0 z-[7] overflow-hidden">
            <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, x: '-22vw', y: 28 }}
                animate={
                    active
                        ? {
                              opacity: [0.04, 0.38, 0.28],
                              x: ['-22vw', '10vw', '4vw'],
                              y: [28, 7, 18],
                          }
                        : { opacity: 0, x: '-22vw', y: 28 }
                }
                transition={{
                    duration: 22,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                }}
                className="absolute top-[17%] left-[1%] h-[8rem] w-[34rem] rounded-full bg-white/12 blur-2xl"
            />

            <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, x: '22vw', y: 0 }}
                animate={
                    active
                        ? {
                              opacity: [0.05, 0.32, 0.24],
                              x: ['22vw', '-6vw', '3vw'],
                              y: [0, 18, 7],
                          }
                        : { opacity: 0, x: '22vw', y: 0 }
                }
                transition={{
                    duration: 26,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                    delay: 0.5,
                }}
                className="absolute top-[28%] right-[2%] h-[7rem] w-[30rem] rounded-full bg-[#f4dfad]/10 blur-2xl"
            />

            <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, x: '-12vw', y: 14 }}
                animate={
                    active
                        ? {
                              opacity: [0.02, 0.24, 0.16],
                              x: ['-12vw', '7vw', '-1vw'],
                              y: [14, -3, 9],
                          }
                        : { opacity: 0, x: '-12vw', y: 14 }
                }
                transition={{
                    duration: 29,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                    delay: 1,
                }}
                className="absolute top-[10%] left-[24%] h-[5.5rem] w-[24rem] rounded-full bg-white/9 blur-2xl"
            />
        </div>
    );
}

function FogLayer({ active }: { active: boolean }) {
    return (
        <div className="pointer-events-none absolute inset-0 z-[18] overflow-hidden">
            <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, x: '-14%' }}
                animate={
                    active
                        ? {
                              opacity: [0.04, 0.62, 0.46],
                              x: ['-14%', '4%', '-2%'],
                          }
                        : { opacity: 0, x: '-14%' }
                }
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                }}
                className="absolute bottom-[12%] -left-[20%] h-[18svh] w-[72vw] rounded-full bg-white/16 blur-3xl"
            />

            <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, x: '14%' }}
                animate={
                    active
                        ? {
                              opacity: [0.02, 0.4, 0.54],
                              x: ['14%', '-5%', '2%'],
                          }
                        : { opacity: 0, x: '14%' }
                }
                transition={{
                    duration: 13,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                    delay: 0.4,
                }}
                className="absolute -right-[20%] bottom-[23%] h-[20svh] w-[76vw] rounded-full bg-[#d5f6ef]/13 blur-3xl"
            />

            <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, x: '-8%' }}
                animate={
                    active
                        ? {
                              opacity: [0.02, 0.34, 0.26],
                              x: ['-8%', '7%', '-1%'],
                          }
                        : { opacity: 0, x: '-8%' }
                }
                transition={{
                    duration: 16,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                    delay: 0.8,
                }}
                className="absolute top-[18%] left-[12%] h-[14svh] w-[52vw] rounded-full bg-white/10 blur-3xl"
            />
        </div>
    );
}

function BirdsLayer({ active }: { active: boolean }) {
    const birds = [
        { top: '21%', left: '58%', delay: 0, scale: 0.72 },
        { top: '24%', left: '63%', delay: 0.18, scale: 0.55 },
        { top: '18%', left: '70%', delay: 0.34, scale: 0.64 },
        { top: '31%', left: '77%', delay: 0.52, scale: 0.48 },
        { top: '26%', left: '83%', delay: 0.72, scale: 0.58 },
        { top: '15%', left: '48%', delay: 1.02, scale: 0.42 },
    ];

    return (
        <div className="pointer-events-none absolute inset-0 z-[16] overflow-hidden">
            {birds.map((bird, index) => (
                <motion.span
                    key={`${bird.top}-${bird.left}`}
                    aria-hidden="true"
                    initial={{ opacity: 0, x: 84, y: 22, scale: bird.scale }}
                    animate={
                        active
                            ? {
                                  opacity: [0, 0.74, 0.62, 0],
                                  x: [84, -18, -82, -160],
                                  y: [22, 2, 14, -10],
                                  scale: bird.scale,
                              }
                            : { opacity: 0, x: 84, y: 22, scale: bird.scale }
                    }
                    transition={{
                        duration: 7.8,
                        delay: bird.delay + 0.9,
                        repeat: Infinity,
                        repeatDelay: 7 + index * 0.38,
                        ease: 'easeInOut',
                    }}
                    style={{ top: bird.top, left: bird.left }}
                    className="absolute block h-3 w-5"
                >
                    <span className="absolute top-1/2 left-0 h-px w-3 origin-right -rotate-[28deg] bg-white/72" />
                    <span className="absolute top-1/2 right-0 h-px w-3 origin-left rotate-[28deg] bg-white/72" />
                </motion.span>
            ))}
        </div>
    );
}

function metricText(siteMetric?: SiteMetricPayload | null) {
    const value =
        siteMetric?.value ??
        siteMetric?.last24Hours ??
        siteMetric?.last_24_hours;

    if (value === null || value === undefined || String(value).trim() === '') {
        return '';
    }

    return `${String(value).trim()} public visits tracked`;
}

export default function HeroBanner({ siteMetric = null }: Props) {
    const heroRef = useRef<HTMLElement | null>(null);
    const reducedMotion = Boolean(useReducedMotion());
    const introReady = useHeroIntroAfterSystemLoader();
    const metric = metricText(siteMetric);

    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 70,
        damping: 24,
        mass: 0.86,
    });

    const imageScrollY = useTransform(
        smoothProgress,
        [0, 1],
        [0, reducedMotion ? 0 : 370],
    );
    const textScrollY = useTransform(
        smoothProgress,
        [0, 1],
        [0, reducedMotion ? 0 : 490],
    );
    const mountainScrollY = useTransform(
        smoothProgress,
        [0, 1],
        [0, reducedMotion ? 0 : 310],
    );
    const fogScrollY = useTransform(
        smoothProgress,
        [0, 1],
        [0, reducedMotion ? 0 : 220],
    );

    const imageOpacity = useTransform(
        smoothProgress,
        [0, 0.72, 1],
        [1, 0.96, 0.66],
    );
    const textOpacity = useTransform(
        smoothProgress,
        [0, 0.58, 1],
        [1, 0.78, 0.24],
    );
    const mountainOpacity = useTransform(
        smoothProgress,
        [0, 0.72, 1],
        [1, 0.72, 0.22],
    );
    const veilOpacity = useTransform(
        smoothProgress,
        [0, 0.58, 1],
        [0.06, 0.23, 0.58],
    );

    const scrollCueY = useTransform(
        smoothProgress,
        [0, 0.34],
        [0, reducedMotion ? 0 : 76],
    );
    const scrollCueOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0]);

    return (
        <section
            ref={heroRef}
            className="bccc-public-hero relative isolate h-[142svh] min-h-[54rem] w-full overflow-clip bg-[#081512] text-white"
        >
            <div className="bccc-public-hero-sticky sticky top-0 h-[100svh] min-h-[42rem] w-full overflow-hidden">
                <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_50%_18%,rgba(244,223,173,0.2),transparent_34%),linear-gradient(180deg,#071411_0%,#10372f_48%,#07110f_100%)]" />
                <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(0,0,0,0.31),transparent_30%,transparent_70%,rgba(0,0,0,0.31))]" />

                <CloudLayer active={introReady && !reducedMotion} />

                <motion.div
                    style={{ y: mountainScrollY, opacity: mountainOpacity }}
                    className="pointer-events-none absolute inset-0 z-[6] will-change-transform"
                >
                    <MountainMistLayer active={introReady && !reducedMotion} />
                </motion.div>

                <motion.div
                    aria-hidden="true"
                    style={{ y: textScrollY, opacity: textOpacity }}
                    className="bccc-public-hero-text pointer-events-none absolute inset-x-0 top-[8svh] z-[8] flex flex-col items-center justify-center overflow-hidden text-center will-change-transform"
                >
                    <motion.div
                        initial={{
                            y: reducedMotion ? 0 : '48svh',
                            opacity: reducedMotion ? 1 : 0,
                            filter: reducedMotion ? 'blur(0px)' : 'blur(20px)',
                        }}
                        animate={
                            introReady
                                ? { y: 0, opacity: 1, filter: 'blur(0px)' }
                                : {
                                      y: reducedMotion ? 0 : '48svh',
                                      opacity: reducedMotion ? 1 : 0,
                                      filter: reducedMotion
                                          ? 'blur(0px)'
                                          : 'blur(20px)',
                                  }
                        }
                        transition={{
                            duration: 1.32,
                            delay: reducedMotion ? 0 : 0.34,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        className="flex flex-col items-center will-change-transform"
                    >
                        <span className="block text-[clamp(5.6rem,21vw,25rem)] leading-[0.72] font-black tracking-[-0.14em] whitespace-nowrap text-white/[0.115] uppercase drop-shadow-[0_24px_72px_rgba(0,0,0,0.34)] select-none">
                            BAGUIO
                        </span>
                        <span className="-mt-1 block text-[clamp(3.5rem,12.5vw,15rem)] leading-[0.74] font-black tracking-[-0.13em] whitespace-nowrap text-[#f4dfad]/[0.13] uppercase drop-shadow-[0_24px_72px_rgba(0,0,0,0.28)] select-none">
                            CENTER
                        </span>
                    </motion.div>
                </motion.div>

                <motion.div
                    style={{ y: imageScrollY, opacity: imageOpacity }}
                    className="bccc-public-hero-image absolute inset-x-0 bottom-0 z-10 h-[100svh] min-h-[42rem] w-screen overflow-hidden will-change-transform"
                >
                    <motion.div
                        initial={{
                            y: reducedMotion ? 0 : '68svh',
                            opacity: reducedMotion ? 1 : 0,
                            filter: reducedMotion ? 'blur(0px)' : 'blur(14px)',
                        }}
                        animate={
                            introReady
                                ? { y: 0, opacity: 1, filter: 'blur(0px)' }
                                : {
                                      y: reducedMotion ? 0 : '68svh',
                                      opacity: reducedMotion ? 1 : 0,
                                      filter: reducedMotion
                                          ? 'blur(0px)'
                                          : 'blur(14px)',
                                  }
                        }
                        transition={{
                            duration: 1.14,
                            delay: 0,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        className="h-full w-screen will-change-transform"
                    >
                        <SafeImage
                            src={HERO_IMAGE}
                            fallbackSrc={HERO_FALLBACK}
                            alt="Baguio Convention and Cultural Center"
                            className="bccc-public-hero-photo h-full w-screen max-w-none object-cover object-center"
                            wrapperClassName="h-full w-screen max-w-none"
                        />
                    </motion.div>
                </motion.div>

                <BirdsLayer active={introReady && !reducedMotion} />

                <motion.div
                    style={{ y: fogScrollY }}
                    className="pointer-events-none absolute inset-0 z-[18] will-change-transform"
                >
                    <FogLayer active={introReady && !reducedMotion} />
                </motion.div>

                <motion.div
                    style={{ opacity: veilOpacity }}
                    className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(0,0,0,0.28),transparent_28%,transparent_60%,rgba(0,0,0,0.56))]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[30svh] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.58))]" />

                <motion.div
                    initial={{
                        opacity: reducedMotion ? 1 : 0,
                        y: reducedMotion ? 0 : 28,
                        filter: reducedMotion ? 'blur(0px)' : 'blur(10px)',
                    }}
                    animate={
                        introReady
                            ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                            : {
                                  opacity: reducedMotion ? 1 : 0,
                                  y: reducedMotion ? 0 : 28,
                                  filter: reducedMotion
                                      ? 'blur(0px)'
                                      : 'blur(10px)',
                              }
                    }
                    transition={{
                        duration: 0.86,
                        delay: reducedMotion ? 0 : 0.86,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="bccc-public-hero-copy absolute z-[31] text-left text-white"
                >
                    <p className="bccc-public-hero-kicker">
                        Official BCCC EASE public portal
                    </p>
                    <h1>Baguio Convention and Cultural Center</h1>
                    <p className="bccc-public-hero-summary">
                        Explore venue packages, public events, calendar
                        availability, and booking guidance for the Baguio
                        Convention and Cultural Center.
                    </p>

                    <div className="bccc-public-hero-actions">
                        <Link
                            href="/book"
                            className="bccc-public-hero-action bccc-public-hero-action-primary"
                        >
                            Start Booking
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/calendar"
                            className="bccc-public-hero-action bccc-public-hero-action-secondary"
                        >
                            <CalendarDays className="h-4 w-4" />
                            Check Calendar
                        </Link>
                    </div>

                    <div className="bccc-public-hero-meta">
                        <span>
                            <MapPinned className="h-3.5 w-3.5" />
                            Baguio City
                        </span>
                        <span>Venue packages</span>
                        <span>Availability checking</span>
                        {metric ? <span>{metric}</span> : null}
                    </div>
                </motion.div>

                <motion.div
                    style={{ y: scrollCueY, opacity: scrollCueOpacity }}
                    initial={{ opacity: 0, y: 18 }}
                    animate={
                        introReady
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0, y: 18 }
                    }
                    transition={{
                        duration: 0.7,
                        delay: 1.08,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute bottom-8 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-white/18 bg-black/20 px-4 py-2 text-[10px] font-black tracking-[0.22em] text-white/76 uppercase shadow-[0_18px_42px_rgba(0,0,0,0.22)] backdrop-blur-md md:inline-flex"
                >
                    <span>Scroll</span>
                    <span className="relative grid h-6 w-6 place-items-center overflow-hidden rounded-full border border-white/20">
                        <motion.span
                            animate={
                                introReady && !reducedMotion
                                    ? { y: [0, 7, 0], opacity: [0.55, 1, 0.55] }
                                    : undefined
                            }
                            transition={{
                                duration: 1.25,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </motion.span>
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
