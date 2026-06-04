<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserNotificationResource;
use App\Models\UserNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * JSON summary for bell polling.
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $base = $user->notifications();

        if ($this->isClientNotificationCenter($request)) {
            $base = $this->applyClientNotificationScope($base);
        }

        $unread = (clone $base)
            ->whereNull('read_at')
            ->count();

        $automationUnread = (clone $base)
            ->whereNull('read_at')
            ->where(function ($query) {
                $this->applyKindFilter($query, 'automation');
            })
            ->count();

        $latest = (clone $base)
            ->latest()
            ->limit(10)
            ->get();

        $latestPayload = UserNotificationResource::collection($latest)
            ->response()
            ->getData(true);

        return response()->json([
            'unread_count' => $unread,
            'automation_unread_count' => $automationUnread,
            'latest' => $latestPayload['data'] ?? [],
        ]);
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $perPage = 10;
        $filters = [
            'q' => trim((string) $request->query('q', '')),
            'status' => strtolower(trim((string) $request->query('status', 'all'))),
            'kind' => strtolower(trim((string) $request->query('kind', 'all'))),
        ];

        if (! in_array($filters['status'], ['all', 'unread', 'read'], true)) {
            $filters['status'] = 'all';
        }

        $isClientNotificationCenter = $this->isClientNotificationCenter($request);
        $allowedKinds = $isClientNotificationCenter ? $this->clientKinds() : $this->staffKinds();

        if (! in_array($filters['kind'], $allowedKinds, true)) {
            $filters['kind'] = 'all';
        }

        $base = $user->notifications();

        if ($isClientNotificationCenter) {
            $base = $this->applyClientNotificationScope($base);
        }

        $filtered = $this->applyFilters(clone $base, $filters);

        $paginator = $filtered
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        $automationLatest = $isClientNotificationCenter
            ? collect()
            : $this->applyFilters(clone $base, [
                'q' => '',
                'status' => 'all',
                'kind' => 'automation',
            ])
                ->latest()
                ->limit(6)
                ->get();

        return Inertia::render('notifications/index', [
            'notificationFeed' => UserNotificationResource::collection($paginator)
                ->response()
                ->getData(true),
            'notificationFilters' => $filters,
            'notificationStats' => $this->buildStats($base),
            'automationLatest' => UserNotificationResource::collection($automationLatest)
                ->response()
                ->getData(true),
            'isClientNotificationCenter' => $isClientNotificationCenter,
            'notificationKindOptions' => $allowedKinds,
        ]);
    }

    public function open(Request $request, UserNotification $notification): RedirectResponse
    {
        $user = $request->user();

        if (! $user || (int) $notification->user_id !== (int) $user->id) {
            abort(403);
        }

        $notification->markAsRead();

        $redirectTo = $notification->link ?: route('notifications.index');

        return redirect()->to($redirectTo);
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user) {
            $ids = collect((array) $request->input('ids', []))
                ->map(fn ($id) => filter_var($id, FILTER_VALIDATE_INT))
                ->filter(fn ($id) => $id !== false && $id > 0)
                ->unique()
                ->values();

            $query = $user->notifications()
                ->whereNull('read_at');

            if ($ids->isNotEmpty()) {
                $query->whereIn('id', $ids->all());
            }

            $query->update(['read_at' => now()]);
        }

        return back();
    }

    public function destroy(Request $request, UserNotification $notification): RedirectResponse
    {
        $user = $request->user();

        if (! $user || (int) $notification->user_id !== (int) $user->id) {
            abort(403);
        }

        $notification->delete();

        return back();
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        if ($request->boolean('all')) {
            $user->notifications()->delete();

            return back();
        }

        $ids = collect((array) $request->input('ids', []))
            ->map(fn ($id) => filter_var($id, FILTER_VALIDATE_INT))
            ->filter(fn ($id) => $id !== false && $id > 0)
            ->unique()
            ->values();

        if ($ids->isNotEmpty()) {
            $user->notifications()
                ->whereIn('id', $ids->all())
                ->delete();
        }

        return back();
    }


    protected function isClientNotificationCenter(Request $request): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        return ! $user->hasAnyRole(['admin', 'manager', 'staff']);
    }

    protected function clientKinds(): array
    {
        return ['all', 'bookings', 'payments', 'mice', 'deadline', 'account', 'system'];
    }

    protected function staffKinds(): array
    {
        return ['all', 'automation', 'bookings', 'payments', 'calendar', 'services', 'users', 'inquiries', 'mice', 'content', 'deadline', 'system'];
    }

    protected function applyClientNotificationScope(Builder|Relation $query): Builder|Relation
    {
        if (Schema::hasColumn('user_notifications', 'audience') && Schema::hasColumn('user_notifications', 'privacy_scope')) {
            return $query->where(function (Builder $inner): void {
                $inner->whereIn('audience', ['client', 'user'])
                    ->orWhere(function (Builder $legacy): void {
                        $legacy->whereNull('audience')
                            ->where(function (Builder $type): void {
                                $this->applyLegacyClientTypeScope($type);
                            });
                    });
            })->where(function (Builder $inner): void {
                $inner->where('privacy_scope', 'private')
                    ->orWhereNull('privacy_scope');
            });
        }

        return $query->where(function (Builder $inner): void {
            $this->applyLegacyClientTypeScope($inner);
        });
    }

    protected function applyLegacyClientTypeScope(Builder $query): void
    {
        $query->where(function (Builder $type): void {
            $type->whereNull('type')
                ->orWhere('type', '')
                ->orWhere('type', 'like', 'booking%')
                ->orWhere('type', 'like', 'payment%')
                ->orWhere('type', 'like', 'mice%')
                ->orWhere('type', 'like', 'survey%')
                ->orWhere('type', 'like', 'deadline%')
                ->orWhere('type', 'like', 'account%')
                ->orWhere('type', 'like', 'booking_auto_%');
        })
            ->where('type', 'not like', '%inquiry%')
            ->where('type', 'not like', 'calendar_block%')
            ->where('type', 'not like', 'service_%')
            ->where('type', 'not like', 'service_type_%')
            ->where('type', 'not like', 'user_%')
            ->where('type', 'not like', '%roles%');
    }

    protected function applyFilters(Builder|Relation $query, array $filters): Builder|Relation
    {
        $q = trim((string) ($filters['q'] ?? ''));
        $status = strtolower((string) ($filters['status'] ?? 'all'));
        $kind = strtolower((string) ($filters['kind'] ?? 'all'));

        if ($status === 'unread') {
            $query->whereNull('read_at');
        } elseif ($status === 'read') {
            $query->whereNotNull('read_at');
        }

        if ($q !== '') {
            $query->where(function (Builder $inner) use ($q) {
                $inner->where('title', 'like', "%{$q}%")
                    ->orWhere('message', 'like', "%{$q}%")
                    ->orWhere('type', 'like', "%{$q}%");
            });
        }

        if ($kind !== 'all') {
            $query->where(function (Builder $inner) use ($kind) {
                $this->applyKindFilter($inner, $kind);
            });
        }

        return $query;
    }

    protected function applyKindFilter(Builder $query, string $kind): void
    {
        switch ($kind) {
            case 'automation':
                $query->where(function (Builder $inner) {
                    $inner->where('type', 'booking_lifecycle_maintenance')
                        ->orWhere('type', 'like', 'booking_auto_%')
                        ->orWhere('title', 'like', '%automatic%')
                        ->orWhere('title', 'like', '%lifecycle%')
                        ->orWhere('message', 'like', '%automatically%');
                });
                break;

            case 'bookings':
                $query->where('type', 'like', 'booking%')
                    ->where('type', '!=', 'booking_lifecycle_maintenance')
                    ->where('type', 'not like', 'booking_auto_%');
                break;

            case 'payments':
                $query->where('type', 'like', 'payment%');
                break;

            case 'mice':
                $query->where(function (Builder $inner) {
                    $inner->where('type', 'like', 'mice%')
                        ->orWhere('type', 'like', 'survey%')
                        ->orWhere('title', 'like', '%MICE%')
                        ->orWhere('title', 'like', '%survey%')
                        ->orWhere('message', 'like', '%MICE%')
                        ->orWhere('message', 'like', '%survey%');
                });
                break;

            case 'deadline':
                $query->where(function (Builder $inner) {
                    $inner->where('type', 'like', 'deadline%')
                        ->orWhere('type', 'like', 'booking_auto_%')
                        ->orWhere('type', 'like', '%auto_decline%')
                        ->orWhere('type', 'like', '%lifecycle%')
                        ->orWhere('title', 'like', '%deadline%')
                        ->orWhere('message', 'like', '%deadline%')
                        ->orWhere('message', 'like', '%working day%');
                });
                break;

            case 'calendar':
                $query->where('type', 'like', 'calendar_block%');
                break;

            case 'services':
                $query->where(function (Builder $inner) {
                    $inner->where('type', 'like', 'service_%')
                        ->orWhere('type', 'like', 'service_type_%');
                });
                break;

            case 'users':
                $query->where(function (Builder $inner) {
                    $inner->where('type', 'like', 'user_%')
                        ->orWhere('type', 'like', '%roles%')
                        ->orWhere('type', 'like', 'account%');
                });
                break;

            case 'account':
                $query->where(function (Builder $inner) {
                    $inner->where('type', 'like', 'account%')
                        ->orWhere('type', 'like', 'user_%')
                        ->orWhere('title', 'like', '%account%');
                });
                break;

            case 'inquiries':
                $query->where(function (Builder $inner) {
                    $inner->where('type', 'like', '%inquiry%')
                        ->orWhere('title', 'like', '%inquiry%');
                });
                break;

            case 'content':
                $query->where(function (Builder $inner) {
                    $inner->where('type', 'like', 'content%')
                        ->orWhere('title', 'like', '%content%');
                });
                break;

            case 'system':
                $query->where(function (Builder $inner) {
                    $inner->where(function (Builder $q) {
                        $q->whereNull('type')->orWhere('type', '');
                    })
                    ->orWhere(function (Builder $q) {
                        $q->where('type', 'not like', 'booking%')
                            ->where('type', 'not like', 'payment%')
                            ->where('type', 'not like', 'calendar_block%')
                            ->where('type', 'not like', 'service_%')
                            ->where('type', 'not like', 'service_type_%')
                            ->where('type', 'not like', 'user_%')
                            ->where('type', 'not like', '%roles%')
                            ->where('type', '!=', 'booking_lifecycle_maintenance')
                            ->where('type', 'not like', 'booking_auto_%');
                    });
                });
                break;
        }
    }

    protected function buildStats(Builder|Relation $base): array
    {
        $all = (clone $base)->count();
        $unread = (clone $base)->whereNull('read_at')->count();

        $kindCount = function (string $kind) use ($base) {
            return $this->applyFilters(clone $base, [
                'q' => '',
                'status' => 'all',
                'kind' => $kind,
            ])->count();
        };

        $kindUnreadCount = function (string $kind) use ($base) {
            return $this->applyFilters(clone $base, [
                'q' => '',
                'status' => 'unread',
                'kind' => $kind,
            ])->count();
        };

        return [
            'total' => $all,
            'all' => $all,
            'unread' => $unread,
            'read' => max($all - $unread, 0),
            'automation' => $kindCount('automation'),
            'automation_unread' => $kindUnreadCount('automation'),
            'bookings' => $kindCount('bookings'),
            'payments' => $kindCount('payments'),
            'mice' => $kindCount('mice'),
            'deadline' => $kindCount('deadline'),
            'calendar' => $kindCount('calendar'),
            'services' => $kindCount('services'),
            'users' => $kindCount('users'),
            'account' => $kindCount('account'),
            'inquiries' => $kindCount('inquiries'),
            'content' => $kindCount('content'),
            'system' => $kindCount('system'),
        ];
    }
}
