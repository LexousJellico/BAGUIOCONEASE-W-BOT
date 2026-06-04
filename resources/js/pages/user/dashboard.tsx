import { RoleWorkspaceShell } from '@/components/role/role-workspace-shell';
import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, Clock3, FileText, Plus, ReceiptText } from 'lucide-react';

type DashboardBooking = {
    id: number | string;
    client_name?: string;
    company_name?: string;
    type_of_event?: string;
    booking_status?: string;
    payment_status?: string;
    booking_date_from?: string;
    booking_date_to?: string;
};

type PageProps = {
    workspaceStats?: Record<string, number>;
    recentBookings?: DashboardBooking[];
};

function cleanStatus(value?: string | null) {
    return String(value || 'Pending')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status?: string | null) {
    const normalized = String(status || '').toLowerCase();

    if (['confirmed', 'approved', 'active', 'completed'].includes(normalized)) {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100';
    }

    if (['cancelled', 'canceled', 'declined', 'rejected'].includes(normalized)) {
        return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100';
    }

    return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100';
}

function StatCard({ icon: Icon, label, value, helper }: { icon: typeof CalendarDays; label: string; value: number | string; helper: string }) {
    return (
        <article className="rounded-[1.35rem] border border-[#d9c7a6]/70 bg-white/78 p-5 shadow-[0_18px_50px_rgba(47,37,23,0.07)] dark:border-white/10 dark:bg-white/[0.045]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7b3d] dark:text-[#f1d89b]">{label}</p>
                    <strong className="mt-3 block text-3xl font-semibold tracking-[-0.055em] text-[#21180d] dark:text-white">{value}</strong>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                    <Icon className="h-5 w-5" />
                </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#6e604c] dark:text-white/56">{helper}</p>
        </article>
    );
}

export default function UserDashboard() {
    const { props } = usePage<PageProps>();
    const stats = props.workspaceStats ?? {};
    const bookings = Array.isArray(props.recentBookings) ? props.recentBookings : [];

    return (
        <RoleWorkspaceShell
            role="user"
            title="My Booking Dashboard"
            eyebrow="Client Portal"
            description="A simple workspace for your own BCCC booking requests, payment status, and next required action."
            breadcrumbs={[{ title: 'Client Portal', href: '/my-dashboard' }]}
            actions={
                <>
                    <Link href="/book" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]">
                        <Plus className="h-4 w-4" />
                        New Booking
                    </Link>
                    <Link href="/my-bookings" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white/80 px-5 text-sm font-bold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12">
                        <FileText className="h-4 w-4" />
                        My Bookings
                    </Link>
                </>
            }
        >
            <section className="grid gap-4 md:grid-cols-3">
                <StatCard icon={CalendarDays} label="My Bookings" value={stats.total_bookings ?? bookings.length} helper="Only your submitted booking records are shown here." />
                <StatCard icon={Clock3} label="Pending" value={stats.pending ?? 0} helper="Requests still waiting for review or completion." />
                <StatCard icon={ReceiptText} label="Confirmed" value={(stats.confirmed ?? 0) + (stats.active ?? 0)} helper="Bookings already confirmed or active." />
            </section>

            <section className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#d9c7a6]/70 bg-white/80 shadow-[0_20px_60px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.045]">
                <div className="flex flex-col gap-3 border-b border-[#eadcc2]/80 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:text-[#f1d89b]">Booking Records</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-[#21180d] dark:text-white">Recent booking requests</h2>
                    </div>
                    <Link href="/my-calendar" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12">
                        <CalendarDays className="h-4 w-4" />
                        Calendar
                    </Link>
                </div>

                {bookings.length > 0 ? (
                    <div className="divide-y divide-[#eadcc2]/80 dark:divide-white/10">
                        {bookings.map((booking) => (
                            <Link key={booking.id} href={`/my-bookings/${booking.id}`} className="grid gap-3 p-5 transition hover:bg-[#fff7ea] dark:hover:bg-white/[0.04] lg:grid-cols-[1fr_auto] lg:items-center">
                                <div className="min-w-0">
                                    <h3 className="truncate text-lg font-semibold tracking-[-0.04em] text-[#21180d] dark:text-white">
                                        {booking.type_of_event || booking.company_name || 'Booking Request'}
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-[#6e604c] dark:text-white/56">
                                        {[booking.booking_date_from, booking.booking_date_to].filter(Boolean).join(' - ') || 'Schedule not set'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 lg:justify-end">
                                    <span className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] ${statusTone(booking.booking_status)}`}>{cleanStatus(booking.booking_status)}</span>
                                    <span className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] ${statusTone(booking.payment_status)}`}>{cleanStatus(booking.payment_status)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <CalendarDays className="mx-auto h-10 w-10 text-[#9d7b3d] dark:text-[#f1d89b]" />
                        <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[#21180d] dark:text-white">No booking request yet</h3>
                        <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[#6e604c] dark:text-white/56">Start a new booking when you are ready. Your records and payment status will appear here.</p>
                    </div>
                )}
            </section>
        </RoleWorkspaceShell>
    );
}
