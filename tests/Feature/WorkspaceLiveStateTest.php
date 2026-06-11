<?php

use App\Models\User;
use App\Models\UserNotification;
use Spatie\Permission\Models\Role;

test('guests cannot access workspace live state', function () {
    $this->getJson(route('workspace.live-state'))
        ->assertUnauthorized();
});

test('authenticated users receive private live state that changes with their notifications', function () {
    $user = User::factory()->create();

    $first = $this->actingAs($user)
        ->getJson(route('workspace.live-state'))
        ->assertOk()
        ->assertHeader('Pragma', 'no-cache')
        ->assertJsonStructure([
            'version',
            'checked_at',
            'poll_after_seconds',
        ])
        ->json('version');

    UserNotification::query()->create([
        'user_id' => $user->id,
        'type' => 'system',
        'title' => 'Live state test',
        'message' => 'A new private notification is available.',
    ]);

    $second = $this->actingAs($user)
        ->getJson(route('workspace.live-state'))
        ->assertOk()
        ->json('version');

    expect($first)->toBeString()
        ->and($second)->toBeString()
        ->and($second)->not->toBe($first);
});

test('operations roles receive live changes made by other users', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findOrCreate('admin', 'web'));

    $first = $this->actingAs($admin)
        ->getJson(route('workspace.live-state'))
        ->assertOk()
        ->json('version');

    User::factory()->create();

    $second = $this->actingAs($admin)
        ->getJson(route('workspace.live-state'))
        ->assertOk()
        ->json('version');

    expect($second)->not->toBe($first);
});
