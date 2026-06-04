<?php

namespace App\Support\Bookings;

use Illuminate\Http\UploadedFile;

class BookingPayload
{
    /**
     * Removes frontend-only values before data is passed to a model create/update.
     */
    public static function forPersistence(array $payload): array
    {
        unset(
            $payload['service_type_id'],
            $payload['policy_acknowledged'],
            $payload['accuracy_acknowledged'],
        );

        return $payload;
    }

    /**
     * Extracts primary booking columns only.
     * Keep relational arrays like items and extra_schedules out of direct Booking::fill().
     */
    public static function bookingColumns(array $payload): array
    {
        $copy = self::forPersistence($payload);

        unset(
            $copy['items'],
            $copy['extra_schedules'],
            $copy['survey_proof_image'],
        );

        return $copy;
    }

    public static function items(array $payload): array
    {
        $items = $payload['items'] ?? [];

        if (!is_array($items)) {
            return [];
        }

        return collect($items)
            ->filter(fn ($row) => is_array($row) && !empty($row['service_id']))
            ->map(fn ($row) => [
                'service_id' => (int) $row['service_id'],
                'quantity' => max(1, (int) ($row['quantity'] ?? 1)),
            ])
            ->values()
            ->all();
    }

    public static function extraSchedules(array $payload): array
    {
        $schedules = $payload['extra_schedules'] ?? [];

        if (!is_array($schedules)) {
            return [];
        }

        return collect($schedules)
            ->filter(fn ($row) => is_array($row) && !empty($row['from']) && !empty($row['to']))
            ->map(fn ($row) => [
                'from' => $row['from'],
                'to' => $row['to'],
            ])
            ->values()
            ->all();
    }

    public static function surveyProof(array $payload): ?UploadedFile
    {
        $file = $payload['survey_proof_image'] ?? null;

        return $file instanceof UploadedFile ? $file : null;
    }
}
