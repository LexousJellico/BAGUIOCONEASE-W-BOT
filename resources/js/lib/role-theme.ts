export type RoleThemeKey = 'admin' | 'manager' | 'staff' | 'user';

export type RoleTheme = {
    key: RoleThemeKey;
    label: string;
    eyebrow: string;
    shortLabel: string;
    shellClass: string;
    pageClass: string;
    heroClass: string;
    panelClass: string;
    cardClass: string;
    badgeClass: string;
    buttonClass: string;
    subtleButtonClass: string;
    inputClass: string;
    textAccentClass: string;
};

export function normalizeRoleTheme(value?: string | null): RoleThemeKey {
    if (value === 'admin') return 'admin';
    if (value === 'manager') return 'manager';
    if (value === 'staff') return 'staff';
    return 'user';
}

/**
 * One backend visual language.
 * Role identity is label-based only, not a separate full color theme per role.
 */
const shared = {
    shellClass: 'backend-page-shell',
    pageClass: 'backend-page-shell',
    heroClass: 'backend-page-hero',
    panelClass: 'backend-shell-card',
    cardClass: 'backend-shell-card',
    badgeClass:
        'border-[#c9a96a]/30 bg-[#c9a96a]/10 text-[#7a5c21] dark:text-[#e8d8b5]',
    buttonClass:
        'border-[#c9a96a]/35 bg-[#c9a96a]/14 text-foreground hover:bg-[#c9a96a]/20',
    subtleButtonClass:
        'border-border/70 bg-background/70 text-foreground hover:bg-muted/80',
    inputClass:
        'border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#c9a96a]/60 focus:ring-[#c9a96a]/15',
    textAccentClass: 'text-[#8a6b2e] dark:text-[#e8d8b5]',
};

const themes: Record<RoleThemeKey, RoleTheme> = {
    admin: {
        key: 'admin',
        label: 'Administrator',
        eyebrow: 'Executive Workspace',
        shortLabel: 'AD',
        ...shared,
    },
    manager: {
        key: 'manager',
        label: 'Manager',
        eyebrow: 'Management Workspace',
        shortLabel: 'MG',
        ...shared,
    },
    staff: {
        key: 'staff',
        label: 'Staff',
        eyebrow: 'Operations Workspace',
        shortLabel: 'ST',
        ...shared,
    },
    user: {
        key: 'user',
        label: 'Client',
        eyebrow: 'Client Portal',
        shortLabel: 'CL',
        ...shared,
    },
};

export function getRoleTheme(role?: string | null): RoleTheme {
    return themes[normalizeRoleTheme(role)];
}

export function roleDashboardHref(role?: string | null): string {
    const normalized = normalizeRoleTheme(role);

    if (normalized === 'admin') return '/admin/dashboard';
    if (normalized === 'manager') return '/manager/dashboard';
    if (normalized === 'staff') return '/staff/dashboard';

    return '/my-dashboard';
}

export function roleBookingHref(role?: string | null): string {
    const normalized = normalizeRoleTheme(role);

    if (normalized === 'admin') return '/admin/bookings';
    if (normalized === 'manager') return '/manager/bookings';
    if (normalized === 'staff') return '/staff/bookings';

    return '/my-bookings';
}

export function roleCalendarHref(role?: string | null): string {
    const normalized = normalizeRoleTheme(role);

    if (normalized === 'admin') return '/admin/calendar';
    if (normalized === 'manager') return '/manager/calendar';
    if (normalized === 'staff') return '/staff/calendar';

    return '/my-calendar';
}
