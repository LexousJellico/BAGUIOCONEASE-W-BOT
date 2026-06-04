import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

type RoleKpiCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tone?: 'admin' | 'manager' | 'staff' | 'user' | 'neutral';
  index?: number;
};

const easeLuxury = [0.22, 1, 0.36, 1] as const;

function toneLabel(tone?: RoleKpiCardProps['tone']) {
  if (tone === 'admin') return 'Executive';
  if (tone === 'manager') return 'Review';
  if (tone === 'staff') return 'Ops';
  if (tone === 'user') return 'Client';
  return 'Workspace';
}

export function RoleKpiCard({
  title,
  value,
  description,
  icon: Icon,
  tone = 'neutral',
  index = 0,
}: RoleKpiCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.985, filter: 'blur(8px)' }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: easeLuxury, delay: Math.min(index * 0.055, 0.22) }}
      className="role-kpi-card group relative overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-5 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[var(--bccc-backend-gold-line)] hover:shadow-[var(--bccc-backend-shadow-medium)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(169,132,67,0.10),transparent_42%)] opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-backend-muted)]">
            {title}
          </p>

          <p className="mt-4 text-4xl font-semibold tracking-[-0.075em] text-[var(--bccc-backend-text)] sm:text-5xl">
            {value}
          </p>
        </div>

        <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.11)] text-[var(--bccc-backend-gold)] transition duration-500 group-hover:bg-[var(--bccc-backend-gold)] group-hover:text-white dark:group-hover:text-[#17120a]">
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-3 border-t border-[var(--bccc-backend-line)] pt-4">
        <p className="text-sm leading-6 text-[var(--bccc-backend-muted)]">
          {description || 'Workspace metric'}
        </p>

        <span className="shrink-0 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-gold)]">
          {toneLabel(tone)}
        </span>
      </div>
    </motion.article>
  );
}
