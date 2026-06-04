import { Link } from '@inertiajs/react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type AppErrorBoundaryProps = {
    children: ReactNode;
    pageName?: string;
};

type AppErrorBoundaryState = {
    hasError: boolean;
    error?: Error;
};

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
    state: AppErrorBoundaryState = {
        hasError: false,
        error: undefined,
    };

    static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (import.meta.env.DEV) {
            console.error('[BCCC EASE] Page render failed:', error, errorInfo);
        }
    }

    componentDidUpdate(previousProps: AppErrorBoundaryProps) {
        if (previousProps.pageName !== this.props.pageName && this.state.hasError) {
            this.setState({
                hasError: false,
                error: undefined,
            });
        }
    }

    private refreshPage = () => {
        window.location.reload();
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        const errorMessage =
            import.meta.env.DEV && this.state.error?.message
                ? this.state.error.message
                : 'The page could not be displayed properly. Please refresh the page and try again.';

        return (
            <main className="min-h-screen bg-[#f7f4ee] px-4 py-10 text-slate-950 dark:bg-[#0d1117] dark:text-white">
                <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
                    <section className="relative w-full overflow-hidden rounded-[2rem] border border-amber-200/70 bg-white/90 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.15)] backdrop-blur-2xl dark:border-amber-400/20 dark:bg-[#111827]/90">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-rose-300 to-amber-400" />

                        <div className="flex flex-col gap-5 sm:flex-row">
                            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-amber-500/12 text-amber-700 dark:bg-amber-400/12 dark:text-amber-300">
                                <AlertTriangle className="h-7 w-7" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold tracking-[0.24em] text-amber-700 uppercase dark:text-amber-300">
                                    Display notice
                                </p>

                                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                    This page needs to reload
                                </h1>

                                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                    {errorMessage}
                                </p>

                                {import.meta.env.DEV && this.props.pageName ? (
                                    <p className="mt-4 rounded-2xl border border-black/10 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                                        Page: {this.props.pageName}
                                    </p>
                                ) : null}

                                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={this.refreshPage}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Refresh page
                                    </button>

                                    <Link
                                        href="/"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                    >
                                        <Home className="h-4 w-4" />
                                        Return home
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        );
    }
}
