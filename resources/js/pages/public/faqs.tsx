import PublicLayout from '@/layouts/public-layout';
import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowRight,
    CalendarCheck2,
    FileQuestion,
    HelpCircle,
    MessageCircle,
    ShieldCheck,
    WalletCards,
} from 'lucide-react';

const faqSections = [
    {
        title: 'Booking and Availability',
        icon: CalendarCheck2,
        items: [
            {
                question: 'How do I know if a date can be booked?',
                answer: 'Use the availability checker or the booking calendar. A date must have AM or PM availability to be bookable. EVE is reserved for approved additional hours and cannot make a date bookable by itself.',
            },
            {
                question: 'Can I reserve skipped dates in one booking?',
                answer: 'No. Multi-day reservations must be continuous. Choose the first date, then add each following date one by one so there are no gaps in the booking schedule.',
            },
            {
                question: 'What happens after I submit a reservation request?',
                answer: 'The request is sent for BCCC review. The office still checks schedule accuracy, venue scope, event details, and payment compliance before the booking becomes fully confirmed.',
            },
        ],
    },
    {
        title: 'Rates and Discounts',
        icon: WalletCards,
        items: [
            {
                question: 'Which venue charges are active in the system?',
                answer: 'The active choices are Full Hall, Main Hall, LED Wall, Lounge, and Boardroom. Lobby access is included with Full Hall and is not charged as a standalone venue item.',
            },
            {
                question: 'How is the Government discount applied?',
                answer: 'Government organization bookings receive a 50% discount on the overall computed total. This discount does not stack with the 5% continuous-day discount or the 30% ingress/egress discount.',
            },
            {
                question: 'When do I see discount details?',
                answer: 'Discounts are shown during final review and admin billing. They remain subject to BCCC assessment before the billing computation is finalized.',
            },
        ],
    },
    {
        title: 'Payments and Confirmation',
        icon: ShieldCheck,
        items: [
            {
                question:
                    'Does uploading payment proof automatically confirm the booking?',
                answer: 'No. Uploaded proof starts as pending until BCCC staff review and confirm it. Only confirmed payments count toward the payable balance.',
            },
            {
                question: 'What payment amount should be submitted first?',
                answer: 'The system computes the required down payment and refundable bond when applicable. The booking page shows the remaining payable amount based on confirmed payments.',
            },
            {
                question: 'Can BCCC decline a submitted payment proof?',
                answer: 'Yes. If the proof, reference, or amount needs correction, staff can decline it and the client may submit a corrected proof.',
            },
        ],
    },
    {
        title: 'Cancellation and Support',
        icon: MessageCircle,
        items: [
            {
                question: 'When is cancellation free?',
                answer: 'Cancellation has no charge as long as it is made at least two weeks before the scheduled event date.',
            },
            {
                question: 'What fees apply for late cancellation?',
                answer: 'A 20% administrative fee applies when cancelled later than two weeks before the event, 30% when later than one week before the event, and 75% after office hours the day before or on the event day.',
            },
            {
                question: 'Who should I contact for unclear booking details?',
                answer: 'Use the contact page or reach the BCCC office through the listed public contact details. Include your booking reference when available so staff can locate the request quickly.',
            },
        ],
    },
];

const ease = [0.22, 1, 0.36, 1] as const;

function sectionId(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function FaqsPage() {
    const reduceMotion = useReducedMotion();

    return (
        <PublicLayout>
            <Head title="Frequently Asked Questions" />

            <section className="relative min-h-[66svh] overflow-hidden bg-[#080806] pt-32 text-white lg:pt-36">
                <img
                    src="/marketing/images/hero/noon2.jpg"
                    alt="BCCC public frequently asked questions"
                    className="absolute inset-0 h-full w-full object-cover opacity-70 dark:hidden"
                    draggable={false}
                />
                <img
                    src="/marketing/images/hero/night2.png"
                    alt="BCCC public frequently asked questions"
                    className="absolute inset-0 hidden h-full w-full object-cover opacity-68 dark:block"
                    draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080806] via-[#080806]/64 to-black/26" />

                <div className="public-container relative z-10 grid min-h-[calc(66svh-9rem)] gap-8 pb-12 lg:grid-cols-[1fr_0.72fr] lg:items-end">
                    <motion.div
                        initial={
                            reduceMotion
                                ? { opacity: 1 }
                                : { opacity: 0, y: 30, filter: 'blur(12px)' }
                        }
                        animate={
                            reduceMotion
                                ? { opacity: 1 }
                                : { opacity: 1, y: 0, filter: 'blur(0px)' }
                        }
                        transition={{ duration: 0.78, ease }}
                    >
                        <div className="inline-flex items-center gap-2 border border-[#f4dfad]/26 bg-[#f4dfad]/10 px-3 py-2 text-[10px] font-black tracking-[0.28em] text-[#f4dfad] uppercase">
                            <FileQuestion className="h-3.5 w-3.5" />
                            FAQs
                        </div>

                        <h1 className="mt-5 max-w-5xl text-[clamp(2.8rem,7vw,6.4rem)] leading-[0.92] font-medium tracking-normal text-white">
                            BCCC booking answers in one place.
                        </h1>
                    </motion.div>

                    <motion.aside
                        initial={
                            reduceMotion
                                ? { opacity: 1 }
                                : { opacity: 0, y: 24, filter: 'blur(10px)' }
                        }
                        animate={
                            reduceMotion
                                ? { opacity: 1 }
                                : { opacity: 1, y: 0, filter: 'blur(0px)' }
                        }
                        transition={{ duration: 0.78, ease, delay: 0.12 }}
                        className="border border-white/12 bg-white/[0.075] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
                    >
                        <p className="text-[10px] font-black tracking-[0.28em] text-[#f4dfad] uppercase">
                            Quick Sections
                        </p>

                        <div className="mt-4 grid gap-2">
                            {faqSections.map((section) => (
                                <a
                                    key={section.title}
                                    href={`#${sectionId(section.title)}`}
                                    className="flex items-center justify-between border border-white/10 bg-white/[0.055] px-4 py-3 text-xs font-black tracking-[0.16em] text-white/72 uppercase transition hover:border-[#f4dfad]/35 hover:text-[#f4dfad]"
                                >
                                    {section.title}
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </motion.aside>
                </div>
            </section>

            <section className="public-section">
                <div className="public-container">
                    <div className="mb-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                        <div>
                            <div className="bccc-section-kicker">
                                <HelpCircle className="h-3.5 w-3.5" />
                                Local Answers
                            </div>

                            <h2 className="bccc-section-title-sm mt-4">
                                Common questions before, during, and after a
                                reservation request.
                            </h2>
                        </div>

                        <p className="bccc-section-copy lg:justify-self-end">
                            These answers are specific to the BCCC EASE public
                            booking flow and may still be subject to final
                            office validation.
                        </p>
                    </div>

                    <div className="grid gap-5">
                        {faqSections.map((section, sectionIndex) => {
                            const Icon = section.icon;

                            return (
                                <motion.article
                                    id={sectionId(section.title)}
                                    key={section.title}
                                    initial={
                                        reduceMotion
                                            ? { opacity: 1 }
                                            : {
                                                  opacity: 0,
                                                  y: 24,
                                                  filter: 'blur(10px)',
                                              }
                                    }
                                    whileInView={
                                        reduceMotion
                                            ? { opacity: 1 }
                                            : {
                                                  opacity: 1,
                                                  y: 0,
                                                  filter: 'blur(0px)',
                                              }
                                    }
                                    viewport={{ once: true, amount: 0.16 }}
                                    transition={{
                                        duration: 0.58,
                                        ease,
                                        delay: Math.min(
                                            sectionIndex * 0.06,
                                            0.24,
                                        ),
                                    }}
                                    className="grid overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl lg:grid-cols-[0.36fr_1fr]"
                                >
                                    <div className="relative bg-[#0b1510] p-6 text-white sm:p-8">
                                        <div className="relative">
                                            <div className="flex h-14 w-14 items-center justify-center border border-[#f4dfad]/30 bg-[#f4dfad]/10 text-[#f4dfad]">
                                                <Icon className="h-6 w-6" />
                                            </div>

                                            <p className="mt-6 text-[10px] font-black tracking-[0.28em] text-[#f4dfad] uppercase">
                                                FAQ Section
                                            </p>

                                            <h3 className="mt-3 text-3xl font-semibold tracking-normal text-white">
                                                {section.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 p-5 sm:p-6 lg:p-8">
                                        {section.items.map((item) => (
                                            <details
                                                key={item.question}
                                                className="group border border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] p-4"
                                            >
                                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[var(--bccc-text)]">
                                                    {item.question}
                                                    <ArrowRight className="h-4 w-4 shrink-0 transition group-open:rotate-90" />
                                                </summary>
                                                <p className="mt-3 text-sm leading-7 text-[var(--bccc-text-muted)]">
                                                    {item.answer}
                                                </p>
                                            </details>
                                        ))}
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link href="/book" className="bccc-button-primary">
                            Start Booking
                            <ArrowRight className="h-4 w-4" />
                        </Link>

                        <Link href="/contact" className="bccc-button-secondary">
                            Contact Office
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
