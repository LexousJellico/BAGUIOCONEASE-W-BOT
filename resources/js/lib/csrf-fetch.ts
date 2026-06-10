const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_REFRESH_ENDPOINT = '/csrf-token';

let installed = false;
let refreshPromise: Promise<string | null> | null = null;

function cookieValue(name: string): string | null {
    const prefix = `${encodeURIComponent(name)}=`;
    const value = document.cookie
        .split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith(prefix))
        ?.slice(prefix.length);

    if (!value) {
        return null;
    }

    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function metaToken(): string | null {
    return (
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content.trim() || null
    );
}

function syncPageToken(token: string | null) {
    if (!token) {
        return;
    }

    const meta = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    if (meta) {
        meta.content = token;
    }

    if (window.BCCC_EASE) {
        window.BCCC_EASE.csrfToken = token;
    }
}

function applyFreshCsrfHeader(headers: Headers) {
    headers.delete('X-CSRF-TOKEN');
    headers.delete('X-XSRF-TOKEN');

    const xsrfCookie = cookieValue('XSRF-TOKEN');

    if (xsrfCookie) {
        headers.set('X-XSRF-TOKEN', xsrfCookie);
    } else {
        const token = metaToken();

        if (token) {
            headers.set('X-CSRF-TOKEN', token);
        }
    }

    if (!headers.has('X-Requested-With')) {
        headers.set('X-Requested-With', 'XMLHttpRequest');
    }
}

function isSameOrigin(url: string): boolean {
    try {
        return (
            new URL(url, window.location.href).origin === window.location.origin
        );
    } catch {
        return false;
    }
}

async function refreshCsrfToken(
    nativeFetch: typeof window.fetch,
): Promise<string | null> {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = nativeFetch(CSRF_REFRESH_ENDPOINT, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
        .then(async (response) => {
            if (!response.ok) {
                return null;
            }

            const payload = (await response.json().catch(() => null)) as {
                csrf_token?: string;
            } | null;
            const token = payload?.csrf_token?.trim() || null;

            syncPageToken(token);

            return token;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
}

export function installCsrfFetchProtection() {
    if (installed || typeof window === 'undefined') {
        return;
    }

    installed = true;
    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const inputRequest = input instanceof Request ? input : null;
        const method = (
            init?.method ??
            inputRequest?.method ??
            'GET'
        ).toUpperCase();
        const url =
            inputRequest?.url ??
            (input instanceof URL ? input.href : String(input));

        if (!MUTATING_METHODS.has(method) || !isSameOrigin(url)) {
            return nativeFetch(input, init);
        }

        const headers = new Headers(inputRequest?.headers);

        if (init?.headers) {
            new Headers(init.headers).forEach((value, key) => {
                headers.set(key, value);
            });
        }

        applyFreshCsrfHeader(headers);

        const request = new Request(input, {
            ...init,
            method,
            headers,
            credentials:
                init?.credentials ?? inputRequest?.credentials ?? 'same-origin',
        });
        const retryRequest = request.clone();
        const response = await nativeFetch(request);

        if (response.status !== 419) {
            return response;
        }

        await refreshCsrfToken(nativeFetch);

        const retryHeaders = new Headers(retryRequest.headers);
        applyFreshCsrfHeader(retryHeaders);

        return nativeFetch(
            new Request(retryRequest, {
                headers: retryHeaders,
                credentials: 'same-origin',
            }),
        );
    };
}
