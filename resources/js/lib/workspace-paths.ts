export type WorkspacePrefix = '' | '/admin' | '/manager' | '/staff';

export function currentWorkspacePrefix(pathname?: string): WorkspacePrefix {
    const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');

    if (path === '/admin' || path.startsWith('/admin/')) {
        return '/admin';
    }

    if (path === '/manager' || path.startsWith('/manager/')) {
        return '/manager';
    }

    if (path === '/staff' || path.startsWith('/staff/')) {
        return '/staff';
    }

    return '';
}

export function workspacePath(path: string, pathname?: string): string {
    const prefix = currentWorkspacePrefix(pathname);
    const normalized = path.startsWith('/') ? path : `/${path}`;

    if (!prefix) {
        return normalized;
    }

    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
        return normalized;
    }

    return `${prefix}${normalized}`;
}

export function workspaceUsersPath(path = '', pathname?: string): string {
    const suffix = path.trim();

    if (!suffix) {
        return workspacePath('/users', pathname);
    }

    return workspacePath(`/users/${suffix.replace(/^\/+/, '')}`, pathname);
}
