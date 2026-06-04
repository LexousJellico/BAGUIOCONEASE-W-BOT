import { AlertTriangle, Clipboard, Home, RefreshCw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type RuntimeErrorPayload = {
    title: string;
    message: string;
    stack?: string | null;
    source?: string | null;
};

function normalizeUnknownError(error: unknown): RuntimeErrorPayload {
    if (error instanceof Error) {
        return {
            title: 'Runtime error detected',
            message: error.message || 'An unexpected JavaScript error occurred.',
            stack: error.stack || null,
            source: error.name || null,
        };
    }

    if (typeof error === 'string') {
        return {
            title: 'Runtime error detected',
            message: error,
            stack: null,
            source: null,
        };
    }

    try {
        return {
            title: 'Runtime error detected',
            message: JSON.stringify(error, null, 2),
            stack: null,
            source: null,
        };
    } catch {
        return {
            title: 'Runtime error detected',
            message: 'An unknown runtime error occurred.',
            stack: null,
            source: null,
        };
    }
}

function isIgnorableRuntimeMessage(message: string): boolean {
    const normalized = message.toLowerCase();

    return (
        normalized.includes('resizeobserver loop completed') ||
        normalized.includes('resizeobserver loop limit exceeded') ||
        normalized.includes('script error')
    );
}

export default function RuntimeErrorOverlay() {
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState<RuntimeErrorPayload | null>(null);
    const [copied, setCopied] = useState(false);

    const isDev = import.meta.env.DEV;

    useEffect(() => {
        setMounted(true);

        const handleError = (event: ErrorEvent) => {
            const payload = normalizeUnknownError(event.error || event.message);

            if (isIgnorableRuntimeMessage(payload.message)) {
                return;
            }

            setError({
                ...payload,
                source: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : payload.source,
            });
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const payload = normalizeUnknownError(event.reason);

            if (isIgnorableRuntimeMessage(payload.message)) {
                return;
            }

            setError({
                ...payload,
                title: 'Unhandled request or promise error',
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    useEffect(() => {
        if (!copied) {
            return;
        }

        const timer = window.setTimeout(() => setCopied(false), 1500);

        return () => window.clearTimeout(timer);
    }, [copied]);

    const errorText = useMemo(() => {
        if (!error) {
            return '';
        }

        return [
            `Title: ${error.title}`,
            `Message: ${error.message}`,
            error.source ? `Source: ${error.source}` : null,
            error.stack ? `Stack:\n${error.stack}` : null,
        ]
            .filter(Boolean)
            .join('\n\n');
    }, [error]);

    const copyError = async () => {
        try {
            await navigator.clipboard.writeText(errorText);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    if (!mounted || !error) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[1000000] grid place-items-center bg-white/76 px-4 py-6 backdrop-blur-2xl dark:bg-slate-950/70">
            <section className="relative max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-hidden rounded-[1.8rem] border border-rose-200/80 bg-white/96 text-slate-950 shadow-[0_30px_110px_rgba(15,23,42,0.24)] dark:border-rose-400/20 dark:bg-[#101419]/96 dark:text-white">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-amber-300 to-rose-500" />

                <div className="flex items-start justify-between gap-4 border-b border-black/10 p-5 dark:border-white/10">
                    <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rose-500/12 text-rose-600 dark:bg-rose-400/12 dark:text-rose-300">
                            <AlertTriangle className="h-6 w-6" />
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-700 dark:text-rose-300">
                                BCCC EASE Runtime Notice
                            </p>

                            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
                                {error.title}
                            </h1>

                            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                The page encountered a browser-side error. This panel prevents a full blank screen and shows what needs to be fixed.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 bg-white/70 text-slate-500 transition hover:bg-white dark:border-white/10 dark:bg-white/7 dark:text-slate-300 dark:hover:bg-white/12"
                        aria-label="Close runtime error panel"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[calc(100vh-17rem)] overflow-y-auto p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                        <p className="font-semibold">Error message</p>
                        <p className="mt-2 break-words">{error.message}</p>
                    </div>

                    {error.source ? (
                        <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                            <p className="font-semibold">Source</p>
                            <p className="mt-2 break-all font-mono text-xs">{error.source}</p>
                        </div>
                    ) : null}

                    {isDev && error.stack ? (
                        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-[1.25rem] border border-black/10 bg-slate-950 p-4 text-xs leading-6 text-slate-100 dark:border-white/10">
                            {error.stack}
                        </pre>
                    ) : null}

                    {!isDev ? (
                        <p className="mt-4 rounded-[1.25rem] border border-black/10 bg-slate-50 p-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/7 dark:text-slate-300">
                            Developer stack details are hidden outside development mode. Refresh the page first. If it persists, check the browser console.
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-3 border-t border-black/10 p-5 dark:border-white/10 sm:flex-row sm:justify-end">
                    <a
                        href="/"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                    >
                        <Home className="h-4 w-4" />
                        Go Home
                    </a>

                    <button
                        type="button"
                        onClick={copyError}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                    >
                        <Clipboard className="h-4 w-4" />
                        {copied ? 'Copied' : 'Copy Error'}
                    </button>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>
            </section>
        </div>,
        document.body,
    );
}
