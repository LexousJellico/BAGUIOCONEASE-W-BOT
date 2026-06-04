import type { SiteSettings } from '@/layouts/public-layout';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    ArrowUpRight,
    FileQuestion,
    Info,
    Landmark,
    Palette,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Props = {
    siteSettings?: SiteSettings | null;
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function FloatingQuickLinks({ siteSettings }: Props) {
    const reduceMotion = useReducedMotion();
    const [open, setOpen] = useState(false);

    const links = useMemo(() => {
        const visitaUrl =
            siteSettings?.visitaUrl ||
            siteSettings?.visita_url ||
            'https://visita.baguio.gov.ph';

        const artsUrl =
            siteSettings?.creativeBaguioUrl ||
            siteSettings?.creative_baguio_url ||
            siteSettings?.arts_url ||
            'https://creativecity.baguio.gov.ph';

        const faqsUrl =
            typeof siteSettings?.faqsUrl === 'string'
                ? siteSettings.faqsUrl
                : typeof siteSettings?.faqs_url === 'string'
                  ? siteSettings.faqs_url
                  : '/faqs';

        return [
            {
                label: 'FAQs',
                description: 'BCCC booking answers',
                href: faqsUrl || '/faqs',
                icon: FileQuestion,
                external: false,
            },
            {
                label: 'VISITA',
                description: 'Baguio tourist assistance',
                href: visitaUrl,
                icon: Landmark,
                external: true,
            },
            {
                label: 'ARTS',
                description: 'Creative Baguio portal',
                href: artsUrl,
                icon: Palette,
                external: true,
            },
        ];
    }, [siteSettings]);

    return (
        <div
            className="bccc-floating-quick-links fixed right-4 bottom-24 z-[99970] flex flex-col items-end gap-3 sm:right-6 sm:bottom-28"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={(event) => {
                if (
                    !event.currentTarget.contains(
                        event.relatedTarget as Node | null,
                    )
                ) {
                    setOpen(false);
                }
            }}
        >
            <AnimatePresence>
                {open ? (
                    <motion.div
                        className="bccc-floating-quick-links-panel flex flex-col items-end gap-2"
                        initial={
                            reduceMotion
                                ? false
                                : {
                                      opacity: 0,
                                      y: 12,
                                      scale: 0.96,
                                      filter: 'blur(8px)',
                                  }
                        }
                        animate={
                            reduceMotion
                                ? undefined
                                : {
                                      opacity: 1,
                                      y: 0,
                                      scale: 1,
                                      filter: 'blur(0px)',
                                  }
                        }
                        exit={
                            reduceMotion
                                ? undefined
                                : {
                                      opacity: 0,
                                      y: 12,
                                      scale: 0.96,
                                      filter: 'blur(8px)',
                                  }
                        }
                        transition={{ duration: 0.26, ease }}
                    >
                        {links.map((link, index) => {
                            const Icon = link.icon;

                            return (
                                <motion.a
                                    key={link.label}
                                    href={link.href}
                                    target={
                                        link.external ? '_blank' : undefined
                                    }
                                    rel={
                                        link.external ? 'noreferrer' : undefined
                                    }
                                    onClick={() => setOpen(false)}
                                    className="group flex min-h-14 w-[17rem] items-center gap-3 rounded-[1.25rem] border border-black/10 bg-white/90 px-3.5 text-left text-[#241a0d] shadow-[0_20px_60px_rgba(31,23,12,0.16)] backdrop-blur-2xl transition duration-300 hover:-translate-x-1 hover:border-[#b08d48]/50 hover:bg-white dark:border-white/10 dark:bg-[#111418]/90 dark:text-white dark:hover:bg-[#161b21]"
                                    initial={
                                        reduceMotion
                                            ? false
                                            : {
                                                  opacity: 0,
                                                  x: 18,
                                                  y: 10,
                                                  scale: 0.96,
                                              }
                                    }
                                    animate={
                                        reduceMotion
                                            ? undefined
                                            : {
                                                  opacity: 1,
                                                  x: 0,
                                                  y: 0,
                                                  scale: 1,
                                              }
                                    }
                                    exit={
                                        reduceMotion
                                            ? undefined
                                            : {
                                                  opacity: 0,
                                                  x: 18,
                                                  y: 10,
                                                  scale: 0.96,
                                              }
                                    }
                                    transition={{
                                        duration: 0.28,
                                        delay: index * 0.045,
                                        ease,
                                    }}
                                >
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f2e6ce] text-[#7d5d29] transition group-hover:bg-[#2f2517] group-hover:text-white dark:bg-white/10 dark:text-[#f3d995]">
                                        <Icon className="h-4.5 w-4.5" />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[11px] font-bold tracking-[0.22em] uppercase">
                                            {link.label}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-[#6f604f] dark:text-white/62">
                                            {link.description}
                                        </span>
                                    </span>

                                    <ArrowUpRight className="h-4 w-4 shrink-0 opacity-55 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                                </motion.a>
                            );
                        })}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <motion.button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="group relative grid h-14 w-14 place-items-center rounded-full border border-[#b08d48]/30 bg-[#2f2517] text-white shadow-[0_24px_70px_rgba(47,37,23,0.32)] transition duration-300 hover:-translate-y-1 hover:bg-[#4b3a22] dark:border-white/15 dark:bg-white dark:text-[#17120b]"
                aria-label="Open VISITA and Arts quick links"
                aria-expanded={open}
                animate={
                    reduceMotion
                        ? undefined
                        : {
                              y: [0, -5, 0],
                          }
                }
                transition={
                    reduceMotion
                        ? undefined
                        : {
                              duration: 3,
                              repeat: Infinity,
                              ease: 'easeInOut',
                          }
                }
            >
                <span className="absolute inset-0 rounded-full border border-white/20 opacity-0 transition group-hover:scale-125 group-hover:opacity-100" />
                {open ? (
                    <X className="h-5 w-5" />
                ) : (
                    <Info className="h-5 w-5" />
                )}
            </motion.button>
        </div>
    );
}
