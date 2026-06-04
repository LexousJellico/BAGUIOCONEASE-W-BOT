import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FeedbackVariant = 'success' | 'warning' | 'danger' | 'info';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: FeedbackVariant;
  title: string;
  description?: string;
  details?: string[];
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  autoCloseMs?: number | null;
  busy?: boolean;
};

const toneMap: Record<
  FeedbackVariant,
  {
    ring: string;
    chip: string;
    iconWrap: string;
    icon: typeof CheckCircle2;
  }
> = {
  success: {
    ring: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200',
    chip: 'border-emerald-300/70 bg-emerald-100 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/40 dark:text-emerald-200',
    iconWrap: 'bg-emerald-600 text-white',
    icon: CheckCircle2,
  },
  warning: {
    ring: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200',
    chip: 'border-amber-300/70 bg-amber-100 text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/40 dark:text-amber-200',
    iconWrap: 'bg-amber-500 text-black',
    icon: AlertTriangle,
  },
  danger: {
    ring: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200',
    chip: 'border-red-300/70 bg-red-100 text-red-700 dark:border-red-700/40 dark:bg-red-900/40 dark:text-red-200',
    iconWrap: 'bg-red-600 text-white',
    icon: Trash2,
  },
  info: {
    ring: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200',
    chip: 'border-sky-300/70 bg-sky-100 text-sky-700 dark:border-sky-700/40 dark:bg-sky-900/40 dark:text-sky-200',
    iconWrap: 'bg-sky-600 text-white',
    icon: Info,
  },
};

export default function ActionFeedbackModal({
  open,
  onOpenChange,
  variant = 'info',
  title,
  description,
  details = [],
  confirmText = 'Okay',
  cancelText,
  onConfirm,
  autoCloseMs = null,
  busy = false,
}: Props) {
  const tone = toneMap[variant];
  const Icon = tone.icon;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, busy, onOpenChange]);

  useEffect(() => {
    if (!open || !autoCloseMs || autoCloseMs <= 0 || busy) return;

    const timer = window.setTimeout(() => {
      onOpenChange(false);
    }, autoCloseMs);

    return () => window.clearTimeout(timer);
  }, [open, autoCloseMs, busy, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onOpenChange(false);
        }}
      />

      <div
        className={cn(
          'relative w-full max-w-xl overflow-hidden rounded-[2rem] border bg-white shadow-[0_40px_120px_rgba(0,0,0,0.28)]',
          'animate-in fade-in zoom-in-95 duration-200 dark:bg-[#121318]',
          tone.ring,
        )}
      >
        <div className="absolute right-4 top-4">
          <button
            type="button"
            onClick={() => {
              if (!busy) onOpenChange(false);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/80 text-slate-700 transition hover:scale-[1.04] dark:border-white/10 dark:bg-white/10 dark:text-white"
            disabled={busy}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'mt-0.5 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                tone.iconWrap,
              )}
            >
              <Icon className="h-7 w-7" />
            </div>

            <div className="min-w-0 flex-1 pr-10">
              <div
                className={cn(
                  'inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]',
                  tone.chip,
                )}
              >
                {variant === 'danger' ? 'Warning' : variant}
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h2>

              {description ? (
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {details.length > 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Details
              </div>

              <div className="mt-3 space-y-2">
                {details.map((detail, index) => (
                  <div
                    key={`${detail}-${index}`}
                    className="rounded-xl border border-black/5 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-[#17181c] dark:text-slate-200"
                  >
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {cancelText ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                {cancelText}
              </Button>
            ) : null}

            <Button
              type="button"
              onClick={() => {
                if (onConfirm) {
                  onConfirm();
                  return;
                }
                onOpenChange(false);
              }}
              disabled={busy}
              className={cn(
                variant === 'danger' &&
                  'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
                variant === 'warning' &&
                  'bg-amber-500 text-black hover:bg-amber-400 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-400',
                variant === 'success' &&
                  'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700',
              )}
            >
              {busy ? 'Processing...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
