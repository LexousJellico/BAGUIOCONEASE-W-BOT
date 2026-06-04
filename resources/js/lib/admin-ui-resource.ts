export type AdminResourceRole = 'admin' | 'manager' | 'staff' | 'user';

export type PaginatedLike<T = Record<string, unknown>> = {
    data?: T[];
    links?: Array<{
        url?: string | null;
        label?: string;
        active?: boolean;
    }>;
    meta?: Record<string, unknown>;
};

export function normalizeAdminResourceRole(
    value?: string | null,
): AdminResourceRole {
    if (value === 'admin') return 'admin';
    if (value === 'manager') return 'manager';
    if (value === 'staff') return 'staff';
    return 'user';
}

export function currentWorkspaceRole(): AdminResourceRole {
    if (typeof window === 'undefined') return 'admin';

    const path = window.location.pathname;

    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/manager')) return 'manager';
    if (path.startsWith('/staff')) return 'staff';

    return 'user';
}

export function extractCollection<T = Record<string, unknown>>(
    payload: unknown,
): T[] {
    if (Array.isArray(payload)) return payload as T[];

    if (payload && typeof payload === 'object' && 'data' in payload) {
        const data = (payload as PaginatedLike<T>).data;

        if (Array.isArray(data)) return data;
    }

    return [];
}

export function extractLinks(
    payload: unknown,
): Array<{ url?: string | null; label?: string; active?: boolean }> {
    if (!payload || typeof payload !== 'object') return [];

    const links = (payload as PaginatedLike).links;

    return Array.isArray(links) ? links : [];
}

export function textValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value);
}

export function numberText(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    const parsed = Number(value);
    return Number.isFinite(parsed) ? String(parsed) : '';
}

export function boolValue(value: unknown): boolean {
    return (
        value === true ||
        value === 1 ||
        value === '1' ||
        value === 'true' ||
        value === 'yes'
    );
}

export function money(value: unknown): string {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
    }).format(Number.isFinite(parsed) ? parsed : 0);
}

export function cleanLabel(value: unknown): string {
    return String(value || 'Not set')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function compactDate(value: unknown): string {
    if (!value) return 'Not set';

    const parsed = new Date(String(value));

    if (Number.isNaN(parsed.getTime())) return String(value);

    return parsed.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    });
}

export function roleHomeHref(role: AdminResourceRole): string {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'manager') return '/manager/dashboard';
    if (role === 'staff') return '/staff/dashboard';
    return '/my-dashboard';
}

export function resourceTone(role: AdminResourceRole) {
    if (role === 'admin') {
        return {
            label: 'Administrator',
            eyebrow: 'Executive Setup',
            border: 'border-amber-300/25',
            soft: 'bg-amber-300/10 text-amber-100',
        };
    }

    if (role === 'manager') {
        return {
            label: 'Manager',
            eyebrow: 'Management Review',
            border: 'border-sky-300/25',
            soft: 'bg-sky-300/10 text-sky-100',
        };
    }

    if (role === 'staff') {
        return {
            label: 'Staff',
            eyebrow: 'Operations Desk',
            border: 'border-emerald-300/25',
            soft: 'bg-emerald-300/10 text-emerald-100',
        };
    }

    return {
        label: 'Client',
        eyebrow: 'Client Portal',
        border: 'border-yellow-300/25',
        soft: 'bg-yellow-300/10 text-yellow-100',
    };
}
