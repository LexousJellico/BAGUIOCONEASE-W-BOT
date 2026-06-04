import { Link, usePage } from '@inertiajs/react';
import { ArrowRightLeft, Globe2, LayoutDashboard } from 'lucide-react';

type BookingViewSwitchProps = {
    showBackend?: boolean;
    backendHref?: string;
    frontendHref?: string;
    className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export default function BookingViewSwitch({
    showBackend = true,
    backendHref = '/dashboard',
    frontendHref = '/book',
    className,
}: BookingViewSwitchProps) {
    const { url } = usePage();

    const activeFrontend = url.startsWith('/book') || url.startsWith('/my-bookings');
    const activeBackend = !activeFrontend;

    return (
        <div
            className={cx(
                'inline-flex items-center gap-1 rounded-full border border-[#d9c7a6]/70 bg-white/78 p-1 shadow-[0_14px_34px_rgba(47,37,23,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/7',
                className,
            )}
        >
            <Link
                href={frontendHref}
                className={cx(
                    'inline-flex h-10 items-center gap-2 rounded-full px-3 text-xs font-bold uppercase tracking-[0.16em] transition',
                    activeFrontend
                        ? 'bg-[#2f2517] text-white shadow-[0_12px_30px_rgba(47,37,23,0.18)] dark:bg-white dark:text-[#17120b]'
                        : 'text-[#4a3b27] hover:bg-[#f7f0e3] dark:text-white/68 dark:hover:bg-white/10',
                )}
            >
                <Globe2 className="h-4 w-4" />
                Frontend
            </Link>

            {showBackend ? (
                <>
                    <span className="grid h-8 w-8 place-items-center text-[#9d7b3d] dark:text-[#f1d89b]">
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                    </span>

                    <Link
                        href={backendHref}
                        className={cx(
                            'inline-flex h-10 items-center gap-2 rounded-full px-3 text-xs font-bold uppercase tracking-[0.16em] transition',
                            activeBackend
                                ? 'bg-[#2f2517] text-white shadow-[0_12px_30px_rgba(47,37,23,0.18)] dark:bg-white dark:text-[#17120b]'
                                : 'text-[#4a3b27] hover:bg-[#f7f0e3] dark:text-white/68 dark:hover:bg-white/10',
                        )}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Backend
                    </Link>
                </>
            ) : null}
        </div>
    );
}
