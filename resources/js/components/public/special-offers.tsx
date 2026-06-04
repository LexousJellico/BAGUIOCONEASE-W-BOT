import LuxuryHorizontalRail from '@/components/public/luxury-horizontal-rail';
import SafeImage from '@/components/system/safe-image';
import BcccEmptyState, { BcccEmptyStateLink } from '@/components/ui/bccc-empty-state';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    ArrowUpRight,
    ChevronDown,
    Gift,
    HelpCircle,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Send,
    Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SiteSettings } from '@/layouts/public-layout';
import type { FeaturePackageItem } from '@/types/public-content';

type ChatMessage = {
    role: 'assistant' | 'user';
    text: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

const FAQ_ITEMS = [
    {
        question: 'How do I check if a date is available?',
        answer:
            'Use the availability checker or public calendar. Review the selected venue area, date range, and available time blocks before proceeding.',
    },
    {
        question: 'Can I request several dates at once?',
        answer:
            'Yes. The booking workflow can support date ranges and additional schedule entries depending on the event requirement.',
    },
    {
        question: 'What do AM, PM, and EVE mean?',
        answer:
            'AM is the morning block, PM is the afternoon block, and EVE is the evening block. Some dates may still have partial availability.',
    },
    {
        question: 'What happens after I submit a booking?',
        answer:
            'The request goes through office review, schedule validation, and payment/proof checking before final confirmation.',
    },
];

function answerFor(input: string) {
    const text = input.toLowerCase().trim();

    if (!text) {
        return 'Ask about date availability, booking steps, payments, venue choices, public events, or policy reminders.';
    }

    if (text.includes('availability') || text.includes('available') || text.includes('date')) {
        return 'Choose your preferred date range and venue area first. A date may still be usable if at least one AM, PM, or EVE block remains available.';
    }

    if (text.includes('payment') || text.includes('proof')) {
        return 'After submission, prepare the required payment details and proof file. Staff will review the payment before the booking is fully confirmed.';
    }

    if (text.includes('book') || text.includes('booking')) {
        return 'The normal flow is: check availability, complete the booking form, submit the request, then wait for office review and payment instructions.';
    }

    if (text.includes('venue') || text.includes('hall') || text.includes('room') || text.includes('space')) {
        return 'Common venue options include Full Hall, Main Hall, Foyer & Lobby Area, VIP Lounge, Board Room, Basement, and Gallery2600.';
    }

    if (text.includes('event') || text.includes('city') || text.includes('calendar')) {
        return 'Public events and approved public calendar titles can appear on the calendar. Private client details should remain protected.';
    }

    return 'I can help with booking flow, availability, time blocks, venue options, payments, and public calendar guidance.';
}

function offerImage(offer: FeaturePackageItem) {
    return (
        offer.lightImage ||
        offer.light_image ||
        offer.image ||
        offer.imageUrl ||
        offer.image_url ||
        offer.thumbnail ||
        offer.thumbnail_url ||
        offer.images?.[0] ||
        '/marketing/images/facilities/darkvip.JPG'
    );
}

function OfferCard({ offer, index }: { offer: FeaturePackageItem; index: number }) {
    const lightImage = offerImage(offer);
    const darkImage = offer.darkImage || offer.dark_image || lightImage;
    const href = offer.href || offer.url || '/book';

    return (
        <motion.article
            className="group relative min-h-[27rem] overflow-hidden rounded-[1.55rem] border border-black/10 bg-white shadow-[0_24px_70px_rgba(40,29,13,0.12)] [flex:0_0_82vw] dark:border-white/10 dark:bg-[#111418] sm:[flex:0_0_22rem] lg:[flex:0_0_calc((100%_-_3rem)_/_4)]"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.22 }}
            transition={{ duration: 0.48, delay: Math.min(index * 0.045, 0.18), ease }}
        >
            <Link href={href} className="absolute inset-0 z-20" aria-label={`Open ${offer.title}`} />

            <div className="absolute inset-0">
                <SafeImage
                    src={lightImage}
                    fallbackSrc="/marketing/images/facilities/darkvip.JPG"
                    alt={offer.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105 dark:hidden"
                    wrapperClassName="h-full w-full rounded-none border-0"
                />

                <SafeImage
                    src={darkImage}
                    fallbackSrc="/marketing/images/facilities/darkvip.JPG"
                    alt={offer.title}
                    className="hidden h-full w-full object-cover transition duration-700 group-hover:scale-105 dark:block"
                    wrapperClassName="hidden h-full w-full rounded-none border-0 dark:grid"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#100b05]/92 via-[#100b05]/34 to-transparent" />
            </div>

            <div className="relative z-10 flex h-full min-h-[27rem] flex-col justify-between p-5 text-white">
                <span className="w-fit rounded-full border border-white/18 bg-white/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-xl">
                    Special Offer
                </span>

                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4dfad]">
                        {offer.subtitle || offer.eyebrow || offer.priceLabel || offer.price_label || 'Featured package'}
                    </p>

                    <h3 className="mt-2 font-serif text-3xl font-light leading-tight tracking-[-0.04em]">
                        {offer.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/72">
                        {offer.description || offer.summary || 'Explore this highlighted event-ready option.'}
                    </p>

                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#f4dfad]">
                        {offer.buttonLabel || offer.button_label || offer.ctaLabel || offer.cta_label || 'View Offer'}
                        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                </div>
            </div>
        </motion.article>
    );
}

function ContactPanel({ siteSettings }: { siteSettings?: SiteSettings }) {
    const openMapUrl =
        siteSettings?.openMapUrl ||
        'https://www.google.com/maps/search/?api=1&query=Baguio%20Convention%20and%20Cultural%20Center';

    return (
        <section className="rounded-[1.75rem] border border-black/10 bg-white/80 p-5 shadow-[0_24px_70px_rgba(40,29,13,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9b7739]">
                Contact and Location
            </p>

            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#21180d] dark:text-white">
                Speak with the BCCC office before reserving your event.
            </h3>

            <div className="mt-5 grid gap-3 text-sm text-[#625540] dark:text-white/68">
                <a href={openMapUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-[#9b7739]">
                    <MapPin className="h-4 w-4 text-[#9b7739]" />
                    {siteSettings?.address || 'Baguio Convention and Cultural Center, Baguio City'}
                </a>

                <a href={`tel:${siteSettings?.phone || '(074) 446 2009'}`} className="flex items-center gap-3 hover:text-[#9b7739]">
                    <Phone className="h-4 w-4 text-[#9b7739]" />
                    {siteSettings?.phone || '(074) 446 2009'}
                </a>

                <a href={`mailto:${siteSettings?.email || 'info@bccc-ease.com'}`} className="flex items-center gap-3 hover:text-[#9b7739]">
                    <Mail className="h-4 w-4 text-[#9b7739]" />
                    {siteSettings?.email || 'info@bccc-ease.com'}
                </a>
            </div>

            <Link
                href="/contact"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
            >
                Contact the Office
                <ArrowRight className="h-4 w-4" />
            </Link>
        </section>
    );
}

function ClientGuideChatbot() {
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            text: 'Hello. Ask me about bookings, payments, availability, venue options, public events, or policy reminders.',
        },
    ]);

    const chatBodyRef = useRef<HTMLDivElement | null>(null);

    const sendMessage = () => {
        const trimmed = chatInput.trim();

        if (!trimmed) {
            return;
        }

        setMessages((current) => [
            ...current,
            { role: 'user', text: trimmed },
            { role: 'assistant', text: answerFor(trimmed) },
        ]);

        setChatInput('');
    };

    useEffect(() => {
        if (!chatBodyRef.current) {
            return;
        }

        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }, [messages]);

    return (
        <section className="rounded-[1.75rem] border border-black/10 bg-white/80 p-5 shadow-[0_24px_70px_rgba(40,29,13,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9b7739]">
                Client Guide
            </p>

            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#21180d] dark:text-white">
                Quick answers before reaching staff.
            </h3>

            <div
                ref={chatBodyRef}
                className="mt-5 max-h-[18rem] space-y-3 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {messages.map((message, index) => (
                    <div
                        key={`${message.role}-${index}`}
                        className={
                            message.role === 'assistant'
                                ? 'mr-7 rounded-[1.2rem] bg-[#f4ead8] p-3 text-sm leading-6 text-[#43331d] dark:bg-white/8 dark:text-white/78'
                                : 'ml-7 rounded-[1.2rem] bg-[#2f2517] p-3 text-sm leading-6 text-white dark:bg-white dark:text-[#17120b]'
                        }
                    >
                        {message.role === 'assistant' ? (
                            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b7739]">
                                <MessageCircle className="h-3.5 w-3.5" />
                                BCCC Guide
                            </div>
                        ) : null}
                        {message.text}
                    </div>
                ))}
            </div>

            <div className="mt-4 flex min-h-12 items-center gap-2 rounded-full border border-black/10 bg-white px-2 pl-4 dark:border-white/10 dark:bg-white/8">
                <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            sendMessage();
                        }
                    }}
                    placeholder="Ask about bookings or availability..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#82735f] dark:text-white dark:placeholder:text-white/45"
                />

                <button
                    type="button"
                    onClick={sendMessage}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[#2f2517] text-white transition hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                    aria-label="Send message"
                >
                    <Send className="h-4 w-4" />
                </button>
            </div>
        </section>
    );
}

function FrequentlyAskedQuestions() {
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    return (
        <section className="rounded-[1.75rem] border border-black/10 bg-white/80 p-5 shadow-[0_24px_70px_rgba(40,29,13,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9b7739]">
                Frequently Asked Questions
            </p>

            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#21180d] dark:text-white">
                Answers to common client questions.
            </h3>

            <div className="mt-5 divide-y divide-black/10 overflow-hidden rounded-[1.35rem] border border-black/10 dark:divide-white/10 dark:border-white/10">
                {FAQ_ITEMS.map((item, index) => {
                    const open = openFaq === index;

                    return (
                        <div key={item.question}>
                            <button
                                type="button"
                                onClick={() => setOpenFaq((current) => (current === index ? null : index))}
                                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-[#2f2517] transition hover:bg-[#f4ead8] dark:text-white dark:hover:bg-white/8"
                            >
                                <span className="flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 text-[#9b7739]" />
                                    {item.question}
                                </span>

                                <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence initial={false}>
                                {open ? (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.22 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="px-4 pb-4 text-sm leading-7 text-[#625540] dark:text-white/62">
                                            {item.answer}
                                        </p>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default function SpecialOffers({ items = [] }: { items?: FeaturePackageItem[] }) {
    const page = usePage<{ siteSettings?: SiteSettings }>();
    const siteSettings = page.props.siteSettings;

    const visibleOffers = useMemo(
        () =>
            items
                .filter((item) => item.homepageVisible !== false && item.homepage_visible !== 0 && item.homepage_visible !== '0')
                .slice(0, 12),
        [items],
    );

    return (
        <section className="relative bg-[#f8f5ef] px-4 py-14 dark:bg-[#0d0f12] sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1920px]">
                <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#b08d48]/25 bg-[#f4ead8] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8d6a30] dark:border-white/10 dark:bg-white/8 dark:text-[#f0d69a]">
                            <Sparkles className="h-3.5 w-3.5" />
                            Special Offers
                        </div>

                        <h2 className="mt-3 font-serif text-[clamp(2.3rem,4vw,5rem)] font-light leading-[0.94] tracking-[-0.055em] text-[#21180d] dark:text-white">
                            Featured packages and event-ready options.
                        </h2>
                    </div>

                    <p className="max-w-md text-sm leading-7 text-[#6d604d] dark:text-white/62">
                        Browse highlighted packages in a compact luxury rail. Four cards fit on wide screens while mobile and tablet users can drag sideways.
                    </p>
                </div>

                {visibleOffers.length > 0 ? (
                    <LuxuryHorizontalRail label="BCCC special offers">
                        {visibleOffers.map((offer, index) => (
                            <OfferCard key={offer.id} offer={offer} index={index} />
                        ))}
                    </LuxuryHorizontalRail>
                ) : (
                    <BcccEmptyState
                        icon={Gift}
                        eyebrow="Special Offers"
                        title="No public offers yet"
                        description="Create packages or highlighted event offers in the admin content area, then mark them visible for the homepage."
                        action={
                            <BcccEmptyStateLink href="/book">
                                Start Booking Instead
                            </BcccEmptyStateLink>
                        }
                    />
                )}

                <div className="mt-10 grid gap-4 lg:grid-cols-3">
                    <ContactPanel siteSettings={siteSettings} />
                    <ClientGuideChatbot />
                    <FrequentlyAskedQuestions />
                </div>
            </div>
        </section>
    );
}
