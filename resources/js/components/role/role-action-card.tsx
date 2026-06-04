import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type RoleActionCardProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone?: 'admin' | 'manager' | 'staff' | 'user' | 'neutral';
  cta?: string;
  index?: number;
};

const easeLuxury = [0.22, 1, 0.36, 1] as const;

export function RoleActionCard({
  title,
  description,
  href,
  icon: Icon,
  cta = 'Open',
  index = 0,
}: RoleActionCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.985, filter: 'blur(8px)' }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.48, ease: easeLuxury, delay: Math.min(index * 0.055, 0.24) }}
      className="role-action-card group relative overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[var(--bccc-backend-gold-line)] hover:shadow-[var(--bccc-backend-shadow-medium)]"
    >
      <Link href={href} className="block h-full p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(169,132,67,0.10),transparent_42%)] opacity-0 transition duration-500 group-hover:opacity-100" />

        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.11)] text-[var(--bccc-backend-gold)] transition duration-500 group-hover:bg-[var(--bccc-backend-gold)] group-hover:text-white dark:group-hover:text-[#17120a]">
              <Icon className="h-5 w-5" />
            </span>

            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)] transition duration-500 group-hover:border-[var(--bccc-backend-gold-line)] group-hover:text-[var(--bccc-backend-gold)]">
              <ArrowUpRight className="h-4 w-4 transition duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>

          <h3 className="mt-5 text-xl font-semibold tracking-[-0.045em] text-[var(--bccc-backend-text)]">
            {title}
          </h3>

          <p className="mt-3 flex-1 text-sm leading-7 text-[var(--bccc-backend-muted)]">
            {description}
          </p>

          <div className="mt-5 border-t border-[var(--bccc-backend-line)] pt-4">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-gold)]">
              {cta}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
