<?php

namespace App\Http\Controllers;

use App\Models\AssistantChatSession;
use App\Models\AssistantKnowledgeEntry;
use App\Models\AssistantQuestionLog;
use App\Models\BookingDraft;
use App\Models\User;
use App\Services\ClientAssistantKnowledgeService;
use App\Services\GeminiClientAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ClientAssistantController extends Controller
{
    public function __construct(
        private readonly ClientAssistantKnowledgeService $knowledge,
        private readonly GeminiClientAssistantService $gemini,
    ) {}

    public function ask(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
            'page' => ['nullable', 'string', 'max:255'],
            'context' => ['nullable', 'string', 'max:160'],
            'surface' => ['nullable', 'string', 'max:40'],
            'history' => ['nullable', 'array', 'max:12'],
            'history.*.role' => ['required_with:history', 'string', 'in:bot,user'],
            'history.*.text' => ['required_with:history', 'string', 'max:4000'],
        ]);

        $user = $request->user();
        $message = trim((string) $data['message']);
        $page = trim((string) ($data['page'] ?? ''));
        $context = trim((string) ($data['context'] ?? ''));
        $surface = $this->normalizeSurface(trim((string) ($data['surface'] ?? ($user ? 'client' : 'public'))));
        $dates = $this->knowledge->extractDates($message);
        $knowledgePack = $this->knowledge->build($user, $message, $dates, [
            'page' => $page,
            'context' => $context,
            'surface' => $surface,
            'history' => $data['history'] ?? [],
        ]);
        $systemSearch = is_array(data_get($knowledgePack, 'system_search')) ? data_get($knowledgePack, 'system_search') : [];
        $local = $this->knowledge->localAnswer($user, $message, $dates, $knowledgePack);
        $confidence = (int) data_get($systemSearch, 'confidence', $local['confidence'] ?? 45);
        $sourceCount = (int) data_get($systemSearch, 'source_count', $local['source_count'] ?? 0);
        $requiresTrustedKnowledge = $this->knowledge->requiresTrustedBcccKnowledge($message, $dates, $knowledgePack);
        $trustedAnswerable = $requiresTrustedKnowledge
            && ((bool) ($local['answerable'] ?? false) || $sourceCount > 0 || $dates !== []);
        $allowGeneralKnowledge = ! $requiresTrustedKnowledge && $this->gemini->generalKnowledgeEnabled();
        $geminiResult = ($trustedAnswerable || $allowGeneralKnowledge)
            ? $this->gemini->generate($message, $knowledgePack, $allowGeneralKnowledge)
            : null;
        $geminiAnswer = trim((string) data_get($geminiResult, 'answer', ''));
        $generalAnswered = $allowGeneralKnowledge && filled($geminiAnswer);
        $answerable = $trustedAnswerable || $generalAnswered;
        $sources = collect(data_get($systemSearch, 'sources', []))
            ->take(8)
            ->map(fn ($source) => is_array($source) ? [
                'type' => $source['type'] ?? 'source',
                'title' => $source['title'] ?? 'System source',
                'url' => $source['url'] ?? null,
                'category' => $source['category'] ?? null,
                'confidence' => $source['confidence'] ?? null,
            ] : null)
            ->filter()
            ->values()
            ->all();

        if ($generalAnswered) {
            $sources = collect(data_get($geminiResult, 'sources', []))
                ->take(4)
                ->values()
                ->all();
            $sourceCount = count($sources);
            $confidence = (bool) data_get($geminiResult, 'grounded', false) ? 88 : 78;
        }

        if (! $answerable) {
            $answer = 'I\'m sorry, I can\'t help you with that.';
            $mode = 'knowledge_fallback';
            $response = [
                'answer' => $answer,
                'mode' => 'local',
                'fallback' => true,
                'suggestions' => $this->knowledge->suggestions($message, $dates, $user, $knowledgePack),
                'confidence' => $confidence,
                'source_count' => $sourceCount,
                'learned' => false,
                'scope' => $requiresTrustedKnowledge ? 'bccc' : 'general',
            ];
        } elseif ($generalAnswered) {
            $answer = $geminiAnswer;
            $mode = (bool) data_get($geminiResult, 'grounded', false)
                ? 'gemini_general_grounded'
                : 'gemini_general_knowledge';
            $response = [
                'answer' => $answer,
                'mode' => 'gemini',
                'fallback' => false,
                'suggestions' => [],
                'confidence' => $confidence,
                'source_count' => $sourceCount,
                'learned' => (bool) data_get($geminiResult, 'grounded', false),
                'scope' => 'general',
            ];
        } elseif (filled($geminiAnswer)) {
            $answer = $geminiAnswer;
            $mode = 'gemini_system_search';
            $response = [
                'answer' => $answer,
                'mode' => 'gemini',
                'fallback' => false,
                'suggestions' => $this->knowledge->suggestions($message, $dates, $user, $knowledgePack),
                'confidence' => $confidence,
                'source_count' => $sourceCount,
                'learned' => $sourceCount > 0,
                'scope' => 'bccc',
            ];
        } else {
            $answer = (string) ($local['answer'] ?? 'I could not find an exact answer, but I can still guide you to the correct BCCC EASE page.');
            $mode = (bool) $this->gemini->enabled() ? 'local_after_gemini_fallback' : 'local_system_search';
            $response = [
                ...$local,
                'mode' => 'local',
                'fallback' => $this->gemini->enabled(),
                'confidence' => $confidence,
                'source_count' => $sourceCount,
                'learned' => $sourceCount > 0,
                'scope' => 'bccc',
            ];
        }

        $trackingId = $this->logQuestion($request, $user, [
            'surface' => $surface,
            'page' => $page,
            'context' => $context,
            'question' => $message,
            'answer' => $answer,
            'mode' => $mode,
            'confidence' => $confidence,
            'source_count' => $sourceCount,
            'sources' => $sources,
            'unresolved' => ! $answerable || ($requiresTrustedKnowledge && ($confidence < 48 || $sourceCount === 0)),
        ]);

        return response()->json([
            ...$response,
            'tracking_id' => $trackingId,
        ]);
    }

    public function state(Request $request): JsonResponse
    {
        $session = $this->currentChatSession($request, false);

        if (! $session) {
            return response()->json(['state' => null]);
        }

        return response()->json([
            'state' => $this->chatSessionPayload($session),
        ]);
    }

    public function saveState(Request $request): JsonResponse
    {
        if (! Schema::hasTable('assistant_chat_sessions')) {
            return response()->json(['saved' => false, 'state' => null]);
        }

        $data = $request->validate([
            'role' => ['nullable', 'string', 'max:40'],
            'surface' => ['nullable', 'string', 'max:40'],
            'page_context' => ['nullable', 'string', 'max:160'],
            'open' => ['nullable', 'boolean'],
            'messages' => ['nullable', 'array', 'max:60'],
            'suggestions' => ['nullable', 'array', 'max:6'],
            'suggestions.*' => ['nullable', 'string', 'max:160'],
            'guide' => ['nullable', 'array'],
            'spam_guard' => ['nullable', 'array'],
        ]);

        $session = $this->currentChatSession($request, true);
        $isPublic = ! $request->user();

        $session->forceFill([
            'role' => Str::limit((string) ($data['role'] ?? ($request->user() ? 'user' : 'public')), 40, ''),
            'surface' => $this->normalizeSurface((string) ($data['surface'] ?? ($request->user() ? 'client' : 'public'))),
            'page_context' => Str::limit((string) ($data['page_context'] ?? ''), 160, ''),
            'is_open' => (bool) ($data['open'] ?? false),
            'messages' => $this->normalizeChatMessages($data['messages'] ?? []),
            'suggestions' => collect($data['suggestions'] ?? [])->filter()->take(6)->values()->all(),
            'guide' => is_array($data['guide'] ?? null) ? $data['guide'] : null,
            'spam_guard' => is_array($data['spam_guard'] ?? null) ? $data['spam_guard'] : null,
            'last_activity_at' => now(),
            'expires_at' => $isPublic ? now()->addMinutes(15) : null,
        ])->save();

        return response()->json([
            'saved' => true,
            'state' => $this->chatSessionPayload($session->refresh()),
        ]);
    }

    public function clearState(Request $request): JsonResponse
    {
        if (Schema::hasTable('assistant_chat_sessions')) {
            $key = $this->assistantSessionKey($request);

            AssistantChatSession::query()
                ->where('session_key', $key)
                ->delete();
        }

        return response()->json(['cleared' => true]);
    }

    public function bookingDraft(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date_from' => ['required', 'date_format:Y-m-d'],
            'date_to' => ['required', 'date_format:Y-m-d'],
            'mode' => ['required', 'string', 'in:packages,manual'],
            'package_code' => ['nullable', 'string', 'max:120'],
            'selected_areas' => ['nullable', 'array', 'max:10'],
            'selected_areas.*' => ['string', 'max:80'],
            'event_type' => ['nullable', 'string', 'max:180'],
            'guests' => ['nullable', 'string', 'max:20'],
            'surface' => ['nullable', 'string', 'max:40'],
        ]);

        $surface = $this->normalizeSurface((string) ($data['surface'] ?? ($request->user() ? 'client' : 'public')));
        $link = $this->bookingCreateLink($surface, $data);

        if (! $request->user() || ! Schema::hasTable('booking_drafts')) {
            return response()->json([
                'created' => false,
                'requires_login' => ! $request->user(),
                'link' => $link,
                'message' => ! $request->user()
                    ? 'I prepared the booking form link. Please log in or create an account before final submission so the booking can be saved under your name.'
                    : 'I prepared the booking form link. Draft storage is not installed yet, so review the prefilled form before submitting.',
            ]);
        }

        [$from, $to] = $this->safeDateRange((string) $data['date_from'], (string) $data['date_to']);
        $scheduleSelections = $this->scheduleSelections($from, $to);
        $selectedAreas = collect($data['selected_areas'] ?? [])
            ->map(fn ($area) => Str::of((string) $area)->lower()->replaceMatches('/[^a-z0-9_]+/', '_')->trim('_')->toString())
            ->filter()
            ->unique()
            ->values()
            ->all();
        $packageCode = strtoupper(trim((string) ($data['package_code'] ?? '')));
        $draftKey = 'assistant-'.$request->user()->id.'-'.Str::random(16);
        $guests = preg_replace('/[^0-9]/', '', (string) ($data['guests'] ?? '')) ?: null;
        $eventType = Str::upper(trim((string) ($data['event_type'] ?? '')));

        $draft = BookingDraft::query()->create([
            'user_id' => $request->user()->id,
            'draft_key' => $draftKey,
            'status' => 'manual',
            'workspace_role' => $surface === 'backend' ? $this->backendRoleLabel($request->user()) : 'user',
            'current_step' => 1,
            'payload' => [
                'source' => 'assistant_guided_booking',
                'activeStep' => 1,
                'calendarCursor' => $from->copy()->startOfMonth()->format('Y-m-d'),
                'rangeAnchor' => $from->format('Y-m-d'),
                'scheduleSelections' => $scheduleSelections,
                'packageMode' => $data['mode'],
                'selectedPackageCode' => $data['mode'] === 'packages' ? $packageCode : '',
                'selectedAreaKeys' => $data['mode'] === 'manual' ? $selectedAreas : [],
                'data' => [
                    'booking_draft_key' => $draftKey,
                    'draft_key' => $draftKey,
                    'type_of_event' => $eventType,
                    'number_of_guests' => $guests,
                    'selected_package_code' => $data['mode'] === 'packages' ? $packageCode : '',
                    'selected_area_keys' => $data['mode'] === 'manual' ? $selectedAreas : [],
                    'booking_date_from' => $from->format('Y-m-d').'T06:00',
                    'booking_date_to' => $to->format('Y-m-d').'T23:59',
                    'payment_status' => 'unpaid',
                    'booking_status' => 'pending',
                    'policy_acknowledged' => false,
                    'accuracy_acknowledged' => false,
                ],
            ],
            'last_touched_at' => now(),
            'submitted_at' => null,
        ]);

        return response()->json([
            'created' => true,
            'draft_key' => $draft->draft_key,
            'link' => $link.(str_contains($link, '?') ? '&' : '?').'draft_key='.urlencode($draft->draft_key),
            'message' => 'I saved this as a booking draft. Open the form, review the computation, complete the missing contact/MICE fields, then submit for BCCC review.',
        ]);
    }

    public function feedback(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tracking_id' => ['required', 'string', 'max:80'],
            'helpful' => ['required', 'boolean'],
            'correction' => ['nullable', 'string', 'max:2000'],
        ]);

        if (! Schema::hasTable('assistant_question_logs')) {
            return response()->json(['saved' => false, 'message' => 'Assistant feedback table is not installed yet.'], 409);
        }

        $log = AssistantQuestionLog::query()->where('uuid', $data['tracking_id'])->first();

        if (! $log) {
            return response()->json(['saved' => false, 'message' => 'This assistant message could not be found.'], 404);
        }

        $correction = trim((string) ($data['correction'] ?? ''));
        $log->forceFill([
            'helpful' => (bool) $data['helpful'],
            'corrected_answer' => $correction !== '' ? $correction : $log->corrected_answer,
            'unresolved' => ! (bool) $data['helpful'],
        ])->save();

        if ($correction !== '' && Schema::hasTable('assistant_knowledge_entries')) {
            $user = $request->user();
            $isTrustedReviewer = $user instanceof User && $this->isBackendUser($user);

            AssistantKnowledgeEntry::query()->create([
                'title' => 'Assistant correction: '.Str::limit($log->question, 90, ''),
                'question' => $log->question,
                'answer' => $correction,
                'category' => 'feedback_correction',
                'keywords' => collect(preg_split('/\s+/', Str::lower($log->normalized_question ?: $log->question)) ?: [])
                    ->filter(fn (string $token): bool => strlen($token) >= 3)
                    ->unique()
                    ->take(15)
                    ->values()
                    ->all(),
                'visibility' => in_array($log->surface, ['public', 'client', 'backend'], true) ? $log->surface : 'public',
                'source_type' => $isTrustedReviewer ? 'admin_reviewed' : 'user_suggested',
                'source_reference' => 'assistant_question_logs:'.$log->id,
                'confidence' => $isTrustedReviewer ? 88 : 45,
                'is_active' => $isTrustedReviewer,
                'created_by_user_id' => $user?->id,
                'reviewed_by_user_id' => $isTrustedReviewer ? $user->id : null,
                'reviewed_at' => $isTrustedReviewer ? now() : null,
            ]);
        }

        return response()->json([
            'saved' => true,
            'message' => (bool) $data['helpful']
                ? 'Thanks. I will prioritize this style of answer next time.'
                : 'Thanks. I marked this question for review so the system knowledge can be improved.',
        ]);
    }

    /** @param array<string, mixed> $payload */
    private function logQuestion(Request $request, ?User $user, array $payload): ?string
    {
        if (! Schema::hasTable('assistant_question_logs')) {
            return null;
        }

        $uuid = (string) Str::uuid();

        AssistantQuestionLog::query()->create([
            'uuid' => $uuid,
            'user_id' => $user?->id,
            'surface' => (string) ($payload['surface'] ?? 'public'),
            'page' => Str::limit((string) ($payload['page'] ?? ''), 255, ''),
            'context_label' => Str::limit((string) ($payload['context'] ?? ''), 255, ''),
            'question' => (string) ($payload['question'] ?? ''),
            'normalized_question' => Str::lower(Str::ascii((string) ($payload['question'] ?? ''))),
            'answer' => (string) ($payload['answer'] ?? ''),
            'mode' => (string) ($payload['mode'] ?? 'local'),
            'confidence' => max(0, min(100, (int) ($payload['confidence'] ?? 0))),
            'source_count' => max(0, (int) ($payload['source_count'] ?? 0)),
            'sources' => $payload['sources'] ?? [],
            'unresolved' => (bool) ($payload['unresolved'] ?? false),
            'ip_hash' => $request->ip() ? hash('sha256', (string) $request->ip()) : null,
            'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
        ]);

        return $uuid;
    }

    private function assistantSessionKey(Request $request): string
    {
        if ($request->user()) {
            return 'user:'.$request->user()->id;
        }

        return 'guest:'.hash('sha256', (string) $request->session()->getId());
    }

    private function currentChatSession(Request $request, bool $create): ?AssistantChatSession
    {
        if (! Schema::hasTable('assistant_chat_sessions')) {
            return null;
        }

        AssistantChatSession::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->delete();

        $key = $this->assistantSessionKey($request);
        $query = AssistantChatSession::query()->where('session_key', $key);
        $session = $query->first();

        if ($session && $session->expires_at && $session->expires_at->isPast()) {
            $session->delete();
            $session = null;
        }

        if ($session || ! $create) {
            return $session;
        }

        return AssistantChatSession::query()->firstOrCreate(
            ['session_key' => $key],
            [
                'user_id' => $request->user()?->id,
                'role' => $request->user() ? 'user' : 'public',
                'surface' => $request->user() ? 'client' : 'public',
                'is_open' => false,
                'messages' => [],
                'suggestions' => [],
                'last_activity_at' => now(),
                'expires_at' => $request->user() ? null : now()->addMinutes(15),
            ]
        );
    }

    private function chatSessionPayload(AssistantChatSession $session): array
    {
        return [
            'role' => $session->role,
            'surface' => $session->surface,
            'page_context' => $session->page_context,
            'open' => $session->is_open,
            'messages' => $session->messages ?: [],
            'suggestions' => $session->suggestions ?: [],
            'guide' => $session->guide,
            'spam_guard' => $session->spam_guard,
            'last_activity_at' => optional($session->last_activity_at)->toIso8601String(),
            'expires_at' => optional($session->expires_at)->toIso8601String(),
        ];
    }

    /** @param array<int, mixed> $messages */
    private function normalizeChatMessages(array $messages): array
    {
        return collect($messages)
            ->filter(fn ($message) => is_array($message) && filled($message['text'] ?? null))
            ->map(fn (array $message) => [
                'id' => Str::limit((string) ($message['id'] ?? (string) Str::uuid()), 120, ''),
                'role' => in_array(($message['role'] ?? ''), ['bot', 'user'], true) ? $message['role'] : 'bot',
                'text' => Str::limit((string) ($message['text'] ?? ''), 4000, ''),
                'mode' => isset($message['mode']) ? Str::limit((string) $message['mode'], 40, '') : null,
                'fallback' => (bool) ($message['fallback'] ?? false),
                'confidence' => isset($message['confidence']) ? max(0, min(100, (int) $message['confidence'])) : null,
                'sourceCount' => isset($message['sourceCount']) ? max(0, (int) $message['sourceCount']) : null,
                'trackingId' => isset($message['trackingId']) ? Str::limit((string) $message['trackingId'], 80, '') : null,
                'feedback' => in_array(($message['feedback'] ?? ''), ['helpful', 'unhelpful'], true) ? $message['feedback'] : null,
            ])
            ->values()
            ->take(-60)
            ->values()
            ->all();
    }

    /** @param array<string, mixed> $data */
    private function bookingCreateLink(string $surface, array $data): string
    {
        $base = $surface === 'backend' ? '/bookings/create' : '/book';
        $query = http_build_query(array_filter([
            'start_date' => $data['date_from'] ?? null,
            'end_date' => $data['date_to'] ?? null,
            'package' => ($data['mode'] ?? '') === 'packages' ? ($data['package_code'] ?? null) : null,
            'areas' => ($data['mode'] ?? '') === 'manual' ? implode(',', $data['selected_areas'] ?? []) : null,
            'event_type' => $data['event_type'] ?? null,
            'guests' => $data['guests'] ?? null,
            'assistant_booking' => 1,
        ], fn ($value) => $value !== null && $value !== ''));

        return $query ? $base.'?'.$query : $base;
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function safeDateRange(string $from, string $to): array
    {
        $start = Carbon::parse($from, config('app.timezone'))->startOfDay();
        $end = Carbon::parse($to, config('app.timezone'))->startOfDay();

        if ($end->lt($start)) {
            [$start, $end] = [$end, $start];
        }

        return [$start, $end];
    }

    /** @return array<int, array{date: string, block: string, additionalHours: int}> */
    private function scheduleSelections(Carbon $from, Carbon $to): array
    {
        $days = [];
        $cursor = $from->copy();
        $limit = 31;

        while ($cursor->lte($to) && count($days) < $limit) {
            $days[] = [
                'date' => $cursor->format('Y-m-d'),
                'block' => 'whole_day',
                'additionalHours' => 0,
            ];
            $cursor->addDay();
        }

        return $days;
    }

    private function backendRoleLabel(User $user): string
    {
        if (method_exists($user, 'hasRole')) {
            foreach (['admin', 'manager', 'staff'] as $role) {
                if ($user->hasRole($role)) {
                    return $role;
                }
            }
        }

        return 'user';
    }

    private function normalizeSurface(string $surface): string
    {
        $surface = strtolower(trim($surface));

        return in_array($surface, ['public', 'client', 'backend'], true) ? $surface : 'public';
    }

    private function isBackendUser(User $user): bool
    {
        if (! method_exists($user, 'hasAnyRole')) {
            return false;
        }

        return $user->hasAnyRole(['admin', 'manager', 'staff']);
    }
}
