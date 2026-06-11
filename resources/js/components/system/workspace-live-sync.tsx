import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';

type LiveState = {
    version?: string;
    checked_at?: string;
    poll_after_seconds?: number;
};

const LIVE_STATE_URL = '/workspace/live-state';
const DEFAULT_POLL_MS = 15_000;
const CROSS_TAB_KEY = 'bccc.workspace.updated-at';

function userIsEditing() {
    const active = document.activeElement;

    return (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable)
    );
}

export default function WorkspaceLiveSync() {
    const versionRef = useRef<string | null>(null);
    const checkingRef = useRef(false);
    const pollMsRef = useRef(DEFAULT_POLL_MS);

    const refreshWorkspace = useCallback((nextVersion: string) => {
        if (window.__bcccLiveRefreshInProgress) return;

        versionRef.current = nextVersion;
        window.__bcccLiveRefreshInProgress = true;

        router.reload({
            showProgress: false,
            onFinish: () => {
                window.__bcccLiveRefreshInProgress = false;
            },
        });
    }, []);

    const checkForUpdates = useCallback(
        async (forceRefresh = false) => {
            if (checkingRef.current || document.hidden) return;

            if (!navigator.onLine) {
                return;
            }

            checkingRef.current = true;

            try {
                const response = await fetch(LIVE_STATE_URL, {
                    method: 'GET',
                    credentials: 'same-origin',
                    cache: 'no-store',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    throw new Error('Live state request failed.');
                }

                const state = (await response.json()) as LiveState;
                const nextVersion =
                    typeof state.version === 'string' ? state.version : '';

                if (typeof state.poll_after_seconds === 'number') {
                    pollMsRef.current = Math.max(
                        10_000,
                        state.poll_after_seconds * 1000,
                    );
                }

                if (!nextVersion) {
                    return;
                }

                if (!versionRef.current) {
                    versionRef.current = nextVersion;
                    return;
                }

                if (versionRef.current !== nextVersion) {
                    if (!forceRefresh && userIsEditing()) {
                        return;
                    }

                    refreshWorkspace(nextVersion);
                }
            } catch {
                // Background synchronization is best-effort and must stay unobtrusive.
            } finally {
                checkingRef.current = false;
            }
        },
        [refreshWorkspace],
    );

    useEffect(() => {
        let active = true;

        void checkForUpdates();

        let pollTimer = window.setTimeout(function poll() {
            void checkForUpdates().finally(() => {
                if (active) {
                    pollTimer = window.setTimeout(poll, pollMsRef.current);
                }
            });
        }, pollMsRef.current);

        const handleVisibility = () => {
            if (!document.hidden) void checkForUpdates();
        };
        const handleOnline = () => void checkForUpdates();
        const handleFocus = () => void checkForUpdates();
        const handleStorage = (event: StorageEvent) => {
            if (event.key === CROSS_TAB_KEY) void checkForUpdates();
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('online', handleOnline);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('storage', handleStorage);

        return () => {
            active = false;
            window.clearTimeout(pollTimer);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('storage', handleStorage);
        };
    }, [checkForUpdates]);

    useEffect(() => {
        const removeFinishListener = router.on('finish', (event) => {
            const visit = event.detail.visit as {
                completed?: boolean;
                method?: string;
            };

            if (
                visit.completed &&
                visit.method &&
                visit.method.toLowerCase() !== 'get' &&
                !window.__bcccLiveRefreshInProgress
            ) {
                try {
                    window.localStorage.setItem(
                        CROSS_TAB_KEY,
                        String(Date.now()),
                    );
                } catch {
                    // Restricted storage must not interrupt the completed action.
                }

                void checkForUpdates(true);
            }
        });

        return removeFinishListener;
    }, [checkForUpdates]);

    return null;
}
