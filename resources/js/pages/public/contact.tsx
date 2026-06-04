import OfficialPageHero from '@/components/public/official-page-hero';
import PublicLayout, { type SiteSettings } from '@/layouts/public-layout';
import type { VenueOption } from '@/types/public-content';
import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Mail, MapPin, Phone, SendHorizonal, Sparkles } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

type Props = {
    venueOptions?: VenueOption[];
};

type InquiryForm = {
    name: string;
    email: string;
    phone: string;
    subject: string;
    inquiry_type: string;
    event_date: string;
    venue: string;
    guest_count: string;
    message: string;
};

const inquiryTypes = [
    'General Inquiry',
    'Booking Guidance',
    'Venue Availability',
    'Event Coordination',
    'Payment Clarification',
    'Tourism and Visit Support',
    'Others',
];

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300">{message}</p>;
}

function FormField({
    label,
    children,
    error,
}: {
    label: string;
    children: ReactNode;
    error?: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-[#176456] dark:text-[#9fe8dc]">
                {label}
            </span>
            {children}
            <FieldError message={error} />
        </label>
    );
}

function ContactCard({ icon, label, value, href }: { icon: ReactNode; label: string; value: string; href?: string }) {
    const content = (
        <>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#176456]/10 text-[#176456] dark:bg-white/10 dark:text-[#9fe8dc]">
                {icon}
            </span>
            <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#65758b] dark:text-white/42">{label}</span>
                <span className="mt-1 block text-sm font-semibold leading-6 text-[#153d66] dark:text-white/78">{value}</span>
            </span>
        </>
    );

    const className = 'flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#176456]/30 dark:border-white/10 dark:bg-white/[0.045]';

    return href ? (
        <a href={href} className={className}>{content}</a>
    ) : (
        <div className={className}>{content}</div>
    );
}

export default function ContactPage({ venueOptions = [] }: Props) {
    const page = usePage<{ siteSettings?: SiteSettings; flash?: { success?: string } }>();
    const settings = page.props.siteSettings;

    const mapEmbedUrl =
        settings?.mapEmbedUrl ||
        settings?.map_embed_url ||
        'https://www.google.com/maps?q=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines&z=16&output=embed';

    const phone = settings?.phone || '(074) 446 2009';
    const email = settings?.email || 'info@bccc-ease.com';
    const address = settings?.address || 'CH3X+RRW, Baguio, Benguet, Philippines';

    const { data, setData, post, processing, errors, reset } = useForm<InquiryForm>({
        name: '',
        email: '',
        phone: '',
        subject: '',
        inquiry_type: 'General Inquiry',
        event_date: '',
        venue: '',
        guest_count: '',
        message: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        post('/inquiries', {
            preserveScroll: true,
            onSuccess: () => {
                reset('name', 'email', 'phone', 'subject', 'inquiry_type', 'event_date', 'venue', 'guest_count', 'message');
            },
        });
    };

    return (
        <PublicLayout>
            <Head title="Contact" />

            <main className="min-h-screen bg-[#e9eef0] text-[#153d66] dark:bg-[#07110f] dark:text-white">
                <OfficialPageHero
                    eyebrow="Baguio Convention and Cultural Center"
                    title="Contact"
                    description="Coordinate with the BCCC office for venue questions, availability clarification, tourism assistance, and event preparation concerns."
                    actions={[{ label: 'Start booking', href: '/book' }, { label: 'View calendar', href: '/calendar' }]}
                />

                <section className="public-container py-10 lg:py-14">
                    <div className="grid gap-6 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
                        <aside className="space-y-5 lg:sticky lg:top-28">
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(8,47,42,0.08)] dark:border-white/10 dark:bg-white/[0.045]">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#176456]/16 bg-[#176456]/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#176456] dark:border-white/10 dark:bg-white/7 dark:text-[#9fe8dc]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Office Details
                                </div>

                                <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[#153d66] dark:text-white">Reach the correct desk faster.</h2>
                                <p className="mt-3 text-sm leading-7 text-[#425466] dark:text-white/54">
                                    Use the inquiry form for written coordination. For urgent schedule confirmation, call or send a direct email to the office.
                                </p>

                                <div className="mt-5 grid gap-3">
                                    <ContactCard icon={<MapPin className="h-5 w-5" />} label="Address" value={address} />
                                    <ContactCard icon={<Phone className="h-5 w-5" />} label="Phone / Viber" value={phone} href={`tel:${phone.replace(/\s+/g, '')}`} />
                                    <ContactCard icon={<Mail className="h-5 w-5" />} label="Email" value={email} href={`mailto:${email}`} />
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_20px_55px_rgba(8,47,42,0.08)] dark:border-white/10 dark:bg-white/[0.045]">
                                <iframe
                                    title="BCCC location map"
                                    src={mapEmbedUrl}
                                    className="h-[23rem] w-full border-0"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </aside>

                        <form
                            onSubmit={submit}
                            className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(8,47,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] sm:p-6 lg:p-8"
                        >
                            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#176456] dark:text-[#9fe8dc]">Public Enquiry</p>
                                    <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#153d66] dark:text-white">Send a message to the office.</h2>
                                </div>
                                <div className="rounded-full border border-[#176456]/16 bg-[#176456]/8 px-4 py-2 text-xs font-semibold text-[#176456] dark:border-white/10 dark:bg-white/7 dark:text-[#9fe8dc]">
                                    Usually answered by the office staff
                                </div>
                            </div>

                            {page.props.flash?.success ? (
                                <div className="mt-6 flex items-start gap-3 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-700 dark:text-emerald-200">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                    {page.props.flash.success}
                                </div>
                            ) : null}

                            <div className="mt-6 grid gap-5 md:grid-cols-2">
                                <FormField label="Full Name" error={errors.name}>
                                    <input value={data.name} onChange={(event) => setData('name', event.target.value)} className="bccc-inner-input" />
                                </FormField>

                                <FormField label="Valid Email" error={errors.email}>
                                    <input type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className="bccc-inner-input" />
                                </FormField>

                                <FormField label="Phone" error={errors.phone}>
                                    <input value={data.phone} onChange={(event) => setData('phone', event.target.value)} className="bccc-inner-input" />
                                </FormField>

                                <FormField label="Subject" error={errors.subject}>
                                    <input value={data.subject} onChange={(event) => setData('subject', event.target.value)} className="bccc-inner-input" />
                                </FormField>

                                <FormField label="Inquiry Type" error={errors.inquiry_type}>
                                    <select value={data.inquiry_type} onChange={(event) => setData('inquiry_type', event.target.value)} className="bccc-inner-input">
                                        {inquiryTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                                    </select>
                                </FormField>

                                <FormField label="Preferred Event Date" error={errors.event_date}>
                                    <input type="date" value={data.event_date} onChange={(event) => setData('event_date', event.target.value)} className="bccc-inner-input" />
                                </FormField>

                                <FormField label="Venue" error={errors.venue}>
                                    <select value={data.venue} onChange={(event) => setData('venue', event.target.value)} className="bccc-inner-input">
                                        <option value="">Select venue</option>
                                        {venueOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                                    </select>
                                </FormField>

                                <FormField label="Estimated Guests" error={errors.guest_count}>
                                    <input type="number" min="1" value={data.guest_count} onChange={(event) => setData('guest_count', event.target.value)} className="bccc-inner-input" />
                                </FormField>

                                <div className="md:col-span-2">
                                    <FormField label="Message" error={errors.message}>
                                        <textarea value={data.message} onChange={(event) => setData('message', event.target.value)} rows={7} className="bccc-inner-input resize-none py-4" />
                                    </FormField>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#176456] px-6 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_42px_rgba(23,100,86,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#0f4d43] disabled:cursor-wait disabled:opacity-70"
                            >
                                <SendHorizonal className="h-4 w-4" />
                                {processing ? 'Sending...' : 'Submit Enquiry'}
                            </button>
                        </form>
                    </div>
                </section>
            </main>
        </PublicLayout>
    );
}
