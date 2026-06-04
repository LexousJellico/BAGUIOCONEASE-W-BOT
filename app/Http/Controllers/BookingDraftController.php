<?php

namespace App\Http\Controllers;

use App\Models\BookingDraft;
use App\Support\WorkspaceAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class BookingDraftController extends Controller
{
    public function latest(Request $request): JsonResponse
    {
        abort_unless($request->user(), 403);

        if (! Schema::hasTable('booking_drafts')) {
            return response()->json(['draft' => null]);
        }

        $draft = BookingDraft::query()
            ->where('user_id', $request->user()->id)
            ->open()
            ->latest('last_touched_at')
            ->latest('updated_at')
            ->first();

        return response()->json(['draft' => $draft ? $this->payload($draft) : null]);
    }

    public function show(Request $request, BookingDraft $bookingDraft): JsonResponse
    {
        abort_unless($request->user() && (int) $bookingDraft->user_id === (int) $request->user()->id, 403);

        return response()->json(['draft' => $this->payload($bookingDraft)]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user(), 403);

        $validated = $request->validate([
            'draft_key' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'max:30'],
            'workspace_role' => ['nullable', 'string', 'max:40'],
            'current_step' => ['nullable', 'integer', 'min:0', 'max:4'],
            'payload' => ['required', 'array'],
        ]);

        $status = strtolower((string) ($validated['status'] ?? 'auto'));
        $status = in_array($status, ['auto', 'manual'], true) ? $status : 'auto';
        $draftKey = trim((string) ($validated['draft_key'] ?? ''));

        if ($draftKey === '') {
            $draftKey = 'booking-'.$request->user()->id.'-'.Str::random(18);
        }

        $draft = BookingDraft::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'draft_key' => $draftKey,
            ],
            [
                'status' => $status,
                'workspace_role' => trim((string) ($validated['workspace_role'] ?? WorkspaceAccess::role($request) ?? 'user')) ?: 'user',
                'current_step' => (int) ($validated['current_step'] ?? 0),
                'payload' => $validated['payload'],
                'last_touched_at' => now(),
                'submitted_at' => null,
            ]
        );

        return response()->json([
            'draft' => $this->payload($draft->refresh()),
            'message' => $status === 'manual' ? 'Draft saved.' : 'Draft autosaved.',
        ]);
    }

    public function destroyCurrent(Request $request): JsonResponse
    {
        abort_unless($request->user(), 403);

        $validated = $request->validate([
            'draft_key' => ['nullable', 'string', 'max:120'],
        ]);

        $draftKey = trim((string) ($validated['draft_key'] ?? ''));

        $query = BookingDraft::query()
            ->where('user_id', $request->user()->id)
            ->open();

        if ($draftKey !== '') {
            $query->where('draft_key', $draftKey);
        }

        $draft = $query
            ->latest('last_touched_at')
            ->latest('updated_at')
            ->first();

        if ($draft) {
            $draft->forceFill([
                'status' => 'abandoned',
                'last_touched_at' => now(),
            ])->save();
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, BookingDraft $bookingDraft): JsonResponse
    {
        abort_unless($request->user() && (int) $bookingDraft->user_id === (int) $request->user()->id, 403);

        $bookingDraft->forceFill([
            'status' => 'abandoned',
            'last_touched_at' => now(),
        ])->save();

        return response()->json(['ok' => true]);
    }

    private function payload(BookingDraft $draft): array
    {
        return [
            'id' => $draft->id,
            'draft_key' => $draft->draft_key,
            'status' => $draft->status,
            'workspace_role' => $draft->workspace_role,
            'current_step' => $draft->current_step,
            'payload' => $draft->payload ?: [],
            'last_touched_at' => optional($draft->last_touched_at)->toIso8601String(),
            'submitted_at' => optional($draft->submitted_at)->toIso8601String(),
        ];
    }
}
