import { usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, ImageUp, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type FlashBag = {
    success?: string | null;
    error?: string | null;
    message?: string | null;
    status?: string | null;
};

type PageErrors = Record<string, string | string[] | undefined>;

type SharedPageProps = {
    flash?: FlashBag;
    errors?: PageErrors;
};

type PopupTone = 'success' | 'upload' | 'deleted' | 'error';

type PopupState = {
    key: string;
    tone: PopupTone;
    title: string;
    message: string;
};

type PopupEventDetail = {
    key?: string;
    tone?: PopupTone;
    title?: string;
    message: string;
};

const ACTION_FEEDBACK_EVENT = 'bccc:action-feedback';

export function triggerActionFeedback(detail: PopupEventDetail) {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(
        new CustomEvent<PopupEventDetail>(ACTION_FEEDBACK_EVENT, {
            detail,
        }),
    );
}

export function notifyBcccSuccess(message: string, title = 'Success') {
    triggerActionFeedback({
        tone: 'success',
        title,
        message,
    });
}

export function notifyBcccError(message: string, title = 'Action not completed') {
    triggerActionFeedback({
        tone: 'error',
        title,
        message,
    });
}

export function notifyBcccDeleted(message: string, title = 'Deleted') {
    triggerActionFeedback({
        tone: 'deleted',
        title,
        message,
    });
}

function firstErrorMessage(errors: PageErrors | undefined): string | null {
    if (!errors) {
        return null;
    }

    for (const value of Object.values(errors)) {
        if (Array.isArray(value)) {
            const first = value.find((item) => typeof item === 'string' && item.trim() !== '');
            if (first) {
                return first;
            }
        }

        if (typeof value === 'string' && value.trim() !== '') {
            return value;
        }
    }

    return null;
}

function inferSuccessMeta(message: string): { tone: PopupTone; title: string } {
    const text = message.toLowerCase();

    if (/(delete|deleted|remove|removed|archive|archived|trash|trashed)/i.test(text)) {
        return { tone: 'deleted', title: 'Deleted' };
    }

    if (/(upload|uploaded|image|images|photo|file|files|proof|attachment)/i.test(text)) {
        return { tone: 'upload', title: 'Uploaded' };
    }

    if (/(save|saved|update|updated|create|created|added|changed|reorder|sorted|sent|submitted)/i.test(text)) {
        return { tone: 'success', title: 'Saved' };
    }

    return { tone: 'success', title: 'Success' };
}

function popupMeta(tone: PopupTone) {
    switch (tone) {
        case 'success':
            return {
                icon: CheckCircle2,
                shell:
                    'border-emerald-200/80 bg-white/92 text-slate-950 shadow-[0_22px_70px_rgba(15,23,42,0.16)] dark:border-emerald-400/20 dark:bg-[#111827]/92 dark:text-white',
                iconWrap:
                    'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300',
                title: 'text-emerald-700 dark:text-emerald-300',
            };
        case 'upload':
            return {
                icon: ImageUp,
                shell:
                    'border-sky-200/80 bg-white/92 text-slate-950 shadow-[0_22px_70px_rgba(15,23,42,0.16)] dark:border-sky-400/20 dark:bg-[#111827]/92 dark:text-white',
                iconWrap: 'bg-sky-500/12 text-sky-600 dark:bg-sky-400/12 dark:text-sky-300',
                title: 'text-sky-700 dark:text-sky-300',
            };
        case 'deleted':
            return {
                icon: Trash2,
                shell:
                    'border-rose-200/80 bg-white/92 text-slate-950 shadow-[0_22px_70px_rgba(15,23,42,0.16)] dark:border-rose-400/20 dark:bg-[#111827]/92 dark:text-white',
                iconWrap: 'bg-rose-500/12 text-rose-600 dark:bg-rose-400/12 dark:text-rose-300',
                title: 'text-rose-700 dark:text-rose-300',
            };
        default:
            return {
                icon: AlertTriangle,
                shell:
                    'border-amber-200/80 bg-white/92 text-slate-950 shadow-[0_22px_70px_rgba(15,23,42,0.16)] dark:border-amber-400/20 dark:bg-[#111827]/92 dark:text-white',
                iconWrap:
                    'bg-amber-500/12 text-amber-600 dark:bg-amber-400/12 dark:text-amber-300',
                title: 'text-amber-700 dark:text-amber-300',
            };
    }
}

function buildPopupFromEvent(detail: PopupEventDetail): PopupState {
    const inferred = inferSuccessMeta(detail.message);
    const tone = detail.tone ?? inferred.tone;
    const title = detail.title ?? (tone === 'error' ? 'Action not completed' : inferred.title);

    return {
        key: detail.key ?? `${tone}:${title}:${detail.message}`,
        tone,
        title,
        message: detail.message,
    };
}

export default function ActionFeedbackPopup() {
    const page = usePage();
    const { flash, errors } = page.props as SharedPageProps;

    const [mounted, setMounted] = useState(false);
    const [popup, setPopup] = useState<PopupState | null>(null);
    const timerRef = useRef<number | null>(null);

    const candidate = useMemo<PopupState | null>(() => {
        const successMessage = flash?.success ?? flash?.message ?? flash?.status;

        if (successMessage) {
            const meta = inferSuccessMeta(successMessage);

            return {
                key: `success:${successMessage}`,
                tone: meta.tone,
                title: meta.title,
                message: successMessage,
            };
        }

        if (flash?.error) {
            return {
                key: `error:${flash.error}`,
                tone: 'error',
                title: 'Action not completed',
                message: flash.error,
            };
        }

        const firstError = firstErrorMessage(errors);

        if (firstError) {
            return {
                key: `validation:${firstError}`,
                tone: 'error',
                title: 'Please check the form',
                message: firstError,
            };
        }

        return null;
    }, [flash?.success, flash?.message, flash?.status, flash?.error, errors]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!candidate) {
            return;
        }

        setPopup((current) => {
            if (current?.key === candidate.key) {
                return current;
            }

            return candidate;
        });
    }, [candidate]);

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<PopupEventDetail>).detail;

            if (!detail?.message) {
                return;
            }

            const next = buildPopupFromEvent(detail);

            setPopup((current) => {
                if (current?.key === next.key) {
                    return current;
                }

                return next;
            });
        };

        window.addEventListener(ACTION_FEEDBACK_EVENT, handler as EventListener);

        return () => {
            window.removeEventListener(ACTION_FEEDBACK_EVENT, handler as EventListener);
        };
    }, []);

    useEffect(() => {
        if (!popup) {
            return;
        }

        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        timerRef.current = window.setTimeout(() => {
            setPopup(null);
            timerRef.current = null;
        }, popup.tone === 'error' ? 4200 : 2600);

        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [popup]);

    if (!mounted || !popup) {
        return null;
    }

    const meta = popupMeta(popup.tone);
    const Icon = meta.icon;

    return createPortal(
        <div className="fixed inset-0 z-[999998] flex items-center justify-center bg-[#17120b]/24 px-4 backdrop-blur-[3px]">
            <div
                className={`booking-action-feedback pointer-events-auto relative flex w-full max-w-lg items-start gap-4 overflow-hidden rounded-[1.75rem] border p-5 backdrop-blur-2xl transition dark:backdrop-blur-2xl ${meta.shell}`}
                role="status"
                aria-live={popup.tone === 'error' ? 'assertive' : 'polite'}
            >
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-current opacity-10 blur-3xl" />
                <div className={`booking-action-feedback-icon mt-0.5 grid h-12 w-12 shrink-0 place-items-center rounded-full ${meta.iconWrap}`}>
                    <Icon className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1 pr-8">
                    <p className={`text-xs font-black tracking-[0.22em] uppercase ${meta.title}`}>
                        {popup.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-200">
                        {popup.message}
                    </p>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div
                            key={popup.key}
                            className="h-full rounded-full bg-current opacity-55"
                            style={{ animation: `bccc-feedback-progress ${popup.tone === 'error' ? 4200 : 2600}ms linear forwards` }}
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setPopup(null)}
                    className="absolute right-4 top-4 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-white/70 text-slate-500 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    aria-label="Close popup"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>,
        document.body,
    );
}
