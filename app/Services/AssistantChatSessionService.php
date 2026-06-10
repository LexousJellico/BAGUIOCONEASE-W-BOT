<?php

namespace App\Services;

use App\Models\AssistantChatSession;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AssistantChatSessionService
{
    public const RETENTION_HOURS = 6;

    private const GUEST_CHAT_TOKEN_KEY = 'assistant.guest_chat_token';

    private const REMEMBERED_GUEST_KEY = 'assistant.remembered_guest_key';

    public function expiresAt(): Carbon
    {
        return now()->addHours(self::RETENTION_HOURS);
    }

    public function keyForRequest(Request $request): string
    {
        if ($request->user()) {
            return $this->userKey($request->user());
        }

        $token = trim((string) $request->session()->get(self::GUEST_CHAT_TOKEN_KEY, ''));

        if ($token === '') {
            $token = Str::random(64);
            $request->session()->put(self::GUEST_CHAT_TOKEN_KEY, $token);
        }

        return $this->guestKey($token);
    }

    public function guestKey(string $sessionId): string
    {
        return 'guest:'.hash('sha256', $sessionId);
    }

    public function userKey(User $user): string
    {
        return 'user:'.$user->getKey();
    }

    public function rememberGuestConversation(Request $request): void
    {
        if (! $request->user()) {
            $request->session()->put(self::REMEMBERED_GUEST_KEY, $this->keyForRequest($request));
        }
    }

    public function claimRememberedGuestConversation(Request $request, User $user): void
    {
        $guestKey = trim((string) $request->session()->pull(self::REMEMBERED_GUEST_KEY, ''));

        if ($guestKey !== '') {
            $this->claimGuestConversationByKey($guestKey, $user);
        }
    }

    public function claimGuestConversation(string $guestToken, User $user): void
    {
        if ($guestToken !== '') {
            $this->claimGuestConversationByKey($this->guestKey($guestToken), $user);
        }
    }

    private function claimGuestConversationByKey(string $guestKey, User $user): void
    {
        if ($guestKey === '' || ! Schema::hasTable('assistant_chat_sessions')) {
            return;
        }

        DB::transaction(function () use ($guestKey, $user): void {
            $guest = AssistantChatSession::query()
                ->where('session_key', $guestKey)
                ->lockForUpdate()
                ->first();

            if (! $guest) {
                return;
            }

            if ($guest->expires_at?->isPast()) {
                $guest->delete();

                return;
            }

            $userSession = AssistantChatSession::query()
                ->where('session_key', $this->userKey($user))
                ->lockForUpdate()
                ->first();

            if ($userSession?->expires_at?->isPast()) {
                $userSession->delete();
                $userSession = null;
            }

            if (! $userSession) {
                $guest->forceFill([
                    'user_id' => $user->getKey(),
                    'session_key' => $this->userKey($user),
                    'role' => 'user',
                    'surface' => 'client',
                    'last_activity_at' => now(),
                    'expires_at' => $this->expiresAt(),
                ])->save();

                return;
            }

            $sessions = collect([$userSession, $guest])
                ->sortBy(fn (AssistantChatSession $session) => $session->last_activity_at?->getTimestamp() ?? 0)
                ->values();
            $latest = $sessions->last();

            $userSession->forceFill([
                'user_id' => $user->getKey(),
                'role' => 'user',
                'surface' => 'client',
                'page_context' => $latest?->page_context,
                'is_open' => (bool) $latest?->is_open,
                'messages' => $this->mergeMessages($sessions),
                'suggestions' => $latest?->suggestions ?: [],
                'guide' => $latest?->guide,
                'spam_guard' => $latest?->spam_guard,
                'last_activity_at' => now(),
                'expires_at' => $this->expiresAt(),
            ])->save();

            $guest->delete();
        });
    }

    /** @param Collection<int, AssistantChatSession> $sessions */
    private function mergeMessages(Collection $sessions): array
    {
        return $sessions
            ->flatMap(fn (AssistantChatSession $session) => $session->messages ?: [])
            ->filter(fn ($message) => is_array($message) && filled($message['text'] ?? null))
            ->unique(fn (array $message) => (string) ($message['id'] ?? md5((string) json_encode($message))))
            ->take(-60)
            ->values()
            ->all();
    }
}
