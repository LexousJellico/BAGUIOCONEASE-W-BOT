import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings, User2 } from 'lucide-react';

type NavUserRecord = {
  name?: string | null;
  email?: string | null;
  role_name?: string | null;
  role?: string | null;
};

function initialsFromName(name?: string) {
  if (!name) {
    return 'U';
  }

  const parts = name.trim().split(/\s+/).slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'U';
}

export function NavUser() {
  const page = usePage();
  const user = page.props.auth?.user as NavUserRecord | undefined;
  const name = user?.name ?? 'BCCC User';
  const email = user?.email ?? 'user@bccc-ease.local';
  const role = user?.role_name ?? user?.role ?? 'User';
  const initials = initialsFromName(name);

  const logout = () => {
    router.post('/logout');
  };

  return (
    <div className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-3 shadow-[var(--bccc-backend-shadow-soft)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.11)] text-xs font-black uppercase tracking-[0.08em] text-[var(--bccc-backend-gold)]">
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--bccc-backend-text)]">{name}</p>
          <p className="mt-1 truncate text-xs text-[var(--bccc-backend-muted)]">{email}</p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-gold)]">
            {String(role)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--bccc-backend-line)] pt-3">
        <Link
          href="/profile"
          className="inline-flex h-9 items-center justify-center border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)] transition hover:border-[var(--bccc-backend-gold-line)] hover:text-[var(--bccc-backend-text)]"
          aria-label="Profile"
        >
          <User2 className="h-4 w-4" />
        </Link>

        <Link
          href="/settings/profile"
          className="inline-flex h-9 items-center justify-center border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)] transition hover:border-[var(--bccc-backend-gold-line)] hover:text-[var(--bccc-backend-text)]"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={logout}
          className="inline-flex h-9 items-center justify-center border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)] transition hover:border-rose-300/40 hover:text-rose-600 dark:hover:text-rose-200"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
