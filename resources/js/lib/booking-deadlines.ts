export type DeadlineBookingLike = {
    booking_status?: string | null;
    payment_status?: string | null;
    created_at?: string | null;
    totals?: {
        items_total?: number | null;
        confirmed_payments_total?: number | null;
        submitted_payments_total?: number | null;
    } | null;
};

export type DeadlineState =
    | 'not_applicable'
    | 'fulfilled'
    | 'first_due_soon'
    | 'first_overdue'
    | 'final_due_soon'
    | 'final_overdue';

export type DeadlineSummary = {
    state: DeadlineState;
    bookingStatus: string;
    createdAt: Date | null;
    firstDeadline: Date | null;
    finalDeadline: Date | null;
    down_deadline: Date | null;
    full_deadline: Date | null;
    itemsTotal: number;
    confirmedTotal: number;
    submittedTotal: number;
    downPaymentRequired: number;
    outstandingBalance: number;
    remainingToReachHalf: number;
    remainingToFull: number;
    now: Date;
    label: string;
    shortLabel: string;
    tone: string;
    description: string;
    timeRemainingLabel: string;
    actionLabel: string;
    recommended: string;
};

function parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatRelativeDistance(target: Date | null, now: Date) {
    if (!target) return '—';

    const diffMs = target.getTime() - now.getTime();
    const absMs = Math.abs(diffMs);
    const totalMinutes = Math.round(absMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    let compact = '';
    if (days > 0) compact += `${days}d `;
    if (hours > 0 || days > 0) compact += `${hours}h `;
    compact += `${minutes}m`;

    return diffMs >= 0
        ? `Due in ${compact.trim()}`
        : `Overdue by ${compact.trim()}`;
}

export function formatDeadlineDateTime(value: Date | null) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    }).format(value);
}

function makeSummary(
    summary: Omit<
        DeadlineSummary,
        'down_deadline' | 'full_deadline' | 'recommended'
    >,
): DeadlineSummary {
    return {
        ...summary,
        down_deadline: summary.firstDeadline,
        full_deadline: summary.finalDeadline,
        recommended: summary.actionLabel,
    };
}

export function getDeadlineSummary(
    booking: DeadlineBookingLike,
    now = new Date(),
): DeadlineSummary {
    const bookingStatus = String(
        booking?.booking_status ?? 'pending',
    ).toLowerCase();
    const createdAt = parseDate(booking?.created_at ?? null);
    const firstDeadline = createdAt
        ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
        : null;
    const finalDeadline = createdAt
        ? new Date(createdAt.getTime() + 48 * 60 * 60 * 1000)
        : null;

    const itemsTotal = Number(booking?.totals?.items_total ?? 0);
    const confirmedTotal = Number(
        booking?.totals?.confirmed_payments_total ?? 0,
    );
    const submittedTotal = Number(
        booking?.totals?.submitted_payments_total ?? 0,
    );
    const downPaymentRequired = Math.max(itemsTotal * 0.5, 0);
    const outstandingBalance = Math.max(itemsTotal - confirmedTotal, 0);
    const remainingToReachHalf = Math.max(
        downPaymentRequired - confirmedTotal,
        0,
    );
    const remainingToFull = Math.max(itemsTotal - confirmedTotal, 0);

    if (['cancelled', 'declined', 'completed'].includes(bookingStatus)) {
        return makeSummary({
            state: 'not_applicable',
            bookingStatus,
            createdAt,
            firstDeadline,
            finalDeadline,
            itemsTotal,
            confirmedTotal,
            submittedTotal,
            downPaymentRequired,
            outstandingBalance,
            remainingToReachHalf,
            remainingToFull,
            now,
            label: 'Policy not active',
            shortLabel: 'N/A',
            tone: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
            description:
                'This booking status is no longer inside the pencil-booking payment countdown flow.',
            timeRemainingLabel: '—',
            actionLabel: 'No action',
        });
    }

    if (itemsTotal <= 0 || !createdAt || remainingToFull <= 0) {
        return makeSummary({
            state: 'fulfilled',
            bookingStatus,
            createdAt,
            firstDeadline,
            finalDeadline,
            itemsTotal,
            confirmedTotal,
            submittedTotal,
            downPaymentRequired,
            outstandingBalance,
            remainingToReachHalf,
            remainingToFull,
            now,
            label: 'Payment requirement satisfied',
            shortLabel: 'Satisfied',
            tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
            description:
                'Confirmed payments already satisfy the current payment requirement for this booking.',
            timeRemainingLabel: 'Settled',
            actionLabel: 'No action',
        });
    }

    const msToFirst = firstDeadline
        ? firstDeadline.getTime() - now.getTime()
        : null;
    const msToFinal = finalDeadline
        ? finalDeadline.getTime() - now.getTime()
        : null;
    const twoHours = 2 * 60 * 60 * 1000;
    const sixHours = 6 * 60 * 60 * 1000;

    if (remainingToReachHalf <= 0) {
        if ((msToFinal ?? 0) < 0) {
            return makeSummary({
                state: 'final_overdue',
                bookingStatus,
                createdAt,
                firstDeadline,
                finalDeadline,
                itemsTotal,
                confirmedTotal,
                submittedTotal,
                downPaymentRequired,
                outstandingBalance,
                remainingToReachHalf,
                remainingToFull,
                now,
                label: 'Final balance overdue',
                shortLabel: '48H overdue',
                tone: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
                description:
                    'The 50% down payment has been met, but the booking still has remaining balance after the 48-hour payment window.',
                timeRemainingLabel: formatRelativeDistance(finalDeadline, now),
                actionLabel: 'Review for delete / escalation',
            });
        }

        if ((msToFinal ?? Infinity) <= sixHours) {
            return makeSummary({
                state: 'final_due_soon',
                bookingStatus,
                createdAt,
                firstDeadline,
                finalDeadline,
                itemsTotal,
                confirmedTotal,
                submittedTotal,
                downPaymentRequired,
                outstandingBalance,
                remainingToReachHalf,
                remainingToFull,
                now,
                label: 'Final balance due soon',
                shortLabel: '48H soon',
                tone: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100',
                description:
                    'The booking passed the down payment requirement, but the remaining balance is nearing the 48-hour cutoff.',
                timeRemainingLabel: formatRelativeDistance(finalDeadline, now),
                actionLabel: 'Collect remaining balance',
            });
        }

        return makeSummary({
            state: 'fulfilled',
            bookingStatus,
            createdAt,
            firstDeadline,
            finalDeadline,
            itemsTotal,
            confirmedTotal,
            submittedTotal,
            downPaymentRequired,
            outstandingBalance,
            remainingToReachHalf,
            remainingToFull,
            now,
            label: 'Down payment secured',
            shortLabel: '50% met',
            tone: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100',
            description:
                'The 50% down payment requirement is satisfied. Monitor the remaining balance before the 48-hour deadline.',
            timeRemainingLabel: formatRelativeDistance(finalDeadline, now),
            actionLabel: 'Monitor remaining balance',
        });
    }

    if ((msToFirst ?? 0) < 0) {
        return makeSummary({
            state: 'first_overdue',
            bookingStatus,
            createdAt,
            firstDeadline,
            finalDeadline,
            itemsTotal,
            confirmedTotal,
            submittedTotal,
            downPaymentRequired,
            outstandingBalance,
            remainingToReachHalf,
            remainingToFull,
            now,
            label: 'Down payment overdue',
            shortLabel: '24H overdue',
            tone: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
            description:
                'The required 50% down payment was not reached within the first 24 hours.',
            timeRemainingLabel: formatRelativeDistance(firstDeadline, now),
            actionLabel: 'Review for auto-decline',
        });
    }

    if ((msToFirst ?? Infinity) <= twoHours) {
        return makeSummary({
            state: 'first_due_soon',
            bookingStatus,
            createdAt,
            firstDeadline,
            finalDeadline,
            itemsTotal,
            confirmedTotal,
            submittedTotal,
            downPaymentRequired,
            outstandingBalance,
            remainingToReachHalf,
            remainingToFull,
            now,
            label: 'Down payment due soon',
            shortLabel: '24H soon',
            tone: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100',
            description:
                'The 24-hour down payment cutoff is approaching and the booking has not yet reached 50% confirmed payment.',
            timeRemainingLabel: formatRelativeDistance(firstDeadline, now),
            actionLabel: 'Follow up with client',
        });
    }

    return makeSummary({
        state: 'first_due_soon',
        bookingStatus,
        createdAt,
        firstDeadline,
        finalDeadline,
        itemsTotal,
        confirmedTotal,
        submittedTotal,
        downPaymentRequired,
        outstandingBalance,
        remainingToReachHalf,
        remainingToFull,
        now,
        label: 'Pencil booking countdown active',
        shortLabel: '24H running',
        tone: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        description:
            'This booking is still inside the first 24-hour window and is waiting to reach the required 50% down payment.',
        timeRemainingLabel: formatRelativeDistance(firstDeadline, now),
        actionLabel: 'Monitor down payment',
    });
}
