import ActionFeedbackModal from '@/components/ui/action-feedback-modal';
import type { Booking } from '@/types';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    booking: Booking | null;
};

function parseLocalDate(value: unknown) {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;

    const match = raw.match(
        /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?/,
    );
    const base = match ? match[0] : raw;
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(base);

    if (dateOnly) {
        const d = new Date(`${base}T00:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    const normalized = base.includes('T') ? base : base.replace(' ', 'T');
    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value: unknown) {
    const raw = String(value ?? '').trim();
    const d = parseLocalDate(value);
    if (!d) return '—';

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        });
    }

    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function servicesPreview(booking: Booking | null) {
    if (!booking) return 'No service items attached.';
    if (Array.isArray(booking.items) && booking.items.length > 0) {
        return booking.items
            .map((item) => item.service_name || 'Service')
            .join(', ');
    }
    return booking.service_name || 'No service items attached.';
}

export default function DeleteBookingDialog({
    open,
    onOpenChange,
    booking,
}: Props) {
    const [busy, setBusy] = useState(false);

    const details = useMemo(() => {
        if (!booking) return [] as string[];

        return [
            `Booking ID: ${booking.id}`,
            `Client: ${booking.client_name || '—'}`,
            `Company: ${booking.company_name || '—'}`,
            `Schedule: ${formatDate(booking.booking_date_from)} → ${formatDate(booking.booking_date_to)}`,
            `Services: ${servicesPreview(booking)}`,
            `Status: ${booking.booking_status || '—'}`,
            `Payment: ${booking.payment_status || '—'}`,
        ];
    }, [booking]);

    return (
        <ActionFeedbackModal
            open={open}
            onOpenChange={(value) => {
                if (busy) return;
                onOpenChange(value);
            }}
            variant="danger"
            title="Delete this booking?"
            description="This action removes the booking record from the list. Use this only when you are sure the booking should no longer remain in the system."
            details={details}
            confirmText="Delete booking"
            cancelText="Keep booking"
            busy={busy}
            onConfirm={() => {
                if (!booking?.id) {
                    onOpenChange(false);
                    return;
                }

                setBusy(true);

                router.delete(`/bookings/${booking.id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        onOpenChange(false);
                    },
                    onFinish: () => {
                        setBusy(false);
                    },
                });
            }}
        />
    );
}
