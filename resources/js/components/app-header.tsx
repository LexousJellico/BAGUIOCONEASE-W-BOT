import AppLogo from '@/components/app-logo';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { RoleWorkspaceBar } from '@/components/role/role-workspace-bar';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    getHeaderMainLinks,
    getRoleFromAuth,
    getRoleMenuGroups,
    getRoleTone,
    hrefToString,
    isHrefActive,
} from '@/lib/role-ui';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const role = getRoleFromAuth(page.props.auth);
    const tone = getRoleTone(role);
    const headerLinks = getHeaderMainLinks(role);
    const mobileGroups = getRoleMenuGroups(role);

    return (
        <>
            <header
                className={`sticky top-0 z-40 border-b ${tone.headerClass}`}
            >
                <div className="flex h-16 items-center gap-3 px-4">
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl text-current hover:bg-white/10 hover:text-current"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>

                            <SheetContent
                                side="left"
                                className={`flex h-full w-80 flex-col border-r p-0 ${tone.sidebarClass}`}
                            >
                                <SheetTitle className="sr-only">
                                    Navigation Menu
                                </SheetTitle>

                                <SheetHeader className="border-b border-white/10 p-4 text-left">
                                    <Link
                                        href={tone.homeHref}
                                        className={`rounded-2xl border p-3 ${tone.brandClass}`}
                                    >
                                        <AppLogo />
                                    </Link>

                                    <div className="mt-3">
                                        <p className="text-xs font-black tracking-[0.22em] uppercase opacity-70">
                                            {tone.eyebrow}
                                        </p>
                                        <p className="mt-1 text-lg font-black">
                                            {tone.label}
                                        </p>
                                    </div>
                                </SheetHeader>

                                <div className="flex-1 overflow-auto p-3">
                                    {mobileGroups.map((group) => (
                                        <div key={group.title} className="mb-5">
                                            <p className="mb-2 px-2 text-xs font-black tracking-[0.2em] uppercase opacity-55">
                                                {group.title}
                                            </p>

                                            <div className="space-y-1">
                                                {group.items.map((item) => {
                                                    const Icon = item.icon;
                                                    const href = hrefToString(
                                                        item.href,
                                                    );
                                                    const active = isHrefActive(
                                                        page.url,
                                                        item.href,
                                                    );

                                                    return (
                                                        <Link
                                                            key={`${item.title}-${href}`}
                                                            href={hrefToString(item.href)}
                                                            className={cn(
                                                                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition',
                                                                active
                                                                    ? tone.activeClass
                                                                    : 'text-current/75 hover:bg-white/10 hover:text-current',
                                                            )}
                                                        >
                                                            {Icon ? (
                                                                <Icon className="h-4 w-4" />
                                                            ) : null}
                                                            {item.title}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href={tone.homeHref}
                        prefetch
                        className="flex shrink-0 items-center"
                    >
                        <AppLogo />
                    </Link>

                    <nav className="ml-4 hidden items-center gap-1 lg:flex">
                        {headerLinks.map((item) => {
                            const Icon = item.icon;
                            const active = isHrefActive(page.url, item.href);

                            return (
                                <Button
                                    key={`${item.title}-${hrefToString(item.href)}`}
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        'h-9 rounded-full px-3 text-xs font-bold',
                                        active
                                            ? tone.activeClass
                                            : 'text-current/70 hover:bg-white/10 hover:text-current',
                                    )}
                                >
                                    <Link href={hrefToString(item.href)}>
                                        {Icon ? (
                                            <Icon className="mr-1.5 h-3.5 w-3.5" />
                                        ) : null}
                                        {item.title}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>

                    <RoleWorkspaceBar />
                </div>
            </header>

            {breadcrumbs.length > 1 ? (
                <div
                    className={`hidden border-b px-4 py-3 md:block ${tone.headerClass}`}
                >
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            ) : null}
        </>
    );
}
