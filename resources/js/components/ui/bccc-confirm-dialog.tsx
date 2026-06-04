import { AlertTriangle, CheckCircle2, Info, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ConfirmTone = 'default' | 'danger' | 'success' | 'warning';

type ConfirmOptions = {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    tone?: ConfirmTone;
};

type ConfirmRequest = Required<ConfirmOptions> & {
    id: string;
    resolve: (value: boolean) => void;
};

const CONFIRM_EVENT = 'bccc:confirm-action';

const defaultOptions: Required<ConfirmOptions> = {
    title: 'Confirm action',
    message: 'Are you sure you want to continue?',
    confirmText: 'Continue',
    cancelText: 'Cancel',
    tone: 'default',
};

export function confirmBcccAction(options: ConfirmOptions): Promise<boolean> {
    if (typeof window === 'undefined') {
        return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
        const request: ConfirmRequest = {
            ...defaultOptions,
            ...options,
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            resolve,
        };

        window.dispatchEvent(
            new CustomEvent<ConfirmRequest>(CONFIRM_EVENT, {
                detail: request,
            }),
        );
    });
}

function getToneMeta(tone: ConfirmTone) {
    switch (tone) {
        case 'danger':
            return {
                icon: Trash2,
                iconClass: 'bg-rose-500/12 text-rose-600 dark:bg-rose-400/12 dark:text-rose-300',
                confirmClass:
                    'bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400',
            };
        case 'success':
            return {
                icon: CheckCircle2,
                iconClass:
                    'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300',
                confirmClass:
                    'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400',
            };
        case 'warning':
            return {
                icon: AlertTriangle,
                iconClass: 'bg-amber-500/12 text-amber-700 dark:bg-amber-400/12 dark:text-amber-300',
                confirmClass:
                    'bg-amber-600 text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400',
            };
        default:
            return {
                icon: Info,
                iconClass: 'bg-slate-500/12 text-slate-700 dark:bg-white/10 dark:text-white',
                confirmClass:
                    'bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100',
            };
    }
}

export default function GlobalConfirmDialog() {
    const [mounted, setMounted] = useState(false);
    const [request, setRequest] = useState<ConfirmRequest | null>(null);

    useEffect(() => {
        setMounted(true);

        const handler = (event: Event) => {
            const detail = (event as CustomEvent<ConfirmRequest>).detail;

            if (!detail?.message || typeof detail.resolve !== 'function') {
                return;
            }

            setRequest(detail);
        };

        window.addEventListener(CONFIRM_EVENT, handler as EventListener);

        return () => {
            window.removeEventListener(CONFIRM_EVENT, handler as EventListener);
        };
    }, []);

    useEffect(() => {
        if (!request) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                request.resolve(false);
                setRequest(null);
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [request]);

    if (!mounted || !request) {
        return null;
    }

    const meta = getToneMeta(request.tone);
    const Icon = meta.icon;

    const answer = (value: boolean) => {
        request.resolve(value);
        setRequest(null);
    };

    return createPortal(
        <div className="fixed inset-0 z-[999999] grid place-items-center bg-white/70 px-4 py-6 backdrop-blur-2xl dark:bg-slate-950/55">
            <button
                type="button"
                className="absolute inset-0 cursor-default"
                onClick={() => answer(false)}
                aria-label="Close confirmation dialog"
            />

            <section
                className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-black/10 bg-white/95 p-5 text-slate-950 shadow-[0_28px_100px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[#111827]/95 dark:text-white"
                role="dialog"
                aria-modal="true"
                aria-labelledby="bccc-confirm-title"
                aria-describedby="bccc-confirm-message"
            >
                <button
                    type="button"
                    onClick={() => answer(false)}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white/70 text-slate-500 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    aria-label="Close confirmation dialog"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex gap-4 pr-8">
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${meta.iconClass}`}>
                        <Icon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 id="bccc-confirm-title" className="text-lg font-semibold tracking-tight">
                            {request.title}
                        </h2>

                        <p
                            id="bccc-confirm-message"
                            className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                        >
                            {request.message}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => answer(false)}
                        className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                        {request.cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={() => answer(true)}
                        className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 ${meta.confirmClass}`}
                    >
                        {request.confirmText}
                    </button>
                </div>
            </section>
        </div>,
        document.body,
    );
}
