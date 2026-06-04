import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, LoaderCircle, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type NoticeType = 'success' | 'error' | 'info' | 'loading';

type NoticePayload = {
    type?: NoticeType;
    title?: string;
    message?: string;
    duration?: number;
};

const NOTICE_EVENT = 'bccc:notice';

export function notifyApp(payload: NoticePayload) {
    window.dispatchEvent(
        new CustomEvent<NoticePayload>(NOTICE_EVENT, {
            detail: payload,
        }),
    );
}

export function notifySuccess(message = 'Saved successfully.', title = 'Success') {
    notifyApp({
        type: 'success',
        title,
        message,
        duration: 1600,
    });
}

export function notifyError(message = 'Something went wrong.', title = 'Action failed') {
    notifyApp({
        type: 'error',
        title,
        message,
        duration: 3800,
    });
}

export function notifyInfo(message = 'Please wait.', title = 'Notice') {
    notifyApp({
        type: 'info',
        title,
        message,
        duration: 2200,
    });
}

export function notifyLoading(message = 'Please wait while the system prepares the next view.', title = 'Loading') {
    notifyApp({
        type: 'loading',
        title,
        message,
        duration: 0,
    });
}

function iconFor(type: NoticeType) {
    if (type === 'success') return CheckCircle2;
    if (type === 'error') return AlertCircle;
    if (type === 'loading') return LoaderCircle;

    return Info;
}

function defaultTitle(type: NoticeType) {
    if (type === 'success') return 'Success';
    if (type === 'error') return 'Action needed';
    if (type === 'loading') return 'Loading';

    return 'Notice';
}

function styleFor(type: NoticeType) {
    if (type === 'success') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200';
    }

    if (type === 'error') {
        return 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200';
    }

    if (type === 'loading') {
        return 'bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]';
    }

    return 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200';
}

export default function AppNoticeCenter() {
    const [notice, setNotice] = useState<Required<NoticePayload> | null>(null);
    const timerRef = useRef<number | null>(null);
    const loadingRef = useRef(false);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    function closeNotice() {
        clearTimer();
        setNotice(null);
    }

    const show = useCallback((payload: NoticePayload) => {
        clearTimer();

        const type = payload.type ?? 'info';

        const nextNotice: Required<NoticePayload> = {
            type,
            title: payload.title || defaultTitle(type),
            message: payload.message || '',
            duration: payload.duration ?? (type === 'loading' ? 0 : 1600),
        };

        setNotice(nextNotice);

        if (nextNotice.duration > 0) {
            timerRef.current = window.setTimeout(() => {
                setNotice(null);
            }, nextNotice.duration);
        }
    }, [clearTimer]);

    useEffect(() => {
        const removeStart = router.on('start', () => {
            loadingRef.current = true;

            window.setTimeout(() => {
                if (!loadingRef.current) return;

                show({
                    type: 'loading',
                    title: 'Preparing page',
                    message: 'Please wait while the system loads the next view.',
                    duration: 0,
                });
            }, 240);
        });

        const removeSuccess = router.on('success', () => {
            loadingRef.current = false;

            show({
                type: 'success',
                title: 'Ready',
                message: 'Page loaded successfully.',
                duration: 900,
            });
        });

        const removeError = router.on('error', () => {
            loadingRef.current = false;

            show({
                type: 'error',
                title: 'Request failed',
                message: 'Please check the page fields or try again.',
                duration: 3800,
            });
        });

        const removeFinish = router.on('finish', () => {
            loadingRef.current = false;
        });

        function handleCustomNotice(event: Event) {
            const detail = (event as CustomEvent<NoticePayload>).detail;
            show(detail);
        }

        window.addEventListener(NOTICE_EVENT, handleCustomNotice);

        return () => {
            clearTimer();
            removeStart();
            removeSuccess();
            removeError();
            removeFinish();
            window.removeEventListener(NOTICE_EVENT, handleCustomNotice);
        };
    }, [clearTimer, show]);

    const type = notice?.type ?? 'info';
    const Icon = iconFor(type);

    return (
        <AnimatePresence>
            {notice ? (
                <motion.div
                    initial={{ opacity: 0, y: -18, scale: 0.96, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -12, scale: 0.96, filter: 'blur(8px)' }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed right-4 top-4 z-[100000] w-[min(92vw,25rem)] overflow-hidden rounded-[1.2rem] border border-[#d9c7a6]/70 bg-white/94 p-4 text-[#21180d] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101419]/94 dark:text-white"
                >
                    <div className="flex gap-3">
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${styleFor(type)}`}>
                            <Icon className={type === 'loading' ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
                        </span>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold tracking-[-0.02em]">{notice.title}</p>

                            {notice.message ? (
                                <p className="mt-1 text-sm leading-6 text-[#6e604c] dark:text-white/62">
                                    {notice.message}
                                </p>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={closeNotice}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/5 transition hover:bg-black/10 dark:bg-white/8 dark:hover:bg-white/14"
                            aria-label="Close notice"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
