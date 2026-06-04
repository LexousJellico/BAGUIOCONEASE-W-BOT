import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import NotificationBell from '@/components/layout/NotificationBell';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    getRoleDescription,
    getRoleFromAuth,
    getRoleInitials,
    getRoleQuickActions,
    getRoleTone,
    hrefToString,
    isHrefActive,
} from '@/lib/role-ui';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, Sparkles } from 'lucide-react';

export function RoleWorkspaceBar() {
    const page = usePage<SharedData>();
    const auth = page.props.auth;
    const role = getRoleFromAuth(auth);
    const tone = getRoleTone(role);
    const initials = getRoleInitials(auth);
    const quickActions = getRoleQuickActions(role);

    return (
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <div className="hidden min-w-0 items-center gap-3 xl:flex">
                <div
                    className={`inline-flex items-center gap-3 rounded-2xl border px-3 py-2 ${tone.brandClass}`}
                >
                    <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/15 text-xs font-black tracking-[0.18em] text-current">
                        <span
                            className={`absolute inset-0 rounded-xl blur-lg ${tone.glowClass}`}
                        />
                        <span className="relative">{initials}</span>
                    </span>

                    <div className="min-w-0">
                        <div className="truncate text-xs font-black tracking-[0.2em] uppercase">
                            {tone.eyebrow}
                        </div>
                        <div
                            className={`max-w-[28rem] truncate text-xs ${tone.mutedTextClass}`}
                        >
                            {getRoleDescription(role)}
                        </div>
                    </div>
                </div>

                <div className="hidden items-center gap-1 2xl:flex">
                    {quickActions.slice(0, 3).map((item) => {
                        const href = hrefToString(item.href);
                        const active = isHrefActive(page.url, item.href);
                        const Icon = item.icon;

                        return (
                            <Button
                                key={`${item.title}-${href}`}
                                asChild
                                size="sm"
                                variant="ghost"
                                className={`h-9 rounded-full px-3 text-xs font-bold ${
                                    active
                                        ? tone.activeClass
                                        : 'text-current/70 hover:bg-white/10 hover:text-current'
                                }`}
                            >
                                <Link href={href}>
                                    {Icon ? (
                                        <Icon className="mr-1.5 h-3.5 w-3.5" />
                                    ) : null}
                                    {item.title}
                                </Link>
                            </Button>
                        );
                    })}
                </div>
            </div>

            <NotificationBell />
            <AppearanceToggleDropdown />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-9 rounded-full border px-3 text-xs font-bold ${tone.badgeClass}`}
                    >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        {tone.label}
                        <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-70" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="w-80 rounded-2xl p-2"
                >
                    <DropdownMenuLabel className="px-3 py-2">
                        <div className="text-xs font-black tracking-[0.22em] text-muted-foreground uppercase">
                            Workspace shortcuts
                        </div>
                        <div className="mt-1 text-sm font-semibold text-foreground">
                            {tone.label}
                        </div>
                    </DropdownMenuLabel>

                    <div className="grid gap-1 p-1">
                        {quickActions.map((item) => {
                            const Icon = item.icon;
                            const href = hrefToString(item.href);
                            const active = isHrefActive(page.url, item.href);

                            return (
                                <Link
                                    key={`${item.title}-${href}`}
                                    href={href}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                                        active
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    }`}
                                >
                                    {Icon ? <Icon className="h-4 w-4" /> : null}
                                    <span className="font-medium">
                                        {item.title}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
