import {
    isBackendActive,
    userHasPermission,
    type BackendNavItem,
  } from '@/lib/backend-navigation';
  import { Link, usePage } from '@inertiajs/react';
  import { ChevronRight } from 'lucide-react';

  type NavMainProps = {
    label: string;
    items?: BackendNavItem[];
  };

  type PermissionRecord = { permissions?: string[] };

  function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
  }

  export function NavMain({ label, items = [] }: NavMainProps) {
    const page = usePage();
    const permissions = [
      ...((page.props.auth?.permissions ?? []) as string[]),
      ...(((page.props.auth?.user as PermissionRecord | undefined)?.permissions ?? []) as string[]),
    ];

    const visibleItems = items.filter((item) => userHasPermission(permissions, item.permission));

    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <section className="bccc-backend-nav-group">
        <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.26em] text-[var(--bccc-backend-muted)]">
          {label}
        </p>

        <div className="grid gap-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isBackendActive(page.url, item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  'group relative flex min-h-11 items-center gap-3 overflow-hidden border px-3 text-sm font-semibold transition duration-500',
                  active
                    ? 'border-[var(--bccc-backend-gold-line)] bg-[var(--bccc-backend-active)] text-[var(--bccc-backend-text)] shadow-[var(--bccc-backend-shadow-soft)]'
                    : 'border-transparent text-[var(--bccc-backend-muted)] hover:border-[var(--bccc-backend-line)] hover:bg-[var(--bccc-backend-hover)] hover:text-[var(--bccc-backend-text)]',
                )}
              >
                <span
                  className={cx(
                    'flex h-8 w-8 shrink-0 items-center justify-center border transition duration-500',
                    active
                      ? 'border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.14)] text-[var(--bccc-backend-gold)]'
                      : 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)] group-hover:border-[var(--bccc-backend-gold-line)] group-hover:text-[var(--bccc-backend-gold)]',
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>

                <span className="min-w-0 flex-1 truncate">{item.title}</span>

                {active ? (
                  <span className="h-2 w-2 shrink-0 bg-[var(--bccc-backend-gold)]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-60" />
                )}
              </Link>
            );
          })}
        </div>
      </section>
    );
  }
