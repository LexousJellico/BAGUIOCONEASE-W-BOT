import { usePage } from '@inertiajs/react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

type FeedbackItem = {
  id: number;
  type: FeedbackType;
  title: string;
  message: string;
  duration: number;
};

type FlashPayload = {
  success?: string;
  error?: string;
  warning?: string;
  info?: string;
  message?: string;
  status?: string;
};

type PageProps = {
  flash?: FlashPayload;
  errors?: Record<string, string | string[]>;
  [key: string]: unknown;
};

function feedbackTitle(type: FeedbackType): string {
  if (type === 'success') return 'Success';
  if (type === 'error') return 'Action Failed';
  if (type === 'warning') return 'Please Review';
  return 'Notice';
}

function feedbackDuration(type: FeedbackType): number {
  if (type === 'success') return 1600;
  if (type === 'info') return 1800;
  if (type === 'warning') return 2600;
  return 3200;
}

function feedbackIcon(type: FeedbackType) {
  if (type === 'success') return CheckCircle2;
  if (type === 'error') return XCircle;
  if (type === 'warning') return AlertTriangle;
  return Info;
}

function feedbackTone(type: FeedbackType): string {
  if (type === 'success') {
    return 'border-emerald-300/35 bg-emerald-400/15 text-emerald-50 shadow-emerald-950/30';
  }

  if (type === 'error') {
    return 'border-red-300/35 bg-red-400/15 text-red-50 shadow-red-950/30';
  }

  if (type === 'warning') {
    return 'border-amber-300/35 bg-amber-400/15 text-amber-50 shadow-amber-950/30';
  }

  return 'border-sky-300/35 bg-sky-400/15 text-sky-50 shadow-sky-950/30';
}

function normalizeErrorMessage(errors?: Record<string, string | string[]>): string | null {
  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }

  const first = Object.values(errors)[0];

  if (Array.isArray(first)) {
    return first[0] ?? 'Please check the highlighted fields.';
  }

  return first || 'Please check the highlighted fields.';
}

function flashToFeedback(flash?: FlashPayload, errors?: Record<string, string | string[]>): Omit<FeedbackItem, 'id'> | null {
  if (flash?.success) {
    return {
      type: 'success',
      title: 'Success',
      message: flash.success,
      duration: feedbackDuration('success'),
    };
  }

  if (flash?.error) {
    return {
      type: 'error',
      title: 'Action Failed',
      message: flash.error,
      duration: feedbackDuration('error'),
    };
  }

  if (flash?.warning) {
    return {
      type: 'warning',
      title: 'Please Review',
      message: flash.warning,
      duration: feedbackDuration('warning'),
    };
  }

  if (flash?.info) {
    return {
      type: 'info',
      title: 'Notice',
      message: flash.info,
      duration: feedbackDuration('info'),
    };
  }

  if (flash?.message) {
    return {
      type: 'info',
      title: 'Notice',
      message: flash.message,
      duration: feedbackDuration('info'),
    };
  }

  if (flash?.status) {
    return {
      type: 'success',
      title: 'Success',
      message: flash.status,
      duration: feedbackDuration('success'),
    };
  }

  const errorMessage = normalizeErrorMessage(errors);

  if (errorMessage) {
    return {
      type: 'error',
      title: 'Please Check the Form',
      message: errorMessage,
      duration: feedbackDuration('error'),
    };
  }

  return null;
}

export function GlobalFeedbackLayer() {
  const page = usePage<PageProps>();
  const [feedback, setFeedback] = useState<FeedbackItem | null>(null);
  const [closing, setClosing] = useState(false);

  const serverFeedback = useMemo(
    () => flashToFeedback(page.props.flash, page.props.errors),
    [page.props.flash, page.props.errors],
  );

  useEffect(() => {
    if (!serverFeedback) {
      return;
    }

    setClosing(false);
    setFeedback({
      id: Date.now(),
      ...serverFeedback,
    });
  }, [serverFeedback]);

  useEffect(() => {
    function handleCustomFeedback(event: Event) {
      const detail = (event as CustomEvent).detail ?? {};
      const type = (detail.type ?? 'info') as FeedbackType;

      setClosing(false);
      setFeedback({
        id: Date.now(),
        type,
        title: detail.title ?? feedbackTitle(type),
        message: String(detail.message ?? ''),
        duration: Number(detail.duration ?? feedbackDuration(type)),
      });
    }

    window.addEventListener('bccc:feedback', handleCustomFeedback);

    return () => {
      window.removeEventListener('bccc:feedback', handleCustomFeedback);
    };
  }, []);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const closeTimer = window.setTimeout(() => {
      setClosing(true);
    }, feedback.duration);

    const clearTimer = window.setTimeout(() => {
      setFeedback(null);
      setClosing(false);
    }, feedback.duration + 280);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [feedback]);

  if (!feedback) {
    return null;
  }

  const Icon = feedbackIcon(feedback.type);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 px-4 backdrop-blur-[2px] transition duration-300 ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl transition duration-300 ${
          feedbackTone(feedback.type)
        } ${closing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-current opacity-10 blur-3xl" />

        <button
          type="button"
          onClick={() => {
            setClosing(true);
            window.setTimeout(() => setFeedback(null), 220);
          }}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/10 p-1.5 transition hover:bg-white/15"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex gap-4 pr-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Icon className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] opacity-75">
              BCCC EASE
            </p>

            <h2 className="mt-1 text-xl font-black tracking-tight">
              {feedback.title}
            </h2>

            <p className="mt-2 text-sm leading-6 opacity-85">
              {feedback.message}
            </p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                key={feedback.id}
                className="h-full rounded-full bg-white/70"
                style={{
                  animation: `bccc-feedback-progress ${feedback.duration}ms linear forwards`,
                }}
              />
            </div>
          </div>
        </div>

        {feedback.type === 'info' ? (
          <Loader2 className="absolute bottom-4 right-4 h-4 w-4 animate-spin opacity-30" />
        ) : null}
      </div>
    </div>
  );
}
