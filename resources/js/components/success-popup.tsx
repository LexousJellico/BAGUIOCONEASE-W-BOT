import { CalendarClock, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type PencilBookedPopupPayload = {
    requestedAtIso: string;
    dueAtIso: string;
};

const STORAGE_KEY = '__pencil_booked_success_popup__';
const EVENT_NAME = 'pencil-booked-success-popup';

export function triggerPencilBookedSuccessPopup(payload: PencilBookedPopupPayload) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // Session storage can fail in strict privacy mode. The event still handles the current page.
    }

    try {
        window.dispatchEvent(new CustomEvent<PencilBookedPopupPayload>(EVENT_NAME, { detail: payload }));
    } catch {
        // No-op.
    }
}

function safeReadFromSession(): PencilBookedPopupPayload | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return null;
        }

        sessionStorage.removeItem(STORAGE_KEY);

        const parsed = JSON.parse(raw) as Partial<PencilBookedPopupPayload>;

        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        if (typeof parsed.requestedAtIso !== 'string' || typeof parsed.dueAtIso !== 'string') {
            return null;
        }

        return {
            requestedAtIso: parsed.requestedAtIso,
            dueAtIso: parsed.dueAtIso,
        };
    } catch {
        return null;
    }
}

function formatDateTimeLocal(iso: string) {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return iso;
    }

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function PencilBookedSuccessPopup() {
    const [mounted, setMounted] = useState(false);
    const [closing, setClosing] = useState(false);
    const [payload, setPayload] = useState<PencilBookedPopupPayload | null>(null);
    const closeTimerRef = useRef<number | null>(null);
    const removeTimerRef = useRef<number | null>(null);

    const clearTimers = () => {
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        if (removeTimerRef.current) {
            window.clearTimeout(removeTimerRef.current);
            removeTimerRef.current = null;
        }
    };

    const close = () => {
        clearTimers();
        setClosing(true);

        removeTimerRef.current = window.setTimeout(() => {
            setPayload(null);
            setClosing(false);
            removeTimerRef.current = null;
        }, 320);
    };

    const show = (nextPayload: PencilBookedPopupPayload) => {
        clearTimers();
        setClosing(false);
        setPayload(nextPayload);

        closeTimerRef.current = window.setTimeout(() => {
            setClosing(true);
        }, 6400);

        removeTimerRef.current = window.setTimeout(() => {
            setPayload(null);
            setClosing(false);
            closeTimerRef.current = null;
            removeTimerRef.current = null;
        }, 6750);
    };

    useEffect(() => {
        setMounted(true);

        const fromSession = safeReadFromSession();

        if (fromSession) {
            show(fromSession);
        }

        const handler = (event: Event) => {
            const customEvent = event as CustomEvent<PencilBookedPopupPayload>;

            if (!customEvent?.detail) {
                return;
            }

            try {
                sessionStorage.removeItem(STORAGE_KEY);
            } catch {
                // No-op.
            }

            show(customEvent.detail);
        };

        window.addEventListener(EVENT_NAME, handler);

        return () => {
            window.removeEventListener(EVENT_NAME, handler);
            clearTimers();
        };
    }, []);

    if (!mounted || !payload) {
        return null;
    }

    return createPortal(
        <div
            className={`fixed inset-0 z-[999998] flex items-center justify-center bg-[#17120b]/34 px-4 backdrop-blur-[5px] transition duration-300 ${
                closing ? 'opacity-0' : 'opacity-100'
            }`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
        >
            <div
                className={`booking-result-modal booking-result-modal-success relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-emerald-200/90 bg-white/96 p-6 text-slate-950 shadow-[0_34px_110px_rgba(15,23,42,0.25)] backdrop-blur-2xl transition duration-300 dark:border-emerald-400/25 dark:bg-[#101820]/96 dark:text-white ${
                    closing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
                }`}
            >
                <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400" />

                <button
                    type="button"
                    onClick={close}
                    className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/75 text-slate-500 transition hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-slate-300 dark:hover:bg-white/12"
                    aria-label="Close booking success notice"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="relative flex flex-col items-center text-center">
                    <div className="booking-result-orbit mb-4 grid h-20 w-20 place-items-center rounded-full bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300">
                        <CheckCircle2 className="h-10 w-10" />
                        <Sparkles className="absolute -right-1 top-1 h-5 w-5 text-amber-400" />
                    </div>

                    <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700 dark:text-emerald-300">
                        Success · Pencil Booked
                    </p>

                    <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.055em] text-slate-950 dark:text-white sm:text-4xl">
                        Your booking is pencil booked for 24 hours.
                    </h2>

                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                        The request was received by BCCC EASE. Please complete the payment requirement before the deadline to keep the selected schedule protected.
                    </p>

                    <div className="mt-5 flex w-full max-w-xl items-start gap-3 rounded-[1.25rem] border border-amber-200/80 bg-amber-50/90 p-4 text-left text-sm leading-relaxed text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                        <CalendarClock className="mt-0.5 h-5 w-5 shrink-0" />
                        <p>
                            Kindly settle your payment on or before{' '}
                            <span className="font-black">{formatDateTimeLocal(payload.dueAtIso)}</span>. Failure to comply within the required period may result in automatic cancellation.
                        </p>
                    </div>

                    <div className="mt-5 h-1.5 w-full max-w-xl overflow-hidden rounded-full bg-slate-950/10 dark:bg-white/10">
                        <div className="booking-result-progress h-full rounded-full bg-emerald-500/80" />
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
