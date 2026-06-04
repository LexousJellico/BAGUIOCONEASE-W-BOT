import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    X,
  } from 'lucide-react';
  import type { ReactNode } from 'react';
  import { useState } from 'react';

  type ConfirmActionProps = {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'warning' | 'success' | 'neutral';
    disabled?: boolean;
    processing?: boolean;
    children: ReactNode;
    onConfirm: () => void;
    className?: string;
  };

  function toneClasses(tone: ConfirmActionProps['tone']) {
    if (tone === 'danger') {
      return {
        icon: 'bg-red-400/15 text-red-100',
        confirm: 'border-red-300/30 bg-red-500/15 text-red-50 hover:bg-red-500/20',
        panel: 'border-red-300/25',
      };
    }

    if (tone === 'warning') {
      return {
        icon: 'bg-amber-400/15 text-amber-100',
        confirm: 'border-amber-300/30 bg-amber-500/15 text-amber-50 hover:bg-amber-500/20',
        panel: 'border-amber-300/25',
      };
    }

    if (tone === 'success') {
      return {
        icon: 'bg-emerald-400/15 text-emerald-100',
        confirm: 'border-emerald-300/30 bg-emerald-500/15 text-emerald-50 hover:bg-emerald-500/20',
        panel: 'border-emerald-300/25',
      };
    }

    return {
      icon: 'bg-white/10 text-white',
      confirm: 'border-white/15 bg-white/15 text-white hover:bg-white/20',
      panel: 'border-white/10',
    };
  }

  export function ConfirmAction({
    title = 'Confirm Action',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'neutral',
    disabled = false,
    processing = false,
    children,
    onConfirm,
    className,
  }: ConfirmActionProps) {
    const [open, setOpen] = useState(false);
    const classes = toneClasses(tone);
    const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle;

    return (
      <>
        <button
          type="button"
          disabled={disabled || processing}
          onClick={() => setOpen(true)}
          className={className}
        >
          {children}
        </button>

        {open ? (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <div
              className={`relative w-full max-w-md overflow-hidden rounded-[2rem] border bg-slate-950/95 p-5 text-white shadow-2xl backdrop-blur-xl ${classes.panel}`}
            >
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-3xl" />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/10 p-1.5 transition hover:bg-white/15"
                aria-label="Close confirmation"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative flex gap-4 pr-8">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${classes.icon}`}>
                  <Icon className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-white/50">
                    Confirmation Required
                  </p>
                  <h2 className="mt-1 text-xl font-black">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/70">{message}</p>
                </div>
              </div>

              <div className="relative mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/10 px-5 text-sm font-black transition hover:bg-white/15"
                >
                  {cancelLabel}
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    onConfirm();
                    setOpen(false);
                  }}
                  className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${classes.confirm}`}
                >
                  {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }
