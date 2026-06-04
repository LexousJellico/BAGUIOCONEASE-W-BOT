import {
    getRoleTheme,
    normalizeRoleTheme,
    roleDashboardHref,
    type RoleThemeKey,
} from '@/lib/role-theme';

export type AdminResourceRole = RoleThemeKey;

export type PaginationLink = {
    url?: string | null;
    label?: string | null;
    active?: boolean;
};

export type CollectionLike<T = unknown> =
    | T[]
    | {
          data?: T[];
          links?: PaginationLink[];
          meta?: {
              links?: PaginationLink[];
          };
      }
    | null
    | undefined;

export function currentWorkspaceRole(): AdminResourceRole {
    if (typeof window === 'undefined') return 'admin';

    const path = window.location.pathname;

    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/manager')) return 'manager';
    if (path.startsWith('/staff')) return 'staff';

    return 'user';
}

export function normalizeAdminResourceRole(
    value?: string | null,
): AdminResourceRole {
    return normalizeRoleTheme(value);
}

export function resourceTone(role?: string | null) {
    return getRoleTheme(role);
}

export function roleHomeHref(role?: string | null): string {
    return roleDashboardHref(role);
}

export function cleanLabel(value?: unknown): string {
    const text = String(value ?? '').trim();

    if (!text) return 'Not set';

    return text
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function textValue(value?: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value);
}

export function numberText(value?: unknown): string {
    if (value === null || value === undefined || value === '') return '';

    const number = Number(value);

    if (!Number.isFinite(number)) return String(value);

    return String(number);
}

export function compactDate(value?: unknown): string {
    if (!value) return '—';

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function compactDateTime(value?: unknown): string {
    if (!value) return '—';

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function money(value?: unknown): string {
    const number = Number(value ?? 0);

    if (!Number.isFinite(number)) return '₱0.00';

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(number);
}

export function extractCollection<T = unknown>(value?: CollectionLike<T>): T[] {
    if (Array.isArray(value)) return value;

    if (value && Array.isArray(value.data)) return value.data;

    return [];
}

export function extractLinks(value?: CollectionLike): PaginationLink[] {
    if (!value || Array.isArray(value)) return [];

    if (Array.isArray(value.links)) return value.links;

    if (Array.isArray(value.meta?.links)) return value.meta.links;

    return [];
}

export function adminBasePath(
    role: AdminResourceRole,
    section: string,
): string {
    if (role === 'manager') return `/manager/${section}`;
    if (role === 'staff') return `/staff/${section}`;
    if (role === 'user') return '/my-dashboard';

    return `/admin/${section}`;
}

export function yesNo(value: unknown): string {
    return value === true || value === 1 || value === '1' || value === 'true'
        ? 'Yes'
        : 'No';
}

export function booleanBadgeTone(value: unknown): string {
    return yesNo(value) === 'Yes'
        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
        : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200';
}

export function statusBadgeTone(value?: unknown): string {
    const normalized = String(value ?? '').toLowerCase();

    if (
        [
            'confirmed',
            'approved',
            'active',
            'completed',
            'paid',
            'resolved',
            'closed',
        ].includes(normalized)
    ) {
        return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
    }

    if (
        ['pending', 'partial', 'for_review', 'new', 'open', 'unread'].includes(
            normalized,
        )
    ) {
        return 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200';
    }

    if (['declined', 'cancelled', 'failed', 'rejected'].includes(normalized)) {
        return 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-200';
    }

    return 'border-border bg-muted text-muted-foreground';
}
