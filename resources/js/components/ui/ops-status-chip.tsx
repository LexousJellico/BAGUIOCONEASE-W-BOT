
import { cn } from '@/lib/utils';

type ChipTone =
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'red'
  | 'violet'
  | 'slate'
  | 'rose'
  | 'indigo';

type Props = {
  label: string;
  tone?: ChipTone;
  className?: string;
};

const toneMap: Record<ChipTone, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  red: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-200',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200',
};

export default function OpsStatusChip({ label, tone = 'slate', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
        toneMap[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
