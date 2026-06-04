
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: 'emerald' | 'sky' | 'amber' | 'red' | 'violet' | 'slate';
};

const toneMap = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  sky: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  violet: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  slate: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
} as const;

export default function OpsKpiCard({ label, value, hint, icon: Icon, tone = 'sky' }: Props) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121318]">
      <div className="flex items-center gap-3">
        <div className={cn('rounded-full p-2', toneMap[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
            {label}
          </div>
          <div className="mt-1 truncate text-2xl font-semibold text-slate-900 dark:text-white">
            {value}
          </div>
          {hint ? (
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {hint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
