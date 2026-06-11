<?php

namespace App\Http\Controllers;

use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class WorkspaceLiveStateController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_unless($user, 403);

        $signals = [
            'notifications' => $this->querySignal(
                DB::table('user_notifications')->where('user_id', $user->id)
            ),
        ];

        if ($user->hasAnyRole(['admin', 'manager', 'staff'])) {
            foreach ($this->operationsTables() as $table) {
                $signals[$table] = $this->tableSignal($table);
            }
        } elseif (
            Schema::hasTable('bookings')
            && Schema::hasColumn('bookings', 'created_by_user_id')
        ) {
            $bookings = DB::table('bookings')->where('created_by_user_id', $user->id);

            $signals['bookings'] = $this->querySignal($bookings);
            $signals['booking_payments'] = Schema::hasTable('booking_payments')
                ? $this->querySignal(
                    DB::table('booking_payments')
                        ->join('bookings', 'bookings.id', '=', 'booking_payments.booking_id')
                        ->where('bookings.created_by_user_id', $user->id),
                    'booking_payments.updated_at',
                )
                : $this->emptySignal();
        } else {
            $signals['bookings'] = $this->emptySignal();
            $signals['booking_payments'] = $this->emptySignal();
        }

        return response()
            ->json([
                'version' => hash('sha256', json_encode($signals, JSON_THROW_ON_ERROR)),
                'checked_at' => now()->toIso8601String(),
                'poll_after_seconds' => 15,
            ])
            ->header('Cache-Control', 'private, no-store, max-age=0')
            ->header('Pragma', 'no-cache');
    }

    /**
     * @return array<int, string>
     */
    private function operationsTables(): array
    {
        return [
            'bookings',
            'booking_payments',
            'calendar_blocks',
            'inquiries',
            'users',
            'services',
            'service_types',
            'mice_records',
        ];
    }

    /**
     * @return array{count: int, latest: string|null}
     */
    private function tableSignal(string $table): array
    {
        if (! Schema::hasTable($table)) {
            return $this->emptySignal();
        }

        return $this->querySignal(DB::table($table));
    }

    /**
     * @return array{count: int, latest: string|null}
     */
    private function querySignal(Builder $query, string $updatedAt = 'updated_at'): array
    {
        $table = str_contains($updatedAt, '.')
            ? strstr($updatedAt, '.', true)
            : $query->from;

        if (! is_string($table) || ! Schema::hasTable($table) || ! Schema::hasColumn($table, 'updated_at')) {
            return $this->emptySignal();
        }

        return [
            'count' => (clone $query)->count(),
            'latest' => (clone $query)->max($updatedAt),
        ];
    }

    /**
     * @return array{count: int, latest: string|null}
     */
    private function emptySignal(): array
    {
        return ['count' => 0, 'latest' => null];
    }
}
