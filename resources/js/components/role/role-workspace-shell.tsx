import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

type RoleWorkspaceShellProps = {
  role?: 'admin' | 'manager' | 'staff' | 'user' | string | null;
  title: string;
  eyebrow?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children: ReactNode;
  compact?: boolean;
};

function roleLabel(role?: string | null) {
  if (role === 'admin') return 'Administrator';
  if (role === 'manager') return 'Manager';
  if (role === 'staff') return 'Staff';
  if (role === 'user') return 'Client';
  return 'Workspace';
}

function roleEyebrow(role?: string | null) {
  if (role === 'admin') return 'Executive Workspace';
  if (role === 'manager') return 'Management Workspace';
  if (role === 'staff') return 'Operations Workspace';
  if (role === 'user') return 'Client Portal';
  return 'BCCC EASE';
}

export function RoleWorkspaceShell({
  role = 'admin',
  title,
  eyebrow,
  description,
  breadcrumbs = [],
  actions,
  children,
  compact = false,
}: RoleWorkspaceShellProps) {
  const normalizedRole = String(role || 'admin').toLowerCase();

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={title} />

      <section
        data-role-workspace-header
        className={`role-workspace-header relative mb-5 overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl ${
          compact ? 'p-5' : 'p-5 sm:p-6 lg:p-7'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(169,132,67,0.11),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(23,56,45,0.10),transparent_42%)]" />

        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.10)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-backend-gold)]">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow || roleEyebrow(normalizedRole)}
              </span>

              <span className="inline-flex border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-muted)]">
                {roleLabel(normalizedRole)}
              </span>
            </div>

            <h1 className="mt-4 max-w-5xl text-3xl font-semibold leading-[0.96] tracking-[-0.06em] text-[var(--bccc-backend-text)] sm:text-4xl lg:text-5xl">
              {title}
            </h1>

            {description ? (
              <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--bccc-backend-muted)]">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="role-workspace-actions flex flex-wrap gap-2 lg:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      </section>

      <div className="role-workspace-body">{children}</div>
    </AppLayout>
  );
}
