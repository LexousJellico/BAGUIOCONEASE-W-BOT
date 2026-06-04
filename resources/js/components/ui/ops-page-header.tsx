
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
};

export default function OpsPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  compact = false,
}: Props) {
  return (
    <div
      className={cn(
        'rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]',
        compact && 'px-5 py-6',
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#eef7f4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0f8b6d] dark:bg-[#172128] dark:text-[#9dc0ff]">
              {eyebrow}
            </div>
          ) : null}

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>

          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
