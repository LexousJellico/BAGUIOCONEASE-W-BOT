import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  X,
} from 'lucide-react';

export type BlockKey = 'AM' | 'PM' | 'EVE' | 'DAY';

export type CalendarBlockFormState = {
  title: string;
  area: string;
  notes: string;
  block: BlockKey;
  public_status: 'red' | 'gold' | 'blue';
  date_from: string;
  date_to: string;
  block_id?: number | string | null;
  explode_by_day?: boolean;
  exclude_weekends?: boolean;
  exclude_dates?: string;
};

type Props = {
  open: boolean;
  mode?: 'single' | 'bulk';
  title: string;
  form: CalendarBlockFormState;
  areaOptions: string[];
  busy: boolean;
  error: string;
  helperText?: string;
  saveLabel?: string;
  onChange: (patch: Partial<CalendarBlockFormState>) => void;
  onClose: () => void;
  onSave: () => void;
};

const blockOptions: Array<{
  value: BlockKey;
  label: string;
  time: string;
}> = [
  { value: 'AM', label: 'AM', time: '6:00 AM - 12:00 PM' },
  { value: 'PM', label: 'PM', time: '12:00 PM - 6:00 PM' },
  { value: 'EVE', label: 'EVE', time: '6:00 PM - 11:59 PM' },
  { value: 'DAY', label: 'Whole Day', time: '6:00 AM - 11:59 PM' },
];

const statusOptions: Array<{
  value: CalendarBlockFormState['public_status'];
  label: string;
  description: string;
}> = [
  {
    value: 'red',
    label: 'Red · Blocked',
    description: 'Unavailable for public requests.',
  },
  {
    value: 'gold',
    label: 'Gold · Private',
    description: 'Reserved/private booking, details hidden publicly.',
  },
  {
    value: 'blue',
    label: 'Blue · Public',
    description: 'Public-facing event or visible calendar activity.',
  },
];

const easeLuxury = [0.22, 1, 0.36, 1] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function statusTone(value: CalendarBlockFormState['public_status']) {
  if (value === 'blue') {
    return 'border-sky-300/40 bg-sky-400/10 text-sky-700 dark:text-sky-200';
  }

  if (value === 'gold') {
    return 'border-amber-300/45 bg-amber-400/10 text-amber-700 dark:text-amber-200';
  }

  return 'border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-200';
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-gold)]">
        {icon}
        {label}
      </span>

      {children}
    </label>
  );
}

export function CalendarBlockModal({
  open,
  mode = 'single',
  title,
  form,
  areaOptions,
  busy,
  error,
  helperText,
  saveLabel = 'Save calendar block',
  onChange,
  onClose,
  onSave,
}: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[180] flex items-center justify-center p-3 sm:p-6"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.22, ease: easeLuxury }}
        >
          <button
            type="button"
            aria-label="Close calendar block modal"
            onClick={onClose}
            className="absolute inset-0 bg-black/62 backdrop-blur-md"
          />

          <motion.section
            initial={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 24, scale: 0.985, filter: 'blur(12px)' }
            }
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 20, scale: 0.985, filter: 'blur(12px)' }
            }
            transition={{ duration: 0.34, ease: easeLuxury }}
            className="relative max-h-[92svh] w-full max-w-4xl overflow-y-auto border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-strong)] text-[var(--bccc-backend-text)] shadow-[var(--bccc-backend-shadow-strong)] backdrop-blur-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[var(--bccc-backend-line)] p-5 sm:p-6">
              <div>
                <p className="inline-flex items-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.10)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-backend-gold)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Calendar Management
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[var(--bccc-backend-text)]">
                  {title}
                </h2>

                {helperText ? (
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--bccc-backend-muted)]">
                    {helperText}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-text)] transition hover:border-[var(--bccc-backend-gold-line)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_18rem]">
              <main className="grid gap-4">
                <Field label="Title" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                  <input
                    value={form.title}
                    onChange={(event) => onChange({ title: event.target.value })}
                    className="bccc-backend-input"
                    placeholder="Internal calendar note, maintenance, private event..."
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Area / Venue" icon={<MapPin className="h-3.5 w-3.5" />}>
                    <select
                      value={form.area}
                      onChange={(event) => onChange({ area: event.target.value })}
                      className="bccc-backend-input"
                    >
                      <option value="">All areas / unspecified</option>
                      {areaOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Block" icon={<Clock3 className="h-3.5 w-3.5" />}>
                    <select
                      value={form.block}
                      onChange={(event) => onChange({ block: event.target.value as BlockKey })}
                      className="bccc-backend-input"
                    >
                      {blockOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} · {option.time}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Date From" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                    <input
                      type="date"
                      value={form.date_from}
                      onChange={(event) => onChange({ date_from: event.target.value })}
                      className="bccc-backend-input"
                    />
                  </Field>

                  <Field label="Date To" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                    <input
                      type="date"
                      value={form.date_to}
                      onChange={(event) => onChange({ date_to: event.target.value })}
                      className="bccc-backend-input"
                    />
                  </Field>
                </div>

                <Field label="Public Status" icon={<Layers3 className="h-3.5 w-3.5" />}>
                  <div className="grid gap-2 md:grid-cols-3">
                    {statusOptions.map((option) => {
                      const active = form.public_status === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => onChange({ public_status: option.value })}
                          className={cx(
                            'border p-4 text-left transition duration-500 hover:-translate-y-0.5',
                            active
                              ? statusTone(option.value)
                              : 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)] hover:border-[var(--bccc-backend-gold-line)]',
                          )}
                        >
                          <span className="block text-xs font-black uppercase tracking-[0.18em]">
                            {option.label}
                          </span>
                          <span className="mt-2 block text-xs leading-5 opacity-80">
                            {option.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {mode === 'bulk' ? (
                  <section className="grid gap-3 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-gold)]">
                      Bulk Creation Options
                    </p>

                    <label className="flex items-start gap-3 text-sm leading-6 text-[var(--bccc-backend-muted)]">
                      <input
                        type="checkbox"
                        checked={Boolean(form.explode_by_day)}
                        onChange={(event) => onChange({ explode_by_day: event.target.checked })}
                        className="mt-1"
                      />
                      <span>
                        <strong className="block text-[var(--bccc-backend-text)]">
                          Create one block per day
                        </strong>
                        Useful when every day in the range must become a separate editable item.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 text-sm leading-6 text-[var(--bccc-backend-muted)]">
                      <input
                        type="checkbox"
                        checked={Boolean(form.exclude_weekends)}
                        onChange={(event) => onChange({ exclude_weekends: event.target.checked })}
                        className="mt-1"
                      />
                      <span>
                        <strong className="block text-[var(--bccc-backend-text)]">
                          Exclude weekends
                        </strong>
                        Skip Saturdays and Sundays when creating daily blocks.
                      </span>
                    </label>

                    <Field label="Exclude Dates">
                      <textarea
                        value={form.exclude_dates || ''}
                        onChange={(event) => onChange({ exclude_dates: event.target.value })}
                        rows={3}
                        className="bccc-backend-input min-h-[100px] py-3"
                        placeholder="Optional. Example: 2026-05-12, 2026-05-15"
                      />
                    </Field>
                  </section>
                ) : null}

                <Field label="Notes">
                  <textarea
                    value={form.notes}
                    onChange={(event) => onChange({ notes: event.target.value })}
                    rows={4}
                    className="bccc-backend-input min-h-[120px] py-3"
                    placeholder="Operational notes, reason for block, public/private context..."
                  />
                </Field>
              </main>

              <aside className="space-y-4">
                <section className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-muted)]">
                    Preview
                  </p>

                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--bccc-backend-text)]">
                    {form.title || 'Untitled block'}
                  </h3>

                  <div className="mt-4 grid gap-2 text-sm leading-6 text-[var(--bccc-backend-muted)]">
                    <p>
                      <strong className="text-[var(--bccc-backend-text)]">Area:</strong>{' '}
                      {form.area || 'All areas'}
                    </p>
                    <p>
                      <strong className="text-[var(--bccc-backend-text)]">Block:</strong>{' '}
                      {blockOptions.find((option) => option.value === form.block)?.label || form.block}
                    </p>
                    <p>
                      <strong className="text-[var(--bccc-backend-text)]">Range:</strong>{' '}
                      {form.date_from || '—'} to {form.date_to || '—'}
                    </p>
                  </div>

                  <span
                    className={cx(
                      'mt-4 inline-flex border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]',
                      statusTone(form.public_status),
                    )}
                  >
                    {statusOptions.find((option) => option.value === form.public_status)?.label}
                  </span>
                </section>

                {error ? (
                  <section className="border border-rose-300/40 bg-rose-400/10 p-4 text-sm leading-6 text-rose-700 dark:text-rose-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>{error}</p>
                    </div>
                  </section>
                ) : (
                  <section className="border border-emerald-300/35 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-700 dark:text-emerald-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>Ready to save. Dates and block type will be validated by Laravel.</p>
                    </div>
                  </section>
                )}
              </aside>
            </div>

            <footer className="flex flex-col gap-3 border-t border-[var(--bccc-backend-line)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <p className="text-xs leading-6 text-[var(--bccc-backend-muted)]">
                Red blocks prevent public requests. Gold hides private details. Blue appears as public activity.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-11 items-center justify-center border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-5 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={onSave}
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[var(--bccc-green-800)] px-5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:bg-[var(--bccc-green-900)] disabled:cursor-wait disabled:opacity-70"
                >
                  {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {busy ? 'Saving...' : saveLabel}
                </button>
              </div>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
