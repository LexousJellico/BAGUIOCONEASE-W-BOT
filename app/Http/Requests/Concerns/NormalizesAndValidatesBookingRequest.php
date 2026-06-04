<?php

namespace App\Http\Requests\Concerns;

use App\Models\Booking;
use App\Models\Service;
use Carbon\Carbon;
use DateTimeInterface;

trait NormalizesAndValidatesBookingRequest
{
    protected function normalizeBookingPayload(?Booking $booking = null, bool $forUpdate = false): void
    {
        $payload = $this->all();

        $trimmedStrings = [
            'company_name',
            'client_name',
            'client_contact_number',
            'client_address',
            'client_region',
            'client_province',
            'client_city_municipality',
            'client_barangay',
            'client_zip_code',
            'client_street_address',
            'head_of_organization',
            'type_of_event',
            'organization_type',
            'public_calendar_title',
        ];

        foreach ($trimmedStrings as $field) {
            if (array_key_exists($field, $payload) && is_string($payload[$field])) {
                $payload[$field] = trim($payload[$field]);
            }
        }

        if (array_key_exists('client_contact_number', $payload) && is_string($payload['client_contact_number'])) {
            $payload['client_contact_number'] = preg_replace('/\D+/', '', $payload['client_contact_number']);
        }


        if (array_key_exists('organization_type', $payload)) {
            $organizationType = strtolower(trim((string) ($payload['organization_type'] ?? '')));
            $payload['organization_type'] = in_array($organizationType, ['government', 'govt', 'government agency', 'government office', 'public'], true)
                ? 'Government'
                : 'Private';
        }

        foreach (['client_email', 'survey_email'] as $field) {
            if (array_key_exists($field, $payload) && is_string($payload[$field])) {
                $value = strtolower(trim($payload[$field]));
                $payload[$field] = $value !== '' ? $value : null;
            }
        }

        foreach (['number_of_guests', 'service_id', 'service_type_id'] as $field) {
            if (array_key_exists($field, $payload) && $payload[$field] !== null && $payload[$field] !== '') {
                $payload[$field] = is_numeric($payload[$field]) ? (int) $payload[$field] : $payload[$field];
            }
        }

        if (array_key_exists('booking_status', $payload) && is_string($payload['booking_status'])) {
            $payload['booking_status'] = strtolower(trim($payload['booking_status']));
        }

        if (array_key_exists('payment_status', $payload) && is_string($payload['payment_status'])) {
            $payload['payment_status'] = strtolower(trim($payload['payment_status']));
        }

        if (array_key_exists('is_public_calendar_visible', $payload)) {
            $payload['is_public_calendar_visible'] = filter_var($payload['is_public_calendar_visible'], FILTER_VALIDATE_BOOL);
        }

        [$from, $to] = $this->normalizeSchedulePair(
            $payload['booking_date_from'] ?? null,
            $payload['booking_date_to'] ?? null,
        );

        $payload['booking_date_from'] = $from;
        $payload['booking_date_to'] = $to;

        if (isset($payload['extra_schedules']) && is_array($payload['extra_schedules'])) {
            foreach ($payload['extra_schedules'] as $index => $row) {
                if (!is_array($row)) {
                    continue;
                }

                [$extraFrom, $extraTo] = $this->normalizeSchedulePair(
                    $row['from'] ?? null,
                    $row['to'] ?? null,
                );

                $payload['extra_schedules'][$index]['from'] = $extraFrom;
                $payload['extra_schedules'][$index]['to'] = $extraTo;
            }
        }

        $payload = $this->normalizeServiceSelection($payload, $booking);

        if (empty($payload['client_address'])) {
            $payload['client_address'] = $this->composeClientAddress($payload);
        }

        if (($payload['is_public_calendar_visible'] ?? false) && empty($payload['public_calendar_title'])) {
            $payload['public_calendar_title'] = $payload['type_of_event'] ?? null;
        }

        if (!$forUpdate && $this->isClientUser() && !$this->isStaffUser()) {
            $payload['booking_status'] = 'pending';
            $payload['payment_status'] = 'unpaid';
        }

        if ($forUpdate && $booking && $this->isClientUser() && !$this->isStaffUser()) {
            $payload['booking_status'] = $booking->booking_status;
            $payload['payment_status'] = $booking->payment_status;
        }

        $this->merge($payload);
    }

    protected function bookingRules(bool $forUpdate = false, ?Booking $booking = null): array
    {
        return [
            'service_type_id' => ['nullable', 'integer', 'exists:service_types,id'],
            'service_id' => ['required', 'integer', 'exists:services,id'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'integer', 'exists:services,id'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],

            'organization_type' => ['nullable', 'string', 'max:120'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_contact_number' => ['required', 'regex:/^\d{11}$/'],
            'client_email' => ['required', 'string', 'email', 'max:255'],

            'survey_email' => ['nullable', 'string', 'email', 'max:255'],
            'survey_proof_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],

            'client_address' => ['required', 'string', 'max:500'],
            'client_region' => ['nullable', 'string', 'max:120'],
            'client_province' => ['nullable', 'string', 'max:120'],
            'client_city_municipality' => ['nullable', 'string', 'max:120'],
            'client_barangay' => ['nullable', 'string', 'max:120'],
            'client_zip_code' => ['nullable', 'string', 'max:20'],
            'client_street_address' => ['nullable', 'string', 'max:255'],

            'head_of_organization' => ['nullable', 'string', 'max:255'],
            'type_of_event' => ['required', 'string', 'max:255'],

            'booking_date_from' => ['required', 'date'],
            'booking_date_to' => ['required', 'date', 'after:booking_date_from'],

            'extra_schedules' => ['sometimes', 'array'],
            'extra_schedules.*' => ['array'],
            'extra_schedules.*.from' => ['required_with:extra_schedules.*.to', 'date'],
            'extra_schedules.*.to' => ['required_with:extra_schedules.*.from', 'date'],

            'number_of_guests' => ['required', 'integer', 'min:1', 'max:2000'],

            'booking_status' => [
                'required',
                'in:pending,pencil_booked,for_review,active,confirmed,approved,cancelled,declined,completed,expired',
            ],
            'payment_status' => [
                'nullable',
                'in:unpaid,pending,partial,partially_paid,paid,owing,confirmed,verified,declined,failed,refunded',
            ],

            'is_public_calendar_visible' => ['sometimes', 'boolean'],
            'public_calendar_title' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function validateBookingPayload($validator, ?Booking $booking = null, bool $forUpdate = false): void
    {
        $validator->after(function ($validator) use ($booking, $forUpdate) {
            $isAdmin = $this->isAdminUser();
            $isStaff = $this->isStaffUser();
            $isClientOnly = $this->isClientUser() && !$isStaff;

            $service = $this->selectedService();

            if (!$service) {
                $validator->errors()->add('service_id', 'Please select a valid Service / rental option.');
                return;
            }

            $serviceTypeId = (int) $service->service_type_id;
            $postedServiceTypeId = (int) $this->input('service_type_id');

            if ($postedServiceTypeId > 0 && $postedServiceTypeId !== $serviceTypeId) {
                $validator->errors()->add(
                    'service_id',
                    'The selected Service does not belong to the selected Service Type / venue area.',
                );
            }

            $this->validateBookingItemsBelongToKnownServices($validator);

            if ($isClientOnly && $forUpdate && $booking) {
                $this->validateClientUpdateRestrictions($validator, $booking);
                return;
            }

            if ($isClientOnly && !$forUpdate) {
                if ($this->input('booking_status') !== 'pending') {
                    $validator->errors()->add('booking_status', 'Client-created bookings must start as Pending.');
                }

                if (!in_array((string) $this->input('payment_status'), ['', 'unpaid'], true)) {
                    $validator->errors()->add('payment_status', 'Payment status is managed by the system.');
                }
            }

            if ($this->boolean('is_public_calendar_visible') && !$this->filled('public_calendar_title')) {
                $validator->errors()->add(
                    'public_calendar_title',
                    'Please enter the public title that should appear on the calendar.',
                );
            }

            $mainFrom = $this->parseDateTime($this->input('booking_date_from'));
            $mainTo = $this->parseDateTime($this->input('booking_date_to'));

            $extraIntervals = [];

            if ($mainFrom && $mainTo) {
                $message = $this->validateBlockRange($mainFrom, $mainTo, $isAdmin);

                if ($message) {
                    $validator->errors()->add('booking_date_to', $message);
                } else {
                    $conflict = $this->findConflict(
                        $mainFrom,
                        $mainTo,
                        $serviceTypeId,
                        $booking?->id,
                    );

                    if ($conflict) {
                        $validator->errors()->add(
                            'booking_date_from',
                            'This schedule overlaps an existing confirmed or active booking for the same venue area.',
                        );
                    }
                }
            }

            $extras = $this->input('extra_schedules', []);

            if (is_array($extras)) {
                foreach ($extras as $index => $row) {
                    if (!is_array($row)) {
                        continue;
                    }

                    $fromRaw = $row['from'] ?? null;
                    $toRaw = $row['to'] ?? null;

                    if (!$fromRaw && !$toRaw) {
                        continue;
                    }

                    $from = $this->parseDateTime($fromRaw);
                    $to = $this->parseDateTime($toRaw);

                    if (!$from || !$to) {
                        $validator->errors()->add("extra_schedules.$index.from", 'Invalid date/time for this schedule row.');
                        continue;
                    }

                    if ($to->lessThanOrEqualTo($from)) {
                        $validator->errors()->add("extra_schedules.$index.to", 'End must be after start.');
                        continue;
                    }

                    $message = $this->validateBlockRange($from, $to, $isAdmin);

                    if ($message) {
                        $validator->errors()->add("extra_schedules.$index.to", $message);
                    } else {
                        $conflict = $this->findConflict(
                            $from,
                            $to,
                            $serviceTypeId,
                            $booking?->id,
                        );

                        if ($conflict) {
                            $validator->errors()->add(
                                "extra_schedules.$index.from",
                                'This extra schedule overlaps an existing confirmed or active booking for the same venue area.',
                            );
                        }
                    }

                    $extraIntervals[] = [
                        'from' => $from,
                        'to' => $to,
                        'error_field' => "extra_schedules.$index.from",
                    ];
                }
            }

            if ($mainFrom && $mainTo) {
                $this->validateNoOverlaps(
                    $validator,
                    array_merge(
                        [[
                            'from' => $mainFrom,
                            'to' => $mainTo,
                            'error_field' => 'booking_date_from',
                        ]],
                        $extraIntervals,
                    ),
                );
            }

            $status = strtolower((string) $this->input('booking_status'));

            if (in_array($status, ['active', 'confirmed', 'approved', 'completed'], true)) {
                $items = $this->input('items', []);

                if (!is_array($items) || count($items) < 1) {
                    $validator->errors()->add(
                        'items',
                        'A booking cannot be confirmed, activated, approved, or completed without at least one selected service.',
                    );
                }
            }
        });
    }

    protected function normalizeServiceSelection(array $payload, ?Booking $booking = null): array
    {
        $serviceId = (int) ($payload['service_id'] ?? 0);

        if ($serviceId < 1 && isset($payload['items']) && is_array($payload['items'])) {
            foreach ($payload['items'] as $row) {
                if (is_array($row) && !empty($row['service_id'])) {
                    $serviceId = (int) $row['service_id'];
                    break;
                }
            }
        }

        if ($serviceId < 1 && $booking?->service_id) {
            $serviceId = (int) $booking->service_id;
        }

        if ($serviceId > 0) {
            $payload['service_id'] = $serviceId;
        }

        $items = [];

        if (isset($payload['items']) && is_array($payload['items'])) {
            $seen = [];

            foreach ($payload['items'] as $row) {
                if (!is_array($row)) {
                    continue;
                }

                $rowServiceId = (int) ($row['service_id'] ?? 0);

                if ($rowServiceId < 1 || isset($seen[$rowServiceId])) {
                    continue;
                }

                $seen[$rowServiceId] = true;

                $items[] = [
                    'service_id' => $rowServiceId,
                    'quantity' => max(1, (int) ($row['quantity'] ?? 1)),
                ];
            }
        }

        if (count($items) < 1 && $serviceId > 0) {
            $items[] = [
                'service_id' => $serviceId,
                'quantity' => 1,
            ];
        }

        $payload['items'] = $items;

        if (empty($payload['service_type_id']) && $serviceId > 0) {
            $service = Service::query()->select(['id', 'service_type_id'])->find($serviceId);

            if ($service?->service_type_id) {
                $payload['service_type_id'] = (int) $service->service_type_id;
            }
        }

        return $payload;
    }

    protected function validateBookingItemsBelongToKnownServices($validator): void
    {
        $items = $this->input('items', []);

        if (!is_array($items) || count($items) < 1) {
            $validator->errors()->add('items', 'Please select at least one booking service.');
            return;
        }

        foreach ($items as $index => $row) {
            if (!is_array($row)) {
                $validator->errors()->add("items.$index", 'Invalid service item.');
                continue;
            }

            $serviceId = (int) ($row['service_id'] ?? 0);

            if ($serviceId < 1 || !Service::query()->whereKey($serviceId)->exists()) {
                $validator->errors()->add("items.$index.service_id", 'Selected service item does not exist.');
            }
        }
    }

    protected function validateClientUpdateRestrictions($validator, Booking $booking): void
    {
        if ($this->filled('service_id') && (string) $this->input('service_id') !== (string) $booking->service_id) {
            $validator->errors()->add('service_id', 'Clients cannot change the selected service. Please contact staff.');
        }

        $requestSchedule = $this->canonicalSchedule(
            $this->input('booking_date_from'),
            $this->input('booking_date_to'),
        );

        $databaseSchedule = $this->canonicalSchedule(
            $booking->booking_date_from,
            $booking->booking_date_to,
        );

        if ($requestSchedule !== $databaseSchedule) {
            $validator->errors()->add('booking_date_from', 'Clients cannot change the booking schedule. Please contact staff.');
        }

        if (strtolower((string) $this->input('booking_status')) !== strtolower((string) $booking->booking_status)) {
            $validator->errors()->add('booking_status', 'Clients cannot change booking status.');
        }

        if (
            $this->filled('payment_status') &&
            strtolower((string) $this->input('payment_status')) !== strtolower((string) $booking->payment_status)
        ) {
            $validator->errors()->add('payment_status', 'Payment status is managed by the system.');
        }
    }

    protected function selectedService(): ?Service
    {
        $serviceId = (int) $this->input('service_id');

        if ($serviceId < 1) {
            return null;
        }

        return Service::query()
            ->with('serviceType:id,name')
            ->select(['id', 'service_type_id', 'name', 'price'])
            ->find($serviceId);
    }

    protected function findConflict(Carbon $from, Carbon $to, ?int $serviceTypeId = null, ?int $excludeId = null): ?Booking
    {
        $toForOverlap = $this->endForOverlap($to);

        return Booking::query()
            ->select(['id', 'service_id', 'booking_date_from', 'booking_date_to', 'booking_status'])
            ->whereIn('booking_status', ['confirmed', 'approved', 'active'])
            ->when($excludeId, fn ($query) => $query->where('id', '!=', $excludeId))
            ->when($serviceTypeId, function ($query) use ($serviceTypeId) {
                $query->where(function ($venueQuery) use ($serviceTypeId) {
                    $venueQuery
                        ->whereHas('service', function ($serviceQuery) use ($serviceTypeId) {
                            $serviceQuery->where('service_type_id', $serviceTypeId);
                        })
                        ->orWhereHas('bookingServices.service', function ($serviceQuery) use ($serviceTypeId) {
                            $serviceQuery->where('service_type_id', $serviceTypeId);
                        });
                });
            })
            ->where('booking_date_from', '<', $toForOverlap->toDateTimeString())
            ->where('booking_date_to', '>', $from->toDateTimeString())
            ->orderBy('booking_date_from')
            ->first();
    }

    protected function validateBlockRange(Carbon $from, Carbon $to, bool $isAdmin): ?string
    {
        $fromTime = $from->format('H:i');
        $toTime = $to->format('H:i');

        if ($from->minute !== 0) {
            return 'Start time must be aligned to exact block hours. Minutes must be :00.';
        }

        $endOk = ($to->minute === 0) || ($to->hour === 23 && $to->minute === 59);

        if (!$endOk) {
            return 'End time must be aligned to block hours or exactly 11:59 PM for EVE.';
        }

        $fromDate = $from->copy()->startOfDay();
        $toDate = $to->copy()->startOfDay();

        $sameDay = $toDate->equalTo($fromDate);
        $nextDay = $toDate->equalTo($fromDate->copy()->addDay());

        if ($sameDay && $fromTime === '00:00' && $toTime === '06:00') {
            return $isAdmin ? null : '11:59 PM to 6:00 AM is admin-only. Please contact admin for this booking.';
        }

        if ($sameDay && $fromTime === '06:00' && $toTime === '12:00') return null;
        if ($sameDay && $fromTime === '12:00' && $toTime === '18:00') return null;
        if ($sameDay && $fromTime === '06:00' && $toTime === '18:00') return null;

        if ($sameDay && $fromTime === '18:00' && $toTime === '23:59') return null;
        if ($sameDay && $fromTime === '12:00' && $toTime === '23:59') return null;
        if ($sameDay && $fromTime === '06:00' && $toTime === '23:59') return null;

        if ($nextDay && in_array($fromTime, ['06:00', '12:00', '18:00'], true) && $toTime === '00:00') {
            return null;
        }

        return 'Invalid schedule. Use AM, PM, EVE, AM+PM, PM+EVE, or Whole Day block combinations.';
    }

    protected function validateNoOverlaps($validator, array $intervals): void
    {
        $count = count($intervals);

        for ($i = 0; $i < $count; $i++) {
            for ($j = $i + 1; $j < $count; $j++) {
                $first = $intervals[$i];
                $second = $intervals[$j];

                /** @var Carbon $firstFrom */
                $firstFrom = $first['from'];

                /** @var Carbon $firstTo */
                $firstTo = $this->endForOverlap($first['to']);

                /** @var Carbon $secondFrom */
                $secondFrom = $second['from'];

                /** @var Carbon $secondTo */
                $secondTo = $this->endForOverlap($second['to']);

                if ($firstFrom->lt($secondTo) && $secondFrom->lt($firstTo)) {
                    $validator->errors()->add(
                        $second['error_field'],
                        'Schedules in this request overlap each other. Please choose non-overlapping blocks or dates.',
                    );
                }
            }
        }
    }

    protected function normalizeSchedulePair(?string $fromRaw, ?string $toRaw): array
    {
        if (!$fromRaw || !$toRaw) {
            return [$fromRaw, $toRaw];
        }

        $from = $this->parseDateTime($fromRaw);
        $to = $this->parseDateTime($toRaw);

        if (!$from || !$to) {
            return [$fromRaw, $toRaw];
        }

        $fromTime = $from->format('H:i');
        $toTime = $to->format('H:i');

        if ($toTime === '00:00') {
            $fromDate = $from->copy()->startOfDay();
            $toDate = $to->copy()->startOfDay();

            $isNextDay = $toDate->equalTo($fromDate->copy()->addDay());
            $validStarts = in_array($fromTime, ['06:00', '12:00', '18:00'], true);

            if ($isNextDay && $validStarts) {
                $to = $from->copy()->setTime(23, 59, 0);
            }
        }

        return [
            $from->format('Y-m-d\TH:i'),
            $to->format('Y-m-d\TH:i'),
        ];
    }

    protected function parseDateTime($value): ?Carbon
    {
        if ($value instanceof DateTimeInterface) {
            return Carbon::instance($value);
        }

        if (!$value) {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    protected function endForOverlap(Carbon $to): Carbon
    {
        return ($to->hour === 23 && $to->minute === 59)
            ? $to->copy()->addMinute()
            : $to->copy();
    }

    protected function canonicalSchedule($fromRaw, $toRaw): string
    {
        [$from, $to] = $this->normalizeSchedulePair(
            $fromRaw instanceof DateTimeInterface ? Carbon::instance($fromRaw)->format('Y-m-d\TH:i') : (string) $fromRaw,
            $toRaw instanceof DateTimeInterface ? Carbon::instance($toRaw)->format('Y-m-d\TH:i') : (string) $toRaw,
        );

        return "{$from}|{$to}";
    }

    protected function composeClientAddress(array $payload): string
    {
        return collect([
            $payload['client_street_address'] ?? null,
            $payload['client_barangay'] ?? null,
            $payload['client_city_municipality'] ?? null,
            $payload['client_province'] ?? null,
            $payload['client_region'] ?? null,
            $payload['client_zip_code'] ?? null,
        ])
            ->filter(fn ($value) => filled($value))
            ->implode(', ');
    }

    protected function sanitizedValidatedPayload(array $validated): array
    {
        unset(
            $validated['service_type_id'],
            $validated['policy_acknowledged'],
            $validated['accuracy_acknowledged'],
        );

        return $validated;
    }

    protected function isClientUser(): bool
    {
        return $this->userHasAnyRole(['user', 'client']);
    }

    protected function isStaffUser(): bool
    {
        return $this->userHasAnyRole(['admin', 'manager', 'staff']);
    }

    protected function isAdminUser(): bool
    {
        return $this->userHasAnyRole(['admin']);
    }

    protected function userHasAnyRole(array $roles): bool
    {
        $user = $this->user();

        if (!$user) {
            return false;
        }

        if (method_exists($user, 'hasRole') && $user->hasRole($roles)) {
            return true;
        }

        $directRole = $user->role_name ?? $user->role ?? null;

        if ($directRole && in_array((string) $directRole, $roles, true)) {
            return true;
        }

        $userRoles = $user->roles ?? [];

        if (is_iterable($userRoles)) {
            foreach ($userRoles as $role) {
                $name = is_string($role) ? $role : ($role->name ?? null);

                if ($name && in_array($name, $roles, true)) {
                    return true;
                }
            }
        }

        return false;
    }
}
