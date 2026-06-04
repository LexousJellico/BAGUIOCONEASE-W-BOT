<?php

namespace App\Services\Contracts;

use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BookingServiceInterface
{
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Booking;

    public function update(Booking $booking, array $data): Booking;

    public function delete(Booking $booking): void;

    public function getStatusCounts(array $filters = []): array;

    public function recalculatePaymentStatus(Booking $booking): void;

    public function syncLifecycleStatuses(): int;

    public function syncLifecycleStatus(Booking $booking): bool;

    public function runAutomatedLifecycleMaintenance(): array;

    public function paymentPolicySnapshot(Booking $booking): array;

    public function getDailyAvailability(string $date, $excludeBookingId = null, ?string $area = null): array;

    public function getDashboardMonthAvailability(Carbon|string $month): array;

    public function getDashboardDayStatus(string $date): array;

    public function calendarAreaOptions(): array;

    public function getPublicDayStatus(
        string $date,
        ?string $area = null,
        $excludeBookingId = null,
        ?string $eventType = null,
        ?int $guestCount = null,
    ): array;

    public function getPublicMonthCalendar(string $month, ?string $area = null): array;

    public function getUnavailableDates(?int $excludeBookingId = null): array;
}
