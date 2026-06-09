<?php

use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.gemini.api_key', null);
});

it('returns the exact fallback for questions outside trusted knowledge', function () {
    $this->postJson('/system-assistant/ask', [
        'message' => 'Explain quantum chromodynamics in complete detail.',
        'page' => '/',
        'context' => 'BCCC EASE',
        'surface' => 'public',
    ])->assertOk()
        ->assertJsonPath('answer', 'I\'m sorry, I can\'t help you with that.')
        ->assertJsonPath('fallback', true)
        ->assertJsonPath('source_count', 0);
});

it('answers virtual tour questions from trusted system knowledge', function () {
    $this->postJson('/system-assistant/ask', [
        'message' => 'How do I use the virtual tour?',
        'page' => '/virtual-tour',
        'context' => 'Virtual Tour',
        'surface' => 'public',
        'history' => [
            ['role' => 'user', 'text' => 'I want to see the Main Hall.'],
            ['role' => 'bot', 'text' => 'Open the Virtual Tour.'],
        ],
    ])->assertOk()
        ->assertJsonPath('fallback', false)
        ->assertJsonPath('learned', true)
        ->assertJsonPath('source_count', fn (int $count): bool => $count > 0)
        ->assertJsonPath('answer', fn (string $answer): bool => str_contains($answer, 'Main Hall begins at Ground Hall'));
});

it('uses Gemini general knowledge and search grounding for general questions', function () {
    config()->set('services.gemini.api_key', 'test-key');
    config()->set('services.gemini.general_knowledge', true);
    config()->set('services.gemini.general_model', 'gemini-2.5-pro');
    config()->set('services.gemini.google_search', true);

    Http::fake([
        '*' => Http::response([
            'candidates' => [[
                'content' => [
                    'parts' => [[
                        'text' => 'Photosynthesis converts light energy into chemical energy used by plants.',
                    ]],
                ],
                'groundingMetadata' => [
                    'groundingChunks' => [[
                        'web' => [
                            'uri' => 'https://example.com/photosynthesis',
                            'title' => 'Photosynthesis reference',
                        ],
                    ]],
                ],
            ]],
        ]),
    ]);

    $this->postJson('/system-assistant/ask', [
        'message' => 'Explain photosynthesis professionally.',
        'page' => '/',
        'context' => 'BCCC EASE',
        'surface' => 'public',
    ])->assertOk()
        ->assertJsonPath('fallback', false)
        ->assertJsonPath('mode', 'gemini')
        ->assertJsonPath('scope', 'general')
        ->assertJsonPath('learned', true)
        ->assertJsonPath('source_count', 1)
        ->assertJsonPath('answer', fn (string $answer): bool => str_contains($answer, 'Photosynthesis converts light energy'));

    Http::assertSent(fn ($request): bool => str_contains($request->url(), 'gemini-2.5-pro:generateContent')
        && data_get($request->data(), 'tools.0.google_search') !== null);
});

it('does not use general knowledge to invent unsupported BCCC facts', function () {
    config()->set('services.gemini.api_key', 'test-key');
    Http::fake();

    $this->postJson('/system-assistant/ask', [
        'message' => 'What is the exact steel alloy specification of the BCCC roof?',
        'page' => '/',
        'context' => 'BCCC EASE',
        'surface' => 'public',
    ])->assertOk()
        ->assertJsonPath('answer', 'I\'m sorry, I can\'t help you with that.')
        ->assertJsonPath('fallback', true)
        ->assertJsonPath('scope', 'bccc');

    Http::assertNothingSent();
});

it('keeps common booking questions inside trusted BCCC knowledge', function () {
    config()->set('services.gemini.api_key', 'test-key');
    config()->set('services.gemini.model', 'gemini-2.5-flash');

    Http::fake([
        '*' => Http::response([
            'candidates' => [[
                'content' => [
                    'parts' => [[
                        'text' => 'Open the Book Event form and complete the guided booking details.',
                    ]],
                ],
            ]],
        ]),
    ]);

    $this->postJson('/system-assistant/ask', [
        'message' => 'How do I book?',
        'page' => '/',
        'context' => 'BCCC EASE',
        'surface' => 'public',
    ])->assertOk()
        ->assertJsonPath('fallback', false)
        ->assertJsonPath('mode', 'gemini')
        ->assertJsonPath('scope', 'bccc');

    Http::assertSent(fn ($request): bool => str_contains($request->url(), 'gemini-2.5-flash:generateContent')
        && data_get($request->data(), 'tools') === null);
});
