import { motion, useReducedMotion } from 'framer-motion';

type BcccLogoLoaderProps = {
    logoSrc?: string | null;
    label?: string;
    sublabel?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
};

type BcccFullScreenLoaderProps = BcccLogoLoaderProps & {
    open: boolean;
    variant?: 'startup' | 'route' | 'inline';
};

const sizeMap = {
    sm: {
        wrap: 'h-[7rem] w-[7rem]',
        logo: 'h-[3.9rem] w-[3.9rem]',
        ringOuter: 'h-[7rem] w-[7rem]',
        ringMiddle: 'h-[5.6rem] w-[5.6rem]',
        ringInner: 'h-[4.65rem] w-[4.65rem]',
        orbitWide: 'h-[6.6rem] w-[8.9rem]',
        orbitTall: 'h-[8.4rem] w-[5.8rem]',
        text: 'text-xl',
    },
    md: {
        wrap: 'h-[10rem] w-[10rem]',
        logo: 'h-[5.5rem] w-[5.5rem]',
        ringOuter: 'h-[10rem] w-[10rem]',
        ringMiddle: 'h-[8rem] w-[8rem]',
        ringInner: 'h-[6.4rem] w-[6.4rem]',
        orbitWide: 'h-[9rem] w-[12.5rem]',
        orbitTall: 'h-[12rem] w-[8rem]',
        text: 'text-3xl',
    },
    lg: {
        wrap: 'h-[13rem] w-[13rem]',
        logo: 'h-[7rem] w-[7rem]',
        ringOuter: 'h-[13rem] w-[13rem]',
        ringMiddle: 'h-[10.5rem] w-[10.5rem]',
        ringInner: 'h-[8.2rem] w-[8.2rem]',
        orbitWide: 'h-[11.2rem] w-[16rem]',
        orbitTall: 'h-[15.4rem] w-[10.4rem]',
        text: 'text-4xl',
    },
    xl: {
        wrap: 'h-[16rem] w-[16rem]',
        logo: 'h-[8.7rem] w-[8.7rem]',
        ringOuter: 'h-[16rem] w-[16rem]',
        ringMiddle: 'h-[13rem] w-[13rem]',
        ringInner: 'h-[10rem] w-[10rem]',
        orbitWide: 'h-[13.6rem] w-[20rem]',
        orbitTall: 'h-[19rem] w-[12.8rem]',
        text: 'text-5xl',
    },
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function OrbitDot({
    className,
    delay = 0,
}: {
    className?: string;
    delay?: number;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.span
            className={cx(
                'absolute h-3 w-3 rounded-full bg-[#d8b56d] shadow-[0_0_18px_rgba(216,181,109,0.9)]',
                'dark:bg-[#f4dfad] dark:shadow-[0_0_20px_rgba(244,223,173,0.75)]',
                className,
            )}
            animate={
                reduceMotion
                    ? undefined
                    : {
                          scale: [1, 1.28, 1],
                          opacity: [0.78, 1, 0.78],
                      }
            }
            transition={
                reduceMotion
                    ? undefined
                    : {
                          duration: 1.65,
                          repeat: Infinity,
                          delay,
                          ease: 'easeInOut',
                      }
            }
        />
    );
}

function SilverOrbitDot({
    className,
    delay = 0,
}: {
    className?: string;
    delay?: number;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.span
            className={cx(
                'absolute h-2.5 w-2.5 rounded-full bg-slate-300 shadow-[0_0_16px_rgba(148,163,184,0.65)]',
                'dark:bg-white/75 dark:shadow-[0_0_18px_rgba(255,255,255,0.45)]',
                className,
            )}
            animate={
                reduceMotion
                    ? undefined
                    : {
                          scale: [1, 1.18, 1],
                          opacity: [0.55, 0.95, 0.55],
                      }
            }
            transition={
                reduceMotion
                    ? undefined
                    : {
                          duration: 1.8,
                          repeat: Infinity,
                          delay,
                          ease: 'easeInOut',
                      }
            }
        />
    );
}

export function BcccLogoLoader({
    logoSrc = '/marketing/images/logo/bccc-seal.png',
    label = 'Loading...',
    sublabel = 'Preparing your experience',
    showLabel = true,
    size = 'lg',
    className,
}: BcccLogoLoaderProps) {
    const reduceMotion = useReducedMotion();
    const sizing = sizeMap[size];

    return (
        <div
            className={cx(
                'flex flex-col items-center justify-center text-center',
                className,
            )}
        >
            <div
                className={cx('relative grid place-items-center', sizing.wrap)}
            >
                <motion.div
                    className="absolute inset-[-18%] rounded-full bg-[#d8b56d]/10 blur-3xl dark:bg-white/8"
                    animate={
                        reduceMotion
                            ? undefined
                            : {
                                  opacity: [0.38, 0.78, 0.38],
                                  scale: [0.92, 1.08, 0.92],
                              }
                    }
                    transition={
                        reduceMotion
                            ? undefined
                            : {
                                  duration: 2.2,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                              }
                    }
                />

                <motion.div
                    className={cx(
                        'absolute rounded-full border border-slate-400/25 dark:border-white/16',
                        sizing.orbitWide,
                    )}
                    style={{ transform: 'rotate(-18deg)' }}
                    animate={
                        reduceMotion
                            ? undefined
                            : {
                                  rotate: [342, 702],
                              }
                    }
                    transition={
                        reduceMotion
                            ? undefined
                            : {
                                  duration: 4.8,
                                  repeat: Infinity,
                                  ease: 'linear',
                              }
                    }
                >
                    <OrbitDot
                        className="top-1/2 left-[-0.15rem] -translate-y-1/2"
                        delay={0.1}
                    />
                    <SilverOrbitDot
                        className="top-[18%] right-[0.25rem]"
                        delay={0.3}
                    />
                </motion.div>

                <motion.div
                    className={cx(
                        'absolute rounded-full border border-slate-400/20 dark:border-white/12',
                        sizing.orbitTall,
                    )}
                    style={{ transform: 'rotate(34deg)' }}
                    animate={
                        reduceMotion
                            ? undefined
                            : {
                                  rotate: [34, -326],
                              }
                    }
                    transition={
                        reduceMotion
                            ? undefined
                            : {
                                  duration: 5.6,
                                  repeat: Infinity,
                                  ease: 'linear',
                              }
                    }
                >
                    <OrbitDot className="top-[8%] right-[0.2rem]" delay={0.2} />
                    <SilverOrbitDot
                        className="bottom-[7%] left-[18%]"
                        delay={0.45}
                    />
                </motion.div>

                <motion.div
                    className={cx(
                        'absolute rounded-full border border-transparent',
                        sizing.ringOuter,
                    )}
                    style={{
                        background:
                            'conic-gradient(from 0deg, transparent 0deg, transparent 35deg, rgba(216,181,109,.95) 42deg, rgba(216,181,109,.95) 74deg, transparent 86deg, transparent 164deg, rgba(148,163,184,.55) 172deg, rgba(148,163,184,.55) 214deg, transparent 226deg, transparent 360deg)',
                        WebkitMask:
                            'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
                    }}
                    animate={
                        reduceMotion
                            ? undefined
                            : {
                                  rotate: 360,
                              }
                    }
                    transition={
                        reduceMotion
                            ? undefined
                            : {
                                  duration: 2.25,
                                  repeat: Infinity,
                                  ease: 'linear',
                              }
                    }
                />

                <motion.div
                    className={cx('absolute rounded-full', sizing.ringMiddle)}
                    style={{
                        background:
                            'conic-gradient(from 160deg, transparent 0deg, transparent 24deg, rgba(99,110,119,.75) 34deg, rgba(99,110,119,.75) 77deg, transparent 86deg, transparent 146deg, rgba(99,110,119,.62) 154deg, rgba(99,110,119,.62) 194deg, transparent 206deg, transparent 278deg, rgba(99,110,119,.7) 288deg, rgba(99,110,119,.7) 330deg, transparent 342deg)',
                        WebkitMask:
                            'radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px))',
                    }}
                    animate={
                        reduceMotion
                            ? undefined
                            : {
                                  rotate: -360,
                              }
                    }
                    transition={
                        reduceMotion
                            ? undefined
                            : {
                                  duration: 3.25,
                                  repeat: Infinity,
                                  ease: 'linear',
                              }
                    }
                />

                <motion.div
                    className={cx('absolute rounded-full', sizing.ringInner)}
                    style={{
                        background:
                            'conic-gradient(from 35deg, transparent 0deg, transparent 30deg, rgba(216,181,109,.55) 36deg, rgba(216,181,109,.55) 72deg, transparent 78deg, transparent 188deg, rgba(216,181,109,.45) 196deg, rgba(216,181,109,.45) 228deg, transparent 238deg)',
                        WebkitMask:
                            'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
                    }}
                    animate={
                        reduceMotion
                            ? undefined
                            : {
                                  rotate: 360,
                              }
                    }
                    transition={
                        reduceMotion
                            ? undefined
                            : {
                                  duration: 1.8,
                                  repeat: Infinity,
                                  ease: 'linear',
                              }
                    }
                />

                <motion.div
                    className={cx(
                        'relative z-20 grid place-items-center overflow-hidden rounded-full border border-[#d9c7a6]/80 bg-white',
                        'shadow-[0_24px_80px_rgba(47,37,23,0.20),inset_0_0_0_1px_rgba(255,255,255,0.75)]',
                        'dark:border-white/12 dark:bg-[#111418] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.08)]',
                        sizing.logo,
                    )}
                    animate={
                        reduceMotion
                            ? undefined
                            : {
                                  scale: [1, 1.035, 1],
                              }
                    }
                    transition={
                        reduceMotion
                            ? undefined
                            : {
                                  duration: 1.55,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                              }
                    }
                >
                    <img
                        src={logoSrc || '/marketing/images/logo/bccc-seal.png'}
                        alt="BCCC EASE"
                        className="h-full w-full object-contain p-2"
                        draggable={false}
                        onError={(event) => {
                            event.currentTarget.src =
                                '/marketing/images/logo/bccc-seal.png';
                        }}
                    />
                </motion.div>
            </div>

            {showLabel ? (
                <div className="mt-7">
                    <motion.p
                        className={cx(
                            'font-light tracking-[-0.05em] text-[#2f3a45] dark:text-white',
                            sizing.text,
                        )}
                        animate={
                            reduceMotion
                                ? undefined
                                : {
                                      opacity: [0.72, 1, 0.72],
                                  }
                        }
                        transition={
                            reduceMotion
                                ? undefined
                                : {
                                      duration: 1.8,
                                      repeat: Infinity,
                                      ease: 'easeInOut',
                                  }
                        }
                    >
                        {label}
                    </motion.p>

                    {sublabel ? (
                        <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base dark:text-white/50">
                            {sublabel}
                        </p>
                    ) : null}

                    <div className="mx-auto mt-5 flex w-28 items-center justify-center gap-3">
                        {[0, 1, 2].map((item) => (
                            <motion.span
                                key={item}
                                className={cx(
                                    'h-2 w-2 rounded-full',
                                    item === 1
                                        ? 'bg-[#d8b56d] shadow-[0_0_16px_rgba(216,181,109,0.75)]'
                                        : 'bg-slate-300 dark:bg-white/35',
                                )}
                                animate={
                                    reduceMotion
                                        ? undefined
                                        : {
                                              opacity:
                                                  item === 1
                                                      ? [0.7, 1, 0.7]
                                                      : [0.28, 0.62, 0.28],
                                              y: [0, -3, 0],
                                          }
                                }
                                transition={
                                    reduceMotion
                                        ? undefined
                                        : {
                                              duration: 0.95,
                                              repeat: Infinity,
                                              delay: item * 0.13,
                                              ease: 'easeInOut',
                                          }
                                }
                            />
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function BcccFullScreenLoader({
    open,
    logoSrc = '/marketing/images/logo/bccc-seal.png',
    label = 'Loading...',
    sublabel = 'Preparing your experience',
    showLabel = true,
    size = 'lg',
    className,
    variant = 'startup',
}: BcccFullScreenLoaderProps) {
    if (!open) {
        return null;
    }

    return (
        <motion.div
            className={cx(
                'bccc-full-screen-loader no-print',
                'fixed inset-0 z-[999980] grid place-items-center overflow-hidden px-4',
                'bg-white/72 backdrop-blur-2xl',
                'dark:bg-[#0b0e13]/76 dark:backdrop-blur-2xl',
                className,
            )}
            role="status"
            aria-live="polite"
            aria-label={`${label} ${sublabel}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.88),rgba(255,255,255,0.58)_42%,rgba(236,241,245,0.68)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(15,18,24,0.68)_44%,rgba(6,8,13,0.88)_100%)]" />
                <div className="absolute top-[-14rem] left-[-14rem] h-[34rem] w-[34rem] rounded-full bg-[#d8b56d]/10 blur-3xl dark:bg-[#d8b56d]/6" />
                <div className="absolute right-[-12rem] bottom-[-16rem] h-[36rem] w-[36rem] rounded-full bg-slate-300/18 blur-3xl dark:bg-white/5" />

                <motion.div
                    className="absolute inset-0 opacity-50 dark:opacity-25"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 18% 24%, rgba(255,255,255,.85) 0 2px, transparent 3px), radial-gradient(circle at 72% 18%, rgba(216,181,109,.34) 0 2px, transparent 3px), radial-gradient(circle at 78% 72%, rgba(255,255,255,.72) 0 2px, transparent 3px), radial-gradient(circle at 30% 78%, rgba(216,181,109,.25) 0 2px, transparent 3px)',
                    }}
                    animate={{
                        opacity: [0.35, 0.68, 0.35],
                    }}
                    transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            <motion.div
                className="relative"
                initial={
                    variant === 'startup'
                        ? {
                              opacity: 0,
                              y: 18,
                              scale: 0.96,
                              filter: 'blur(10px)',
                          }
                        : {
                              opacity: 0,
                              y: 10,
                              scale: 0.98,
                              filter: 'blur(6px)',
                          }
                }
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, scale: 0.98, filter: 'blur(8px)' }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
                <BcccLogoLoader
                    logoSrc={logoSrc}
                    label={label}
                    sublabel={sublabel}
                    showLabel={showLabel}
                    size={size}
                />
            </motion.div>
        </motion.div>
    );
}
export const BcccPageLoader = BcccFullScreenLoader;
export default BcccLogoLoader;
