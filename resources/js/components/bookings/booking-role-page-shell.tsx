import { RoleWorkspaceShell } from '@/components/role/role-workspace-shell';
import { bookingBasePath, normalizeWorkspaceRole } from '@/lib/booking-role-ui';
import { roleDashboardHref, type RoleThemeKey } from '@/lib/role-theme';
import type { BreadcrumbItem } from '@/types';
import type { ReactNode } from 'react';

type BookingRolePageShellProps = {
    role?: string | null;
    title?: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    compact?: boolean;
};

function bookingBreadcrumbs(role: RoleThemeKey, title?: string): BreadcrumbItem[] {
    return [
        {
            title:
                role === 'admin'
                    ? 'Admin'
                    : role === 'manager'
                      ? 'Manager'
                      : role === 'staff'
                        ? 'Staff'
                        : 'Client Portal',
            href: roleDashboardHref(role),
        },
        {
            title: role === 'user' ? 'My Bookings' : 'Bookings',
            href: bookingBasePath(role),
        },
        ...(title ? [{ title, href: bookingBasePath(role) }] : []),
    ];
}

function bookingEyebrow(role: RoleThemeKey): string {
    if (role === 'admin') return 'Booking Operations';
    if (role === 'manager') return 'Booking Review';
    if (role === 'staff') return 'Assisted Booking Desk';

    return 'Client Booking Workspace';
}

function fallbackTitle(role: RoleThemeKey): string {
    if (role === 'admin') return 'Booking Operations';
    if (role === 'manager') return 'Booking Review';
    if (role === 'staff') return 'Staff Booking Desk';

    return 'My Bookings';
}

function fallbackDescription(role: RoleThemeKey): string {
    if (role === 'admin') {
        return 'Review reservations, schedules, client details, payment proof, MICE/report details, and public calendar visibility.';
    }

    if (role === 'manager') {
        return 'Review booking records, schedules, payment readiness, and operational requirements.';
    }

    if (role === 'staff') {
        return 'Assist clients, encode bookings, review schedules, and support daily venue operations.';
    }

    return 'Create and track your BCCC event requests inside your client workspace, separate from the public website.';
}

export function BookingRolePageShell({
    role,
    title,
    description,
    actions,
    children,
    compact = false,
}: BookingRolePageShellProps) {
    const normalizedRole = normalizeWorkspaceRole(role) as RoleThemeKey;
    const resolvedTitle = title || fallbackTitle(normalizedRole);
    const resolvedDescription = description || fallbackDescription(normalizedRole);
    const resolvedEyebrow = bookingEyebrow(normalizedRole);

    return (
        <RoleWorkspaceShell
            role={normalizedRole}
            title={resolvedTitle}
            eyebrow={resolvedEyebrow}
            description={resolvedDescription}
            breadcrumbs={bookingBreadcrumbs(normalizedRole, title)}
            actions={actions}
            compact={compact}
        >
            {children}
        </RoleWorkspaceShell>
    );
}
