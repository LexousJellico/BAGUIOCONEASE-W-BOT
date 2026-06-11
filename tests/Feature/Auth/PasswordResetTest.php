<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('reset password link screen can be rendered', function () {
    $response = $this->get(route('password.request'));

    $response
        ->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/forgot-password')
            ->has('status')
            ->has('resetRequestCooldown')
            ->where('resetRequestCooldownSeconds', 60)
            ->where('resetLinkExpiresInMinutes', 60));
});

test('reset password link can be requested', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPassword::class);
});

test('reset password requests normalize email and expose a resend cooldown', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'recovery@example.com',
    ]);

    $response = $this->post(route('password.email'), [
        'email' => '  RECOVERY@EXAMPLE.COM  ',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status')
        ->assertSessionHas('password_reset_requested_at');

    Notification::assertSentTo($user, ResetPassword::class);
});

test('different password reset emails from one network are not falsely blocked', function () {
    foreach (range(1, 4) as $attempt) {
        $this->post(route('password.email'), [
            'email' => "recovery{$attempt}@example.com",
        ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();
    }
});

test('password reset rate limit returns a form error instead of a 429 page', function () {
    foreach (range(1, 5) as $attempt) {
        $this->post(route('password.email'), [
            'email' => 'limited@example.com',
        ])->assertRedirect();
    }

    $this->from(route('password.request'))
        ->post(route('password.email'), [
            'email' => 'limited@example.com',
        ])
        ->assertRedirect(route('password.request'))
        ->assertSessionHasErrors('email');
});

test('reset password delivery failures return a usable error', function () {
    DB::table('password_reset_tokens')->insert([
        'email' => 'recovery@example.com',
        'token' => 'failed-delivery-token',
        'created_at' => now(),
    ]);

    Password::shouldReceive('sendResetLink')
        ->once()
        ->andThrow(new RuntimeException('SMTP unavailable'));

    $this->from(route('password.request'))
        ->post(route('password.email'), [
            'email' => 'recovery@example.com',
        ])
        ->assertRedirect(route('password.request'))
        ->assertSessionHasErrors('email');

    $this->assertDatabaseMissing('password_reset_tokens', [
        'email' => 'recovery@example.com',
    ]);
});

test('reset password screen can be rendered', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPassword::class, function ($notification) {
        $response = $this->get(route('password.reset', $notification->token));

        $response->assertStatus(200);

        return true;
    });
});

test('password can be reset with valid token', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'recovery@example.com',
    ]);

    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPassword::class, function ($notification) {
        $response = $this->post(route('password.store'), [
            'token' => $notification->token,
            'email' => '  RECOVERY@EXAMPLE.COM  ',
            'password' => 'Strong-Password-2026',
            'password_confirmation' => 'Strong-Password-2026',
        ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login'));

        return true;
    });
});

test('password reset requires the displayed strong password rules', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
        $this->post(route('password.store'), [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('password');

        return true;
    });
});

test('password cannot be reset with invalid token', function () {
    $user = User::factory()->create();

    $response = $this->post(route('password.store'), [
        'token' => 'invalid-token',
        'email' => $user->email,
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertSessionHasErrors('email');
});
