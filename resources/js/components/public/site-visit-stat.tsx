import { Activity, Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export type SiteMetricPayload = {
    pageKey?: string;
    label?: string;
    value?: number | string;
    last24Hours?: number | string;
    updatedAt?: string | null;
    updatedLabel?: string | null;
};

type Props = {
    metric?: SiteMetricPayload | null;
    compact?: boolean;
};

function csrfToken() {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function numberFormat(value: number | string | undefined | null) {
    const numeric = Number(value ?? 0);

    if (!Number.isFinite(numeric)) {
        return '0';
    }

    return new Intl.NumberFormat('en-PH', {
        maximumFractionDigits: 0,
    }).format(numeric);
}

function shouldRecord(pageKey: string) {
    try {
        const key = `bccc-site-view:${pageKey}`;
        const last = Number(window.localStorage.getItem(key) || 0);
        const now = Date.now();

        if (last && now - last < 55 * 60 * 1000) {
            return false;
        }

        window.localStorage.setItem(key, String(now));
        return true;
    } catch {
        return true;
    }
}

export default function SiteVisitStat({ metric, compact = false }: Props) {
    const [current, setCurrent] = useState<SiteMetricPayload | null>(metric ?? null);
    const pageKey = current?.pageKey || metric?.pageKey || 'home';

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (!shouldRecord(pageKey)) {
            return;
        }

        const controller = new AbortController();

        fetch('/public/site-views', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            signal: controller.signal,
            body: JSON.stringify({ page_key: pageKey }),
        })
            .then((response) => (response.ok ? response.json() : null))
            .then((payload) => {
                if (payload?.metric) {
                    setCurrent(payload.metric);
                }
            })
            .catch(() => {
                // Metrics must never interrupt the public landing page.
            });

        return () => controller.abort();
    }, [pageKey]);

    const updated = useMemo(() => {
        if (!current?.updatedAt) {
            return current?.updatedLabel || 'Updated hourly';
        }

        try {
            return `Updated ${new Intl.DateTimeFormat('en-PH', {
                hour: 'numeric',
                minute: '2-digit',
            }).format(new Date(current.updatedAt))}`;
        } catch {
            return current.updatedLabel || 'Updated hourly';
        }
    }, [current?.updatedAt, current?.updatedLabel]);

    if (compact) {
        return (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white/72 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7f612c] shadow-[0_12px_34px_rgba(47,37,23,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/8 dark:text-[#f2d899]">
                <Eye className="h-4 w-4" />
                {numberFormat(current?.value)} visits
            </span>
        );
    }

    return (
        <article className="bccc-site-visit-stat group relative min-w-[18rem] overflow-hidden rounded-[1.35rem] border border-[#d9c7a6]/70 bg-white/86 p-4 shadow-[0_16px_40px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.065]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#c9a35a]/20 blur-2xl transition duration-500 group-hover:scale-125" />

            <div className="relative flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                    <Eye className="h-5 w-5" />
                </span>

                <span className="min-w-0">
                    <span className="block text-2xl font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                        {numberFormat(current?.value)}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                        {current?.label || 'Website Visits'}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 truncate text-xs text-[#6e604c] dark:text-white/48">
                        <Activity className="h-3.5 w-3.5" />
                        {updated} · {numberFormat(current?.last24Hours)} in 24h
                    </span>
                </span>
            </div>
        </article>
    );
}
