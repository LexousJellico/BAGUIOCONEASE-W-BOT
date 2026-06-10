<?php

use Illuminate\Http\Middleware\TrustHosts;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Route;

test('csrf refresh endpoint returns an uncached token and secure response headers', function () {
    $response = $this->getJson(route('security.csrf-token'));

    $response
        ->assertOk()
        ->assertJsonStructure(['csrf_token'])
        ->assertHeader('Cache-Control', 'must-revalidate, no-cache, no-store, private')
        ->assertHeader('Pragma', 'no-cache')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertHeader('X-XSS-Protection', '0')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('X-Permitted-Cross-Domain-Policies', 'none')
        ->assertHeader('X-DNS-Prefetch-Control', 'off')
        ->assertHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
        ->assertHeader('Cross-Origin-Resource-Policy', 'same-origin')
        ->assertHeader('Origin-Agent-Cluster', '?1')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
        ->assertCookie('XSRF-TOKEN');

    expect($response->json('csrf_token'))
        ->toBeString()
        ->not->toBeEmpty();

    expect($response->headers->get('Content-Security-Policy'))
        ->toContain("default-src 'self'")
        ->toContain("object-src 'none'")
        ->toContain("frame-ancestors 'self'")
        ->toContain("script-src 'self' 'nonce-")
        ->toContain("script-src-attr 'none'");
});

test('json csrf mismatches return a safe retryable response', function () {
    Route::post('/_test/csrf-mismatch', function () {
        throw new TokenMismatchException('CSRF token mismatch.');
    });

    $this->postJson('/_test/csrf-mismatch')
        ->assertStatus(419)
        ->assertExactJson([
            'message' => 'Your secure session expired. The request was not processed. Please try again.',
            'code' => 'csrf_token_mismatch',
        ]);
});

test('production https responses use a strict policy and hsts', function () {
    app()->detectEnvironment(fn () => 'production');
    $this->withoutMiddleware(TrustHosts::class);

    $response = $this
        ->withServerVariables([
            'HTTPS' => 'on',
            'REQUEST_SCHEME' => 'https',
            'SERVER_PORT' => 443,
        ])
        ->getJson('https://localhost/csrf-token');

    $response
        ->assertOk()
        ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    expect($response->headers->get('Content-Security-Policy'))
        ->toContain('upgrade-insecure-requests')
        ->not->toContain("'unsafe-eval'")
        ->not->toContain('localhost')
        ->not->toContain('127.0.0.1')
        ->not->toContain('[::1]');
});

test('browser csrf mismatches return safely with a user-facing message', function () {
    Route::post('/_test/browser-csrf-mismatch', function () {
        throw new TokenMismatchException('CSRF token mismatch.');
    });

    $this
        ->from('/calendar')
        ->post('/_test/browser-csrf-mismatch')
        ->assertRedirect('/calendar')
        ->assertSessionHas(
            'error',
            'Your secure session expired before the request was processed. Please try again.'
        );
});
