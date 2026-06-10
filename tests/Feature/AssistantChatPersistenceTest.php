<?php

use App\Models\AssistantChatSession;
use App\Models\User;
use App\Services\AssistantChatSessionService;
use Illuminate\Support\Carbon;

test('public assistant conversations are retained for six hours', function () {
    $this->travelTo(Carbon::parse('2026-06-10 09:00:00'));
    $this->withSession(['public_browser_started' => true]);

    $this->putJson(route('system-assistant.state.save'), [
        'role' => 'public',
        'surface' => 'public',
        'page_context' => 'Home',
        'messages' => [
            ['id' => 'guest-message', 'role' => 'user', 'text' => 'Can you help me?'],
        ],
    ])->assertOk();

    $session = AssistantChatSession::query()->sole();

    expect($session->expires_at?->equalTo(now()->addHours(6)))->toBeTrue();

    $this->getJson(route('system-assistant.state'))
        ->assertOk()
        ->assertJsonPath('state.messages.0.id', 'guest-message');
});

test('assistant conversations automatically disappear after six hours', function () {
    $this->travelTo(Carbon::parse('2026-06-10 09:00:00'));

    $this->putJson(route('system-assistant.state.save'), [
        'messages' => [
            ['id' => 'temporary-message', 'role' => 'user', 'text' => 'Keep this briefly.'],
        ],
    ])->assertOk();

    $this->travel(6)->hours();
    $this->travel(1)->second();

    $this->getJson(route('system-assistant.state'))
        ->assertOk()
        ->assertJsonPath('state', null);

    expect(AssistantChatSession::query()->count())->toBe(0);
});

test('guest assistant conversations are claimed and preserved after login', function () {
    $this->travelTo(Carbon::parse('2026-06-10 09:00:00'));

    $service = app(AssistantChatSessionService::class);
    $user = User::factory()->create();
    $guestSessionId = 'public-browser-session';

    AssistantChatSession::query()->create([
        'session_key' => $service->guestKey($guestSessionId),
        'role' => 'public',
        'surface' => 'public',
        'messages' => [
            ['id' => 'guest-question', 'role' => 'user', 'text' => 'What are the rates?'],
            ['id' => 'guest-answer', 'role' => 'bot', 'text' => 'Here are the public rates.'],
        ],
        'suggestions' => ['Check availability'],
        'last_activity_at' => now(),
        'expires_at' => now()->addHours(6),
    ]);

    $service->claimGuestConversation($guestSessionId, $user);

    $claimed = AssistantChatSession::query()
        ->where('session_key', $service->userKey($user))
        ->sole();

    expect($claimed->user_id)->toBe($user->id)
        ->and($claimed->role)->toBe('user')
        ->and($claimed->surface)->toBe('client')
        ->and(collect($claimed->messages)->pluck('id')->all())
        ->toBe(['guest-question', 'guest-answer'])
        ->and($claimed->expires_at?->equalTo(now()->addHours(6)))
        ->toBeTrue()
        ->and(AssistantChatSession::query()->where('session_key', $service->guestKey($guestSessionId))->exists())
        ->toBeFalse();
});

test('signed in assistant conversations also expire after six hours', function () {
    $this->travelTo(Carbon::parse('2026-06-10 09:00:00'));
    $user = User::factory()->create();

    $this->actingAs($user)->putJson(route('system-assistant.state.save'), [
        'role' => 'user',
        'surface' => 'client',
        'messages' => [
            ['id' => 'user-message', 'role' => 'user', 'text' => 'Save this for six hours.'],
        ],
    ])->assertOk();

    $session = AssistantChatSession::query()->sole();

    expect($session->user_id)->toBe($user->id)
        ->and($session->expires_at?->equalTo(now()->addHours(6)))
        ->toBeTrue();
});

test('standard login claims the public assistant conversation', function () {
    $this->travelTo(Carbon::parse('2026-06-10 09:00:00'));

    $service = app(AssistantChatSessionService::class);
    $user = User::factory()->create();
    $guestToken = 'guest-login-token';

    AssistantChatSession::query()->create([
        'session_key' => $service->guestKey($guestToken),
        'role' => 'public',
        'surface' => 'public',
        'messages' => [
            ['id' => 'before-login', 'role' => 'user', 'text' => 'Keep this after login.'],
        ],
        'last_activity_at' => now(),
        'expires_at' => now()->addHours(6),
    ]);

    $this
        ->withSession(['assistant.guest_chat_token' => $guestToken])
        ->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

    $this->assertAuthenticatedAs($user);

    $claimed = AssistantChatSession::query()
        ->where('session_key', $service->userKey($user))
        ->sole();

    expect(collect($claimed->messages)->pluck('id')->all())
        ->toBe(['before-login'])
        ->and($claimed->expires_at?->equalTo(now()->addHours(6)))
        ->toBeTrue();
});
