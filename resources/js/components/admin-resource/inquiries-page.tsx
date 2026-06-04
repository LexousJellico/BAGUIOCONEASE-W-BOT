import {
    ResourceEmptyState,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Eye,
    Mail,
    MessageSquareText,
    Phone,
    Search,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Inquiry = {
    id: number | string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    subject?: string | null;
    inquiry_type?: string | null;
    event_date?: string | null;
    venue?: string | null;
    guest_count?: number | string | null;
    message?: string | null;
    status?: string | null;
    read_at?: string | null;
    created_at?: string | null;
};

type PaginationLink = {
    url?: string | null;
    label?: string | null;
    active?: boolean;
};

type Paginated<T> = {
    data?: T[];
    links?: PaginationLink[];
};

type PageProps = {
    workspaceRole?: 'admin' | 'manager' | 'staff' | string;
    inquiries?: Inquiry[] | Paginated<Inquiry>;
    filters?: {
        q?: string;
        status?: string;
    };
};

function collection<T>(value?: T[] | Paginated<T>): T[] {
    if (Array.isArray(value)) {
        return value;
    }

    return value?.data ?? [];
}

function linksOf<T>(value?: T[] | Paginated<T>): PaginationLink[] {
    if (value && !Array.isArray(value)) {
        return value.links ?? [];
    }

    return [];
}

function currentRole() {
    const path = window.location.pathname;

    if (path.startsWith('/manager')) {
        return 'manager';
    }

    if (path.startsWith('/staff')) {
        return 'staff';
    }

    return 'admin';
}

function basePath(role: string) {
    if (role === 'manager') {
        return '/manager/inquiries';
    }

    if (role === 'staff') {
        return '/staff/inquiries';
    }

    return '/admin/inquiries';
}

function breadcrumbsFor(role: string): BreadcrumbItem[] {
    if (role === 'manager') {
        return [
            { title: 'Manager', href: '/manager/dashboard' },
            { title: 'Public Inquiries', href: '/manager/inquiries' },
        ];
    }

    if (role === 'staff') {
        return [
            { title: 'Staff', href: '/staff/dashboard' },
            { title: 'Public Inquiries', href: '/staff/inquiries' },
        ];
    }

    return [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Public Inquiries', href: '/admin/inquiries' },
    ];
}

function cleanLabel(value?: string | null): string {
    return String(value || 'new')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compactDate(value?: string | null) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
}

function compactDateTime(value?: string | null) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function statusClass(value?: string | null) {
    const status = String(value || 'new').toLowerCase();

    if (status === 'closed' || status === 'replied') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200';
    }

    if (status === 'read') {
        return 'bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200';
    }

    return 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200';
}

function paginationLabel(label?: string | null) {
    return String(label || '')
        .replace(/<[^>]*>/g, '')
        .replace(/«|»/g, '')
        .trim();
}

function Pagination({ links }: { links: PaginationLink[] }) {
    if (!links.length) {
        return null;
    }

    return (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveScroll
                        preserveState
                        className={
                            link.active
                                ? 'inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[#2f2517] px-4 text-sm font-semibold text-white dark:bg-white dark:text-[#17120b]'
                                : 'inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12'
                        }
                    >
                        {paginationLabel(link.label)}
                    </Link>
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[#d9c7a6]/40 bg-[#fffaf0]/50 px-4 text-sm font-semibold text-[#8a7a63] dark:border-white/10 dark:bg-white/[0.035] dark:text-white/35"
                    >
                        {paginationLabel(link.label)}
                    </span>
                ),
            )}
        </div>
    );
}

function InfoLine({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof UserRound;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[1rem] border border-[#eadcc2]/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.035]">
            <Icon className="h-4 w-4 text-[#9d7b3d] dark:text-[#f1d89b]" />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#21180d] dark:text-white">
                {value}
            </p>
        </div>
    );
}

export function InquiriesPage() {
    const { props } = usePage<PageProps>();
    const role = props.workspaceRole || currentRole();
    const path = basePath(role);

    const rows = useMemo(() => collection<Inquiry>(props.inquiries), [props.inquiries]);
    const pageLinks = useMemo(() => linksOf<Inquiry>(props.inquiries), [props.inquiries]);

    const [q, setQ] = useState(String(props.filters?.q ?? ''));
    const [status, setStatus] = useState(String(props.filters?.status ?? ''));

    const newCount = rows.filter((item) => String(item.status || 'new').toLowerCase() === 'new').length;
    const readCount = rows.filter((item) => String(item.status || '').toLowerCase() === 'read').length;
    const repliedCount = rows.filter((item) => String(item.status || '').toLowerCase() === 'replied').length;

    function search() {
        router.get(
            path,
            {
                q: q || undefined,
                status: status || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function updateStatus(inquiry: Inquiry, nextStatus: string) {
        router.put(
            `${path}/${inquiry.id}`,
            { status: nextStatus },
            {
                preserveScroll: true,
            },
        );
    }

    function destroy(inquiry: Inquiry) {
        if (!window.confirm(`Delete inquiry "${inquiry.subject || inquiry.id}"?`)) {
            return;
        }

        router.delete(`${path}/${inquiry.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <ResourcePageShell
            title="Public Inquiries"
            eyebrow="Public Website"
            icon={MessageSquareText}
            breadcrumbs={breadcrumbsFor(role)}
            subtitle="Centralized messages from the public contact page, including booking questions, preferred dates, venue details, and follow-up status."
            actions={
                <Link
                    href="/contact"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                >
                    Public Contact Page
                </Link>
            }
        >
            <div className="grid gap-3 md:grid-cols-4">
                <ResourceStatCard
                    label="Loaded"
                    value={rows.length}
                    description="Total inquiries on the current page."
                    icon={MessageSquareText}
                />
                <ResourceStatCard
                    label="New"
                    value={newCount}
                    description="Messages requiring first review."
                    icon={Mail}
                />
                <ResourceStatCard
                    label="Read"
                    value={readCount}
                    description="Messages reviewed by staff."
                    icon={Eye}
                />
                <ResourceStatCard
                    label="Replied"
                    value={repliedCount}
                    description="Messages already answered."
                    icon={Phone}
                />
            </div>

            <div className="mt-5">
                <ResourceSection
                    title="Inquiry inbox"
                    eyebrow="Messages"
                    description="Search, review, update status, or delete public inquiries."
                >
                    <div className="mb-4 grid gap-3 rounded-[1.25rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/70 p-3 dark:border-white/10 dark:bg-white/[0.035] lg:grid-cols-[1fr_13rem_auto]">
                        <div className="flex min-h-11 items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 dark:border-white/10 dark:bg-white/7">
                            <Search className="h-4 w-4 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" />
                            <input
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        search();
                                    }
                                }}
                                className="min-w-0 flex-1 bg-transparent text-sm text-[#21180d] outline-none placeholder:text-[#8a7a63] dark:text-white dark:placeholder:text-white/42"
                                placeholder="Search inquiries..."
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="min-h-11 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] outline-none dark:border-white/10 dark:bg-white/7 dark:text-white"
                        >
                            <option value="">All statuses</option>
                            <option value="new">New</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                            <option value="closed">Closed</option>
                        </select>

                        <button
                            type="button"
                            onClick={search}
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                        >
                            Search
                        </button>
                    </div>

                    {rows.length > 0 ? (
                        <div className="grid gap-3">
                            {rows.map((inquiry) => (
                                <article
                                    key={inquiry.id}
                                    className="rounded-[1.35rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/72 p-4 shadow-[0_14px_40px_rgba(47,37,23,0.06)] dark:border-white/10 dark:bg-white/[0.035]"
                                >
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(inquiry.status)}`}>
                                                    {cleanLabel(inquiry.status)}
                                                </span>

                                                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#6e604c] dark:bg-white/7 dark:text-white/52">
                                                    {cleanLabel(inquiry.inquiry_type || 'Inquiry')}
                                                </span>

                                                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#6e604c] dark:bg-white/7 dark:text-white/52">
                                                    #{inquiry.id}
                                                </span>
                                            </div>

                                            <h3 className="mt-3 text-xl font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                                                {inquiry.subject || 'No subject'}
                                            </h3>

                                            <p className="mt-2 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                                {inquiry.message || 'No message content provided.'}
                                            </p>

                                            <div className="mt-4 grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
                                                <InfoLine
                                                    icon={UserRound}
                                                    label="Sender"
                                                    value={`${inquiry.name || 'No name'} · ${inquiry.email || 'No email'}`}
                                                />
                                                <InfoLine
                                                    icon={Phone}
                                                    label="Phone"
                                                    value={inquiry.phone || 'Not set'}
                                                />
                                                <InfoLine
                                                    icon={CalendarDays}
                                                    label="Preferred Date"
                                                    value={compactDate(inquiry.event_date)}
                                                />
                                                <InfoLine
                                                    icon={MessageSquareText}
                                                    label="Venue / Guests"
                                                    value={`${inquiry.venue || 'Not set'} · ${inquiry.guest_count || 'Not set'}`}
                                                />
                                            </div>

                                            <p className="mt-3 text-xs text-[#8a7a63] dark:text-white/42">
                                                Received: {compactDateTime(inquiry.created_at)}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                                            {inquiry.email ? (
                                                <a
                                                    href={`mailto:${inquiry.email}`}
                                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                    Email
                                                </a>
                                            ) : null}

                                            <select
                                                value={inquiry.status || 'new'}
                                                onChange={(event) => updateStatus(inquiry, event.target.value)}
                                                className="min-h-10 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] outline-none dark:border-white/10 dark:bg-white/7 dark:text-white"
                                            >
                                                <option value="new">New</option>
                                                <option value="read">Read</option>
                                                <option value="replied">Replied</option>
                                                <option value="closed">Closed</option>
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => destroy(inquiry)}
                                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <ResourceEmptyState
                            icon={MessageSquareText}
                            title="No inquiries found"
                            description="Public contact messages and client inquiries will appear here."
                        />
                    )}

                    <Pagination links={pageLinks} />
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}
