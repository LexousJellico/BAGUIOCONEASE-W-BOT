<?php

use App\Mail\RegistrationVerificationMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertStatus(200);
});

test('new users can register', function () {
    Mail::fake();
    Role::findOrCreate('user', 'web');

    $email = 'test@example.com';

    $this->postJson(route('register.send-verification'), [
        'name' => 'Test User',
        'email' => $email,
    ])->assertOk();

    $verificationCode = null;
    Mail::assertSent(RegistrationVerificationMail::class, function (RegistrationVerificationMail $mail) use (&$verificationCode) {
        $verificationCode = $mail->code;

        return true;
    });

    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => $email,
        'password' => 'Strong-Password-2026',
        'password_confirmation' => 'Strong-Password-2026',
        'verification_code' => $verificationCode,
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('verification.notice', absolute: false));
});
