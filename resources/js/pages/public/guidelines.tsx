import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

const sections = [
  {
    title: 'Booking Preparation',
    icon: ClipboardList,
    points: [
      'Check the preferred venue, schedule, and guest count before opening the formal booking form.',
      'Prepare event details, organization details, and the contact person information in advance.',
      'Review whether the request is private or intended for possible public posting before submission.',
      'Use the availability checker and public calendar first so you can avoid blocked or occupied dates.',
    ],
  },
  {
    title: 'Payment and Pencil Booking Reminder',
    icon: WalletCards,
    points: [
      'A booking request may still undergo staff review, validation, and payment compliance before it becomes fully settled.',
      'Clients should keep their reference numbers, proof images, and official payment details accurate and complete.',
      'Down payment and remaining balance requirements follow the configured booking rules and office validation steps.',
      'Pending payment uploads do not automatically mean final confirmation until the office completes review.',
    ],
  },
  {
    title: 'Venue Conduct and Responsibilities',
    icon: ShieldCheck,
    points: [
      'Observe proper use of the venue, follow approved staff directions, and keep shared areas safe and orderly.',
      'Ingress, setup, service coordination, and venue use must follow the approved arrangement and current house rules.',
      'Clients are expected to protect equipment, observe cleanliness, and avoid unauthorized use of restricted areas.',
      'Any activity that affects safety, facility order, or public operations may be subject to additional office review.',
    ],
  },
  {
    title: 'Terms, Conditions, and Public Notes',
    icon: BookOpenText,
    points: [
      'Availability shown on the public side is informative and may still be subject to final operational confirmation.',
      'Public events may be displayed to other users, while private bookings remain hidden from public details.',
      'Cancellation, payment compliance, and operational approval remain governed by the current office workflow and applicable policies.',
      'When in doubt, use the contact and enquiry page so the office can clarify booking, payment, and venue-use requirements.',
    ],
  },
];

const easeLuxury = [0.22, 1, 0.36, 1] as const;

export default function GuidelinesPage() {
  const reduceMotion = useReducedMotion();

  return (
    <PublicLayout>
      <Head title="Guidelines" />

      <section className="relative min-h-[72svh] overflow-hidden bg-[#080806] pt-32 text-white lg:pt-36">
        <img
          src="/marketing/images/hero/noon2.jpg"
          alt="BCCC Guidelines"
          className="absolute inset-0 h-full w-full object-cover opacity-68 dark:hidden"
          draggable={false}
        />

        <img
          src="/marketing/images/hero/night2.png"
          alt="BCCC Guidelines"
          className="absolute inset-0 hidden h-full w-full object-cover opacity-68 dark:block"
          draggable={false}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_38%,rgba(0,0,0,0.86)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080806] via-[#080806]/58 to-black/24" />

        <div className="public-container relative z-10 grid min-h-[calc(72svh-9rem)] gap-8 pb-12 lg:grid-cols-[1fr_0.76fr] lg:items-end">
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 30, filter: 'blur(12px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.78, ease: easeLuxury }}
          >
            <div className="inline-flex items-center gap-2 border border-[#f4dfad]/26 bg-[#f4dfad]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
              <BookOpenText className="h-3.5 w-3.5" />
              Guidelines
            </div>

            <h1 className="mt-5 max-w-5xl text-[clamp(3rem,8vw,7.5rem)] font-medium leading-[0.88] tracking-[-0.085em] text-white">
              Clear reminders before you book.
            </h1>
          </motion.div>

          <motion.aside
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: 'blur(10px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.78, ease: easeLuxury, delay: 0.12 }}
            className="border border-white/12 bg-white/[0.075] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
              Public Notice
            </p>

            <p className="mt-4 text-sm leading-8 text-white/68">
              These guidelines help clients prepare event details, understand payment review reminders, and coordinate responsibly with the office.
            </p>

            <div className="mt-5 grid gap-2">
              {sections.map((section) => (
                <a
                  key={section.title}
                  href={`#${section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="flex items-center justify-between border border-white/10 bg-white/[0.055] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/72 transition hover:border-[#f4dfad]/35 hover:text-[#f4dfad]"
                >
                  {section.title}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.aside>
        </div>
      </section>

      <section className="public-section relative overflow-hidden">
        <div className="public-container">
          <div className="mb-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <div className="bccc-section-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                Client Preparation
              </div>

              <h2 className="mt-4 bccc-section-title-sm">
                Review these sections before submitting a formal booking request.
              </h2>
            </div>

            <p className="bccc-section-copy lg:justify-self-end">
              These public notes are informational and may still be subject to final office validation, operational rules, and applicable policies.
            </p>
          </div>

          <div className="grid gap-5">
            {sections.map((section, sectionIndex) => {
              const Icon = section.icon;
              const id = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

              return (
                <motion.article
                  id={id}
                  key={section.title}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: 'blur(10px)' }}
                  whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.16 }}
                  transition={{ duration: 0.58, ease: easeLuxury, delay: Math.min(sectionIndex * 0.06, 0.24) }}
                  className="grid overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl lg:grid-cols-[0.42fr_1fr]"
                >
                  <div className="relative overflow-hidden bg-[#080906] p-6 text-white sm:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,223,173,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(47,106,85,0.22),transparent_44%)]" />

                    <div className="relative">
                      <div className="flex h-14 w-14 items-center justify-center border border-[#f4dfad]/30 bg-[#f4dfad]/10 text-[#f4dfad]">
                        <Icon className="h-6 w-6" />
                      </div>

                      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
                        Policy Section
                      </p>

                      <h3 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-white">
                        {section.title}
                      </h3>
                    </div>
                  </div>

                  <div className="grid gap-3 p-5 sm:p-6 lg:p-8">
                    {section.points.map((point, index) => (
                      <div
                        key={`${section.title}-${index}`}
                        className="flex items-start gap-3 border border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] p-4"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bccc-gold-700)]" />
                        <p className="text-sm leading-7 text-[var(--bccc-text-muted)]">
                          {point}
                        </p>
                      </div>
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
