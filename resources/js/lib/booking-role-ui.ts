import type { RoleKey } from '@/lib/role-workspaces';

export type BookingStatus =
    | 'pending'
    | 'submitted'
    | 'pencil_booked'
    | 'pencil-booked'
    | 'for_review'
    | 'for review'
    | 'confirmed'
    | 'approved'
    | 'active'
    | 'cancelled'
    | 'canceled'
    | 'declined'
    | 'rejected'
    | 'completed'
    | string;

export type PaymentStatus =
    | 'unpaid'
    | 'pending'
    | 'submitted'
    | 'for_review'
    | 'for review'
    | 'awaiting_review'
    | 'awaiting review'
    | 'partial'
    | 'partially_paid'
    | 'downpayment_paid'
    | 'down_payment_paid'
    | 'balance_pending'
    | 'for_balance'
    | 'paid'
    | 'verified'
    | 'completed'
    | 'settled'
    | 'approved'
    | 'owing'
    | 'expired'
    | string;

export type BookingDeadlineState =
    | 'none'
    | 'active'
    | 'due_soon'
    | 'expired'
    | 'auto_declined'
    | 'protected'
    | string;

export type BookingLike = {
    id: number | string;

    client_name?: string | null;
    company_name?: string | null;
    type_of_event?: string | null;

    booking_status?: BookingStatus | null;
    payment_status?: PaymentStatus | null;

    booking_date_from?: string | null;
    booking_date_to?: string | null;
    flexible_date_from?: string | null;
    flexible_date_to?: string | null;

    created_at?: string | null;
    updated_at?: string | null;

    service_name?: string | null;
    service?: {
        id?: number | string;
        name?: string | null;
        service_type?: {
            id?: number | string;
            name?: string | null;
        } | null;
        serviceType?: {
            id?: number | string;
            name?: string | null;
        } | null;
    } | null;

    number_of_guests?: number | string | null;

    client_email?: string | null;
    client_contact_number?: string | null;
    client_address?: string | null;

    survey_proof_image_url?: string | null;
    survey_proof_image?: string | null;
    surveyProofImageUrl?: string | null;

    is_public_calendar_visible?: boolean | number | string | null;
    public_calendar_title?: string | null;

    expired_at?: string | null;
    payment_balance_due_at?: string | null;
    auto_declined_at?: string | null;
    auto_decline_reason?: string | null;

    deadline_at?: string | null;
    deadlineAt?: string | null;

    deadline_state?: BookingDeadlineState | null;
    deadlineState?: BookingDeadlineState | null;

    deadline_label?: string | null;
    deadlineLabel?: string | null;

    deadline_seconds_remaining?: number | null;
    deadlineSecondsRemaining?: number | null;

    deadline_is_expired?: boolean | null;
    deadlineIsExpired?: boolean | null;

    deadline_is_due_soon?: boolean | null;
    deadlineIsDueSoon?: boolean | null;

    totals?: {
        items_total?: number | string | null;
        payments_total?: number | string | null;
        submitted_payments_total?: number | string | null;
        confirmed_payments_total?: number | string | null;
        remaining_balance?: number | string | null;
        base_total?: number | string | null;
        base_subtotal?: number | string | null;
        discount_total?: number | string | null;
        post_event_total?: number | string | null;
        required_bond_amount?: number | string | null;
        bond_charge?: number | string | null;
        total_with_bond?: number | string | null;
        payment_total_including_bond?: number | string | null;
        total_with_post_event?: number | string | null;
    } | null;

    payments?: Array<{
        id: number | string;
        amount?: number | string | null;
        status?: string | null;
        payment_method?: string | null;
        payment_gateway?: string | null;
        payment_type?: string | null;
        transaction_reference?: string | null;
        proof_image_url?: string | null;
        created_at?: string | null;
        remarks?: string | null;
    }>;

    lifecycle_events?: Array<Record<string, unknown>>;
    lifecycleEvents?: Array<Record<string, unknown>>;
    events?: Array<Record<string, unknown>>;

    [key: string]: unknown;
};

export type BookingWorkspaceCopy = {
    eyebrow: string;
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    createLabel: string;
    listLabel: string;
    canCreate: boolean;
    canDelete: boolean;
    showClientHelp: boolean;
};

export function normalizeWorkspaceRole(value?: string | null): RoleKey {
    if (value === 'admin') return 'admin';
    if (value === 'manager') return 'manager';
    if (value === 'staff') return 'staff';

    return 'user';
}

export function bookingWorkspaceCopy(role: RoleKey): BookingWorkspaceCopy {
    if (role === 'admin') {
        return {
            eyebrow: 'Admin Booking Workspace',
            title: 'All Booking Records',
            description:
                'Full booking operations workspace for monitoring, editing, payment review, audit checks, and client reservation control.',
            emptyTitle: 'No booking records yet',
            emptyDescription:
                'Once client or staff bookings are created, all reservation records will appear here.',
            createLabel: 'Create Booking',
            listLabel: 'All Bookings',
            canCreate: true,
            canDelete: true,
            showClientHelp: false,
        };
    }

    if (role === 'manager') {
        return {
            eyebrow: 'Manager Booking Review',
            title: 'Booking Review',
            description:
                'Review booking requests, monitor payment compliance, inspect schedules, and approve operational updates.',
            emptyTitle: 'No bookings for review',
            emptyDescription:
                'Bookings requiring monitoring, approval, or payment review will appear here.',
            createLabel: 'Create Booking',
            listLabel: 'Review Bookings',
            canCreate: false,
            canDelete: false,
            showClientHelp: false,
        };
    }

    if (role === 'staff') {
        return {
            eyebrow: 'Operations Booking Desk',
            title: 'Booking Assistance',
            description:
                'Daily workspace for creating assisted bookings, checking schedules, updating client details, and handling reservation follow-ups.',
            emptyTitle: 'No operational bookings found',
            emptyDescription:
                'Use the create booking button when assisting a client or checking a reservation request.',
            createLabel: 'Assist New Booking',
            listLabel: 'Operational Bookings',
            canCreate: true,
            canDelete: false,
            showClientHelp: false,
        };
    }

    return {
        eyebrow: 'Client Booking Portal',
        title: 'My Bookings',
        description:
            'Track your submitted event booking requests, review booking details, complete MICE/report details when required, and submit payment proof for review.',
        emptyTitle: 'You have no bookings yet',
        emptyDescription:
            'Start a booking request to reserve a date and venue at Baguio Convention and Cultural Center.',
        createLabel: 'Book Your Event',
        listLabel: 'My Bookings',
        canCreate: true,
        canDelete: false,
        showClientHelp: true,
    };
}

export function bookingBasePath(role: RoleKey): string {
    if (role === 'admin') return '/admin/bookings';
    if (role === 'manager') return '/manager/bookings';
    if (role === 'staff') return '/staff/bookings';

    return '/my-bookings';
}

export function bookingCreatePath(role: RoleKey): string {
    if (role === 'admin') return '/admin/bookings/create';
    if (role === 'staff') return '/staff/bookings/create';

    return '/book';
}

export function bookingShowPath(role: RoleKey, id: number | string): string {
    return `${bookingBasePath(role)}/${id}`;
}

export function bookingEditPath(role: RoleKey, id: number | string): string {
    return `${bookingBasePath(role)}/${id}/edit`;
}

export function bookingSurveyPath(role: RoleKey, id: number | string): string {
    return `${bookingBasePath(role)}/${id}`;
}

export function bookingPaymentPath(role: RoleKey, id: number | string): string {
    return `${bookingBasePath(role)}/${id}/payments`;
}

export function bookingProofPath(role: RoleKey, id: number | string): string {
    return `${bookingBasePath(role)}/${id}/survey-proof-image`;
}

export function formatMoney(value?: number | string | null): string {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
    }).format(Number.isFinite(parsed) ? parsed : 0);
}

export function formatDateTime(value?: string | null): string {
    if (!value) return 'Not set';

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function cleanLabel(value?: string | null): string {
    return String(value || 'Not set')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function statusTone(status?: string | null): string {
    const normalized = String(status || '')
        .toLowerCase()
        .replace(/-/g, '_')
        .replace(/\s+/g, '_');

    if (
        [
            'confirmed',
            'approved',
            'active',
            'completed',
            'paid',
            'verified',
            'settled',
        ].includes(normalized)
    ) {
        return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
    }

    if (
        [
            'pending',
            'submitted',
            'pencil_booked',
            'for_review',
            'partial',
            'partially_paid',
            'downpayment_paid',
            'down_payment_paid',
            'balance_pending',
            'for_balance',
            'owing',
        ].includes(normalized)
    ) {
        return 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200';
    }

    if (
        [
            'cancelled',
            'canceled',
            'declined',
            'rejected',
            'failed',
            'unpaid',
            'expired',
        ].includes(normalized)
    ) {
        return 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-200';
    }

    return 'border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-200';
}

export function extractBookings(payload: unknown): BookingLike[] {
    if (Array.isArray(payload)) {
        return payload as BookingLike[];
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
        const data = (payload as { data?: unknown }).data;

        if (Array.isArray(data)) {
            return data as BookingLike[];
        }
    }

    return [];
}

export function extractPagination(payload: unknown) {
    if (!payload || typeof payload !== 'object') {
        return {
            links: [],
            meta: null,
        };
    }

    const objectPayload = payload as {
        links?: Array<{
            url?: string | null;
            label?: string;
            active?: boolean;
        }>;
        meta?: unknown;
    };

    return {
        links: Array.isArray(objectPayload.links) ? objectPayload.links : [],
        meta: objectPayload.meta ?? null,
    };
}
