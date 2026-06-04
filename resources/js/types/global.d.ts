import type { PageProps as InertiaPageProps } from '@/types';

declare global {
    interface Window {
        Ziggy?: {
            location?: string;
            url?: string;
            port?: number | null;
            defaults?: Record<string, unknown>;
            routes?: Record<string, unknown>;
        };
    }

    function route(
        name: string,
        params?: Record<string, unknown> | string | number | Array<string | number>,
        absolute?: boolean,
    ): string;
}

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps {
        [key: string]: unknown;
    }
}

declare module '@inertiajs/react' {
    export function usePage<TPageProps extends Record<string, unknown> = Record<string, unknown>>(): {
        component: string;
        props: InertiaPageProps<TPageProps>;
        url: string;
        version: string | null;
        clearHistory: boolean;
        encryptHistory: boolean;
    };
}

export {};
