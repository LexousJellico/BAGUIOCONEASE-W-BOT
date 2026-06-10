<?php

use App\Mail\RegistrationVerificationMail;
use Illuminate\Http\Middleware\TrustHosts;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Role;

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
        ->toContain("script-src-attr 'none'")
        ->toContain('https://fonts.googleapis.com')
        ->toContain('https://fonts.gstatic.com');
});

test('sensitive pages are private and excluded from search indexing', function () {
    $response = $this->get(route('login'));

    $response
        ->assertOk()
        ->assertHeader('Pragma', 'no-cache')
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

    expect($response->headers->get('Cache-Control'))
        ->toContain('no-store')
        ->toContain('private');
});

test('public pages remain indexable', function () {
    Route::get('/_test/public-indexable', fn () => response('ok'));

    $this->get('/_test/public-indexable')
        ->assertOk()
        ->assertHeaderMissing('X-Robots-Tag');
});

test('registration verification codes are hashed in cache', function () {
    Mail::fake();
    $email = 'security-code@example.com';

    $this->postJson(route('register.send-verification'), [
        'name' => 'Security Code Test',
        'email' => $email,
    ])->assertOk();

    $sentCode = null;
    Mail::assertSent(RegistrationVerificationMail::class, function (RegistrationVerificationMail $mail) use (&$sentCode) {
        $sentCode = $mail->code;

        return true;
    });

    $emailKey = hash('sha256', $email);
    $storedCode = Cache::get("register_code_{$emailKey}");

    expect($sentCode)->toBeString()->toHaveLength(6)
        ->and($storedCode)->toBeString()->not->toBe($sentCode)
        ->and(Hash::check($sentCode, $storedCode))->toBeTrue()
        ->and(Cache::get("register_code_{$email}"))->toBeNull();
});

test('a valid emailed verification code can complete registration', function () {
    Mail::fake();
    Role::findOrCreate('user', 'web');
    $email = 'verified-registration@example.com';

    $this->postJson(route('register.send-verification'), [
        'name' => 'Verified Registration',
        'email' => $email,
    ])->assertOk();

    $sentCode = null;
    Mail::assertSent(RegistrationVerificationMail::class, function (RegistrationVerificationMail $mail) use (&$sentCode) {
        $sentCode = $mail->code;

        return true;
    });

    $this->post(route('register.store'), [
        'name' => 'Verified Registration',
        'email' => $email,
        'password' => 'Strong-Password-2026',
        'password_confirmation' => 'Strong-Password-2026',
        'verification_code' => $sentCode,
    ])->assertRedirect(route('verification.notice', absolute: false));

    $this->assertAuthenticated();
    expect(Cache::get('register_code_'.hash('sha256', $email)))->toBeNull();
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
