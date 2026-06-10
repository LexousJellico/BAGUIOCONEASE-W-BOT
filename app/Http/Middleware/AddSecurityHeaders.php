<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class AddSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $nonce = base64_encode(random_bytes(18));

        $request->attributes->set('csp_nonce', $nonce);
        Vite::useCspNonce($nonce);

        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '0');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');
        $response->headers->set('X-DNS-Prefetch-Control', 'off');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');
        $response->headers->set('Origin-Agent-Cluster', '?1');
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
        );
        $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy($request, $nonce));
        $response->headers->remove('X-Powered-By');

        if ($this->isSensitiveRequest($request)) {
            $response->headers->set('Cache-Control', 'no-store, private');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        }

        if (app()->isProduction() && $request->isSecure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        return $response;
    }

    private function contentSecurityPolicy(Request $request, string $nonce): string
    {
        $localDevelopment = app()->environment(['local', 'testing']);
        $localHttp = $localDevelopment ? ' http://localhost:* http://127.0.0.1:* http://[::1]:*' : '';
        $localSockets = $localDevelopment ? ' ws://localhost:* ws://127.0.0.1:* ws://[::1]:*' : '';
        $unsafeEval = $localDevelopment ? " 'unsafe-eval'" : '';
        $upgradeInsecureRequests = app()->isProduction() && $request->isSecure()
            ? '; upgrade-insecure-requests'
            : '';

        return "default-src 'self'; "
            ."base-uri 'self'; "
            ."object-src 'none'; "
            ."frame-ancestors 'self'; "
            ."form-action 'self'; "
            ."script-src 'self' 'nonce-{$nonce}'{$unsafeEval}{$localHttp}; "
            ."script-src-attr 'none'; "
            ."style-src 'self' 'unsafe-inline' https://fonts.googleapis.com{$localHttp}; "
            ."img-src 'self' data: blob: https:; "
            ."font-src 'self' data: https://fonts.gstatic.com{$localHttp}; "
            ."connect-src 'self'{$localHttp}{$localSockets}; "
            ."media-src 'self' blob: https:; "
            ."worker-src 'self' blob:; "
            ."frame-src 'self' https://www.google.com https://maps.google.com; "
            ."manifest-src 'self'{$upgradeInsecureRequests}";
    }

    private function isSensitiveRequest(Request $request): bool
    {
        return $request->user() !== null || $request->is(
            'login',
            'register',
            'register/*',
            'forgot-password',
            'reset-password',
            'reset-password/*',
            'confirm-password',
            'verify-email',
            'verify-email/*',
            'admin',
            'admin/*',
            'manager',
            'manager/*',
            'staff',
            'staff/*',
            'settings',
            'settings/*',
            'two-factor-challenge',
            'user/two-factor-*',
        );
    }
}
