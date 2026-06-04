import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems = [
    { title: 'Profile', href: '/settings/profile' },
    { title: 'Password', href: '/settings/password' },
    { title: 'Two-Factor Auth', href: '/settings/two-factor' },
    { title: 'Appearance', href: '/settings/appearance' },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="settings-responsive-layout grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="settings-responsive-sidebar rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#121318]">
                <div className="mb-4">
                    <div className="text-xs font-semibold tracking-[0.3em] text-[#174f40] uppercase dark:text-[#8ea3ff]">
                        Settings
                    </div>
                    <h2 className="mt-2 text-xl font-semibold">
                        Account Preferences
                    </h2>
                </div>

                <nav className="settings-responsive-nav space-y-2">
                    {sidebarNavItems.map((item) => {
                        const active = currentPath === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                    active
                                        ? 'bg-[#174f40] text-white dark:bg-[#2d47ff]'
                                        : 'border border-black/10 bg-[#f7f5ef] text-[#22221f] hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'
                                }`}
                            >
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <section className="settings-responsive-content">{children}</section>
        </div>
    );
}
