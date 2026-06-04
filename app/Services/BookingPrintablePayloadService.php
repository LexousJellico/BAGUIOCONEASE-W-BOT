<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\BookingPostEventCharge;
use App\Models\BookingScheduleSegment;
use App\Models\MiceRecord;
use App\Support\BcccBookingPolicyCatalog;
use App\Support\BcccPrintableDocumentCatalog;
use App\Support\DressingRoomCatalog;
use App\Support\VenueAreaCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

class BookingPrintablePayloadService
{
    public function __construct(
        private readonly BookingBillingService $billing,
        private readonly BookingPricingService $pricing,
    ) {
    }

    public function build(Booking $booking, string $documentType, Request $request): array
    {
        $type = BcccPrintableDocumentCatalog::normalize($documentType);

        $booking->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
            'miceRecord',
            'scheduleSegments',
            'lifecycleEvents',
            'postEventCharges',
        ]);

        $billing = $this->billing->summarize($booking);
        $documentMeta = BcccPrintableDocumentCatalog::meta($type);
        $mice = $booking->miceRecord;

        return [
            'document' => [
                'type' => $type,
                'title' => $documentMeta['label'],
                'description' => $documentMeta['description'],
                'code' => $documentMeta['print_code'],
                'generated_at' => now()->toIso8601String(),
                'generated_by' => $request->user()?->name,
                'workspace_role' => $this->roleFromRoute($request),
            ],
            'office' => [
                'city' => 'CITY GOVERNMENT OF BAGUIO',
                'department' => 'CITY TOURISM, CULTURE AND ARTS OFFICE',
                'venue' => 'BAGUIO CONVENTION AND CULTURAL CENTER',
                'system' => 'BCCC EASE',
            ],
            'booking' => $this->booking($booking),
            'client' => $this->client($booking),
            'schedule' => $this->schedule($booking),
            'venue' => $this->venue($booking),
            'charges' => $this->charges($booking, $billing),
            'payments' => $this->payments($booking),
            'post_event_charges' => $this->postEventCharges($booking),
            'mice' => $this->mice($mice, $booking),
            'approval' => $this->approval($booking),
            'policy' => [
                'active_charge_choices' => BcccBookingPolicyCatalog::activeChargeChoices(),
                'excluded_user_charges' => BcccBookingPolicyCatalog::excludedUserCharges(),
                'notes' => BcccPrintableDocumentCatalog::policyNotes($type),
            ],
        ];
    }

    private function booking(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'reference' => 'BCCC-' . str_pad((string) $booking->id, 6, '0', STR_PAD_LEFT),
            'status' => (string) ($booking->booking_status ?: 'pending'),
            'payment_status' => (string) ($booking->payment_status ?: 'unpaid'),
            'title' => $this->text($booking->display_title ?? $booking->type_of_event ?? 'Booking'),
            'event_name' => $this->text($booking->type_of_event ?? $booking->public_calendar_title ?? $booking->display_title ?? 'Event'),
            'public_calendar_title' => $this->text($booking->public_calendar_title),
            'created_at' => $this->dateTime($booking->created_at),
            'updated_at' => $this->dateTime($booking->updated_at),
            'created_by' => $booking->createdBy ? [
                'name' => $booking->createdBy->name,
                'email' => $booking->createdBy->email,
            ] : null,
        ];
    }

    private function client(Booking $booking): array
    {
        $addressParts = array_filter([
            $booking->client_street_address,
            $booking->client_barangay,
            $booking->client_city_municipality,
            $booking->client_province,
            $booking->client_region,
            $booking->client_zip_code,
        ], fn ($part) => filled($part));

        $completeAddress = $booking->client_address ?: implode(', ', $addressParts);
        $parsedParts = collect(explode(',', (string) $completeAddress))->map(fn ($part) => trim($part))->filter()->values();
        $zipFromAddress = preg_match('/\b\d{4}\b/', (string) $completeAddress, $zipMatch) ? $zipMatch[0] : null;

        return [
            'organization_type' => $this->text($booking->organization_type),
            'company_name' => $this->text($booking->company_name),
            'client_name' => $this->text($booking->client_name),
            'head_of_organization' => $this->text($booking->head_of_organization),
            'email' => $this->text($booking->client_email),
            'contact_number' => $this->text($booking->client_contact_number),
            'address' => $this->text($completeAddress),
            'street_address' => $this->text($booking->client_street_address ?: $parsedParts->get(0)),
            'region' => $this->text($booking->client_region ?: trim(preg_replace('/\b\d{4}\b/', '', (string) ($parsedParts->get(4) ?? '')))),
            'province' => $this->text($booking->client_province ?: $parsedParts->get(3)),
            'city' => $this->text($booking->client_city_municipality ?: $parsedParts->get(2)),
            'barangay' => $this->text($booking->client_barangay ?: $parsedParts->get(1)),
            'zip_code' => $this->text($booking->client_zip_code ?: $zipFromAddress),
        ];
    }

    private function schedule(Booking $booking): array
    {
        $segments = $booking->scheduleSegments
            ->map(fn (BookingScheduleSegment $segment): array => [
                'date' => optional($segment->date)->format('Y-m-d'),
                'role' => $this->text($segment->segment_role),
                'base_block' => $this->text($segment->base_block),
                'starts_at' => $this->dateTime($segment->starts_at),
                'ends_at' => $this->dateTime($segment->ends_at),
                'additional_hours' => (int) ($segment->additional_hours ?? 0),
                'additional_starts_at' => $this->dateTime($segment->additional_starts_at),
                'additional_ends_at' => $this->dateTime($segment->additional_ends_at),
                'area_labels' => VenueAreaCatalog::displayNames($segment->area_keys ?? []),
            ])
            ->values()
            ->all();

        return [
            'date_from' => $this->dateTime($booking->booking_date_from),
            'date_to' => $this->dateTime($booking->booking_date_to),
            'date_from_short' => $this->date($booking->booking_date_from),
            'date_to_short' => $this->date($booking->booking_date_to),
            'guest_count' => (int) ($booking->number_of_guests ?? 0),
            'segments' => $segments,
            'segments_count' => count($segments),
            'schedule_meta' => is_array($booking->schedule_meta ?? null) ? $booking->schedule_meta : [],
        ];
    }

    private function derivedVenueCapacity(Booking $booking): string
    {
        $capacities = [
            'full_hall' => 2000,
            'main_hall' => 2000,
            'led_wall' => 2000,
            'vip_lounge' => 100,
            'lounge' => 100,
            'board_room' => 80,
        ];

        $areaKeys = VenueAreaCatalog::canonicalKeys(
            is_array($booking->selected_area_keys ?? null) ? $booking->selected_area_keys : []
        );

        if (in_array('full_hall', $areaKeys, true) || in_array('main_hall', $areaKeys, true)) {
            return 'Up to 2,000 pax';
        }

        if (filled($booking->venue_capacity)) {
            return (string) $booking->venue_capacity;
        }

        $selected = collect($areaKeys)
            ->map(fn ($key) => $capacities[VenueAreaCatalog::canonicalKey((string) $key)] ?? null)
            ->filter(fn ($value) => is_numeric($value) && (int) $value > 0)
            ->values();

        return $selected->isNotEmpty()
            ? 'Up to ' . number_format((int) $selected->min()) . ' pax'
            : 'Subject to BCCC layout review';
    }

    private function venue(Booking $booking): array
    {
        $service = $booking->service;
        $serviceType = $service?->serviceType;
        $areaKeys = is_array($booking->selected_area_keys ?? null) ? $booking->selected_area_keys : [];

        return [
            'primary_service' => $this->text($service?->name),
            'primary_area' => $this->text($serviceType?->name),
            'selected_package_code' => $this->text($booking->selected_package_code),
            'selected_area_keys' => array_values($areaKeys),
            'selected_area_labels' => VenueAreaCatalog::displayNames($areaKeys),
            'capacity' => $this->derivedVenueCapacity($booking),
            'capacity_label' => $this->derivedVenueCapacity($booking),
            'dressing_room_selection' => $this->text($booking->dressing_room_selection),
            'dressing_room_label' => DressingRoomCatalog::label($booking->dressing_room_selection),
            'dressing_room_charge' => $this->money($booking->dressing_room_charge),
            'full_hall_includes_lobby' => in_array('full_hall', VenueAreaCatalog::canonicalKeys($areaKeys), true),
        ];
    }

    private function charges(Booking $booking, array $billing): array
    {
        $finalMeta = is_array($booking->final_computation_meta ?? null) ? $booking->final_computation_meta : [];
        $pricingMeta = $this->pricingMeta($booking);

        /*
         * Printouts must show the full computation, not only whichever rows were
         * persisted in final_computation_meta. Rebuild the charge rows from the
         * approved venue areas and schedule segments so selected rentals such as
         * Main Hall whole/half day, VIP Lounge, Boardroom, LED Wall, additional
         * hours, and Dressing Room 1 & 2 are always printed with the correct qty.
         */
        $pricingLines = $this->metaLines($pricingMeta);
        $metaLines = $this->metaLines($finalMeta);
        $items = $this->bookingChargeItems($booking);
        $lineItems = $pricingLines ?: ($metaLines ?: $items);

        foreach ($this->manualMetaLines($metaLines, $lineItems) as $manualLine) {
            $lineItems[] = $manualLine;
        }

        $dressingCharge = $this->money(
            $pricingMeta['dressing_room_total']
            ?? $booking->dressing_room_charge
            ?? 0
        );

        if ($dressingCharge > 0 && ! $this->containsDressingRoomLine($lineItems)) {
            $dayCount = $this->chargeableDayCount($booking);
            $lineItems[] = [
                'label' => DressingRoomCatalog::label($booking->dressing_room_selection),
                'description' => $dayCount . ' day(s) × ' . $this->peso($dressingCharge / max(1, $dayCount)),
                'type' => 'Dressing Room / Other Rental',
                'quantity' => $dayCount,
                'unit_price' => $dressingCharge / max(1, $dayCount),
                'amount' => $dressingCharge,
            ];
        }

        $discountSource = ! empty($finalMeta['discount_lines'] ?? null) || ! empty($finalMeta['discounts'] ?? null)
            ? $finalMeta
            : $pricingMeta;

        foreach ($this->discountLines($discountSource) as $discountLine) {
            if (! $this->containsEquivalentLine($lineItems, $discountLine)) {
                $lineItems[] = $discountLine;
            }
        }

        $requiredBond = $this->money($billing['required_bond'] ?? $booking->required_bond_amount ?? BcccBookingPolicyCatalog::REQUIRED_BOND_AMOUNT);
        $bondCharge = $this->money($billing['bond_charge'] ?? $requiredBond);

        if ($bondCharge > 0 && ! $this->containsBondLine($lineItems)) {
            $lineItems[] = [
                'label' => 'Required refundable bond',
                'description' => 'Included in down payment or full payment balance',
                'type' => 'Bond',
                'quantity' => 1,
                'unit_price' => $bondCharge,
                'amount' => $bondCharge,
            ];
        }

        $lineItems = $this->normalizePrintableLines($lineItems);

        return [
            'line_items' => array_values($lineItems),
            'booking_items' => $items,
            'dressing_room_charge' => $dressingCharge,
            'dressing_room_label' => DressingRoomCatalog::label($booking->dressing_room_selection),
            'base_subtotal' => $this->money($billing['base_subtotal'] ?? $booking->base_subtotal ?? 0),
            'discount_total' => $this->money($billing['discount_total'] ?? $booking->discount_total ?? 0),
            'base_total' => $this->money($billing['base_total'] ?? $booking->finalized_total ?? 0),
            'post_event_total' => $this->money($billing['post_event_total'] ?? 0),
            'venue_total_with_post_event' => $this->money($billing['venue_total_with_post_event'] ?? $billing['base_total'] ?? 0),
            'total_with_bond' => $this->money($billing['total_with_bond'] ?? $billing['total_with_post_event'] ?? $booking->finalized_total ?? 0),
            'payment_total_including_bond' => $this->money($billing['payment_total_including_bond'] ?? $billing['total_with_bond'] ?? $billing['total_with_post_event'] ?? 0),
            'total_with_post_event' => $this->money($billing['total_with_post_event'] ?? $booking->finalized_total ?? 0),
            'required_down_payment' => $this->money($billing['required_down_payment'] ?? $booking->required_down_payment_amount ?? 0),
            'base_required_down_payment' => $this->money($billing['base_required_down_payment'] ?? 0),
            'required_bond' => $requiredBond,
            'bond_charge' => $bondCharge,
            'paid' => $this->money($billing['paid'] ?? 0),
            'pending' => $this->money($billing['pending'] ?? 0),
            'balance' => $this->money($billing['balance'] ?? 0),
            'bond_status' => $this->text($billing['bond_status'] ?? $booking->bond_status ?? 'pending'),
            'final_computation_status' => $this->text($billing['final_computation_status'] ?? $booking->final_computation_status ?? null),
            'final_computation_status_label' => $this->text($billing['final_computation_status_label'] ?? null),
            'final_computation_finalized_at' => $this->text($billing['final_computation_finalized_at'] ?? optional($booking->final_computation_finalized_at ?? null)->toIso8601String()),
            'down_payment_due_at' => $this->dateTime($booking->down_payment_due_at),
            'balance_due_at' => $this->dateTime($booking->balance_due_at),
            'final_computation_locked_at' => $this->dateTime($booking->final_computation_locked_at),
            'billing_notes' => $this->text($booking->billing_notes),
            'final_computation_meta' => $finalMeta,
        ];
    }


    private function pricingMeta(Booking $booking): array
    {
        try {
            return $this->pricing->fromBooking($booking, true);
        } catch (\Throwable) {
            return [];
        }
    }

    private function chargeableDayCount(Booking $booking): int
    {
        $dates = $booking->scheduleSegments
            ->pluck('date')
            ->filter()
            ->map(fn ($date) => Carbon::parse((string) $date)->toDateString())
            ->unique()
            ->values();

        if ($dates->isNotEmpty()) {
            return max(1, $dates->count());
        }

        if ($booking->booking_date_from && $booking->booking_date_to) {
            return max(1, Carbon::parse($booking->booking_date_from)->startOfDay()->diffInDays(Carbon::parse($booking->booking_date_to)->startOfDay()) + 1);
        }

        return 1;
    }

    private function manualMetaLines(array $metaLines, array $existingLines): array
    {
        return collect($metaLines)
            ->filter(function (array $line) use ($existingLines): bool {
                $type = strtolower((string) ($line['type'] ?? ''));

                if (str_contains($type, 'venue') || str_contains($type, 'dressing') || str_contains($type, 'bond') || str_contains($type, 'discount')) {
                    return false;
                }

                return ! $this->containsEquivalentLine($existingLines, $line);
            })
            ->values()
            ->all();
    }

    private function containsEquivalentLine(array $lines, array $candidate): bool
    {
        $candidateKey = $this->lineComparisonKey($candidate);

        foreach ($lines as $line) {
            if (is_array($line) && $this->lineComparisonKey($line) === $candidateKey) {
                return true;
            }
        }

        return false;
    }

    private function lineComparisonKey(array $line): string
    {
        return implode('|', [
            strtolower(trim((string) ($line['type'] ?? ''))),
            strtolower(trim((string) ($line['label'] ?? $line['description'] ?? ''))),
            number_format($this->money($line['unit_price'] ?? $line['unit_amount'] ?? 0), 2, '.', ''),
        ]);
    }

    private function normalizePrintableLines(array $lines): array
    {
        return collect($lines)
            ->map(function (array $line): array {
                $quantity = (float) ($line['quantity'] ?? $line['qty'] ?? 1);
                $unitPrice = $this->money($line['unit_price'] ?? $line['unit_amount'] ?? $line['price'] ?? 0);
                $amount = $this->money($line['amount'] ?? $line['line_total'] ?? $line['total'] ?? 0);

                if ($amount <= 0 && $unitPrice > 0) {
                    $amount = $unitPrice * max($quantity, 1);
                }

                return [
                    ...$line,
                    'label' => $this->text($line['label'] ?? $line['name'] ?? 'Charge'),
                    'description' => $this->text($line['description'] ?? null, ''),
                    'type' => $this->text($line['type'] ?? 'Charge'),
                    'quantity' => $this->displayQuantity($quantity),
                    'unit_price' => $this->roundMoney($unitPrice),
                    'amount' => $this->roundMoney($amount),
                ];
            })
            ->filter(fn (array $line): bool => abs((float) ($line['amount'] ?? 0)) > 0)
            ->values()
            ->all();
    }

    private function displayQuantity(float $quantity): int|float
    {
        $quantity = max(1, $quantity);

        return floor($quantity) === $quantity ? (int) $quantity : $quantity;
    }

    private function containsDressingRoomLine(array $lines): bool
    {
        foreach ($lines as $line) {
            if (! is_array($line)) {
                continue;
            }

            $type = strtolower((string) ($line['type'] ?? $line['key'] ?? ''));
            $label = strtolower((string) ($line['label'] ?? $line['description'] ?? ''));

            if (str_contains($type, 'dressing') || str_contains($label, 'dressing room')) {
                return true;
            }
        }

        return false;
    }

    private function containsBondLine(array $lines): bool
    {
        foreach ($lines as $line) {
            if (! is_array($line)) {
                continue;
            }

            $type = strtolower((string) ($line['type'] ?? $line['key'] ?? ''));
            $label = strtolower((string) ($line['label'] ?? $line['description'] ?? ''));

            if (str_contains($type, 'bond') || str_contains($label, 'bond')) {
                return true;
            }
        }

        return false;
    }

    private function bookingChargeItems(Booking $booking): array
    {
        return $booking->bookingServices
            ->map(function ($item): array {
                $service = $item->service;
                $serviceType = $service?->serviceType;
                $quantity = max(1, (int) ($item->quantity ?? 1));
                $unitPrice = $this->money($item->unit_price ?? $item->price ?? $service?->price ?? 0);

                return [
                    'label' => trim(implode(' - ', array_filter([$serviceType?->name, $service?->name]))) ?: 'Venue charge',
                    'description' => $this->text($service?->description),
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'amount' => $this->money($unitPrice * $quantity),
                ];
            })
            ->values()
            ->all();
    }

    private function metaLines(array $meta): array
    {
        $raw = $meta['line_items'] ?? $meta['lines'] ?? $meta['items'] ?? null;

        if (! is_array($raw)) {
            return [];
        }

        $grouped = [];

        foreach ($raw as $line) {
            $line = is_array($line) ? $line : [];
            $amount = $this->money($line['amount'] ?? $line['line_total'] ?? $line['total'] ?? 0);
            $quantity = (float) ($line['quantity'] ?? $line['qty'] ?? 1);
            $unitPrice = $this->money($line['unit_price'] ?? $line['unit_amount'] ?? $line['price'] ?? 0);

            if ($amount <= 0 && $unitPrice > 0) {
                $amount = $unitPrice * max($quantity, 1);
            }

            if ($amount <= 0) {
                continue;
            }

            $label = $this->text($line['label'] ?? $line['name'] ?? 'Charge');
            $type = $this->text($line['type'] ?? 'Venue charge');
            $duration = $this->text($line['duration_label'] ?? $line['base_block'] ?? null, '');
            $date = $this->text($line['date'] ?? null, '');
            $key = implode('|', [
                strtolower($type),
                strtolower($label),
                strtolower($duration),
                number_format($unitPrice, 2, '.', ''),
            ]);

            if (! isset($grouped[$key])) {
                $grouped[$key] = [
                    'label' => trim($label . ($duration !== '' ? ' - ' . $duration : '')),
                    'description' => $this->text($line['description'] ?? $line['notes'] ?? null, ''),
                    'type' => $type,
                    'quantity' => 0,
                    'unit_price' => $unitPrice,
                    'amount' => 0,
                    'dates' => [],
                ];
            }

            $grouped[$key]['quantity'] += $quantity > 0 ? $quantity : 1;
            $grouped[$key]['amount'] += $amount;

            if ($date !== '') {
                $grouped[$key]['dates'][] = $date;
            }
        }

        return collect($grouped)
            ->map(function (array $line): array {
                $dates = array_values(array_unique(array_filter($line['dates'] ?? [])));
                $description = $line['description'] ?: ($dates ? count($dates) . ' schedule date(s)' : 'Computed booking charge');

                return [
                    'label' => $line['label'],
                    'description' => $description,
                    'type' => $line['type'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'amount' => $this->roundMoney($line['amount']),
                ];
            })
            ->values()
            ->all();
    }

    private function discountLines(array $meta): array
    {
        $raw = $meta['discount_lines'] ?? $meta['discounts'] ?? [];

        if (! is_array($raw)) {
            return [];
        }

        return collect($raw)
            ->map(function ($line): array {
                $line = is_array($line) ? $line : [];
                $amount = $this->money($line['amount'] ?? 0);

                return [
                    'label' => $this->text($line['label'] ?? 'Discount / adjustment'),
                    'description' => 'Discount basis ' . $this->peso($this->money($line['basis'] ?? 0)),
                    'type' => 'Discount',
                    'quantity' => 1,
                    'unit_price' => -1 * $amount,
                    'amount' => -1 * $amount,
                ];
            })
            ->filter(fn (array $line): bool => abs((float) $line['amount']) > 0)
            ->values()
            ->all();
    }

    private function payments(Booking $booking): array
    {
        return $booking->payments
            ->sortByDesc('created_at')
            ->values()
            ->map(fn (BookingPayment $payment): array => [
                'id' => $payment->id,
                'type' => $this->text($payment->payment_type ?? 'venue_fee'),
                'method' => $this->text($payment->payment_method),
                'gateway' => $this->text($payment->payment_gateway),
                'reference' => $this->text($payment->transaction_reference),
                'status' => $this->text($payment->status),
                'amount' => $this->money($payment->amount),
                'created_at' => $this->dateTime($payment->created_at),
                'remarks' => $this->text($payment->remarks),
            ])
            ->all();
    }

    private function postEventCharges(Booking $booking): array
    {
        if (! $booking->relationLoaded('postEventCharges')) {
            return [];
        }

        return $booking->postEventCharges
            ->sortByDesc('assessed_at')
            ->values()
            ->map(fn (BookingPostEventCharge $charge): array => [
                'id' => $charge->id,
                'category' => $this->text($charge->category),
                'label' => $this->text($charge->label),
                'amount' => $this->money($charge->amount),
                'status' => $this->text($charge->status),
                'notes' => $this->text($charge->notes),
                'assessed_at' => $this->dateTime($charge->assessed_at),
            ])
            ->all();
    }

    private function miceDraftMetaValue(Booking $booking, string $key): ?string
    {
        $meta = is_array($booking->payment_meta ?? null) ? $booking->payment_meta : [];
        $draft = isset($meta['mice_draft']) && is_array($meta['mice_draft']) ? $meta['mice_draft'] : [];
        $value = $draft[$key] ?? null;

        return is_scalar($value) && trim((string) $value) !== '' ? (string) $value : null;
    }

    private function readableScheduleRange(Booking $booking): string
    {
        $segments = $booking->scheduleSegments;

        if ($segments->isNotEmpty()) {
            $first = $segments->sortBy('starts_at')->first();
            $last = $segments->sortBy('ends_at')->last();

            return $this->readableDateTime($first?->starts_at ?: $first?->date) . ' - ' . $this->readableDateTime($last?->ends_at ?: $last?->date);
        }

        return $this->readableDateTime($booking->booking_date_from) . ' - ' . $this->readableDateTime($booking->booking_date_to);
    }

    private function readableAdditionalHours(Booking $booking): string
    {
        $rows = $booking->scheduleSegments
            ->filter(fn ($segment) => (int) ($segment->additional_hours ?? 0) > 0)
            ->map(fn ($segment) => $this->readableDate($segment->date ?: $segment->starts_at) . ': ' . (int) $segment->additional_hours . ' additional hour(s), ' . $this->readableTime($segment->additional_starts_at) . ' - ' . $this->readableTime($segment->additional_ends_at))
            ->values();

        return $rows->isNotEmpty() ? $rows->implode(' • ') : 'No additional / EVE hours';
    }

    private function readableDateTime(mixed $value): string
    {
        if (! $value) {
            return '—';
        }

        try {
            return Carbon::parse($value)->format('F j, Y, g:i A');
        } catch (\Throwable) {
            return (string) $value;
        }
    }

    private function readableDate(mixed $value): string
    {
        if (! $value) {
            return '—';
        }

        try {
            return Carbon::parse($value)->format('F j, Y');
        } catch (\Throwable) {
            return (string) $value;
        }
    }

    private function readableTime(mixed $value): string
    {
        if (! $value) {
            return '—';
        }

        try {
            return Carbon::parse($value)->format('g:i A');
        } catch (\Throwable) {
            return (string) $value;
        }
    }

    private function mice(?MiceRecord $record, Booking $booking): array
    {
        if (! $record) {
            return [
                'exists' => false,
                'status' => 'missing',
                'event_center_name' => 'BAGUIO CONVENTION AND CULTURAL CENTER',
                'event_name' => $this->text($booking->type_of_event ?? $booking->display_title),
                'schedule_time_display' => $this->miceDraftMetaValue($booking, 'schedule_time_display') ?: $this->readableScheduleRange($booking),
                'additional_hours_display' => $this->miceDraftMetaValue($booking, 'additional_hours_display') ?: $this->readableAdditionalHours($booking),
            ];
        }

        return [
            'exists' => true,
            'id' => $record->id,
            'record_no' => $this->text($record->record_no),
            'status' => $this->text($record->status),
            'event_scope' => $this->text($record->event_scope),
            'event_center_name' => $this->text($record->event_center_name ?: 'BAGUIO CONVENTION AND CULTURAL CENTER'),
            'function_halls_count' => $this->text($record->function_halls_count),
            'function_hall_capacity' => $this->text($record->function_hall_capacity),
            'covered_month' => $this->text($record->covered_month),
            'event_started_at' => $this->date($record->event_started_at ?: $record->event_date_from),
            'event_finished_at' => $this->date($record->event_finished_at ?: $record->event_date_to),
            'number_of_hours' => $this->text($record->number_of_hours),
            'schedule_time_display' => $this->miceDraftMetaValue($booking, 'schedule_time_display') ?: $this->readableScheduleRange($booking),
            'additional_hours_display' => $this->miceDraftMetaValue($booking, 'additional_hours_display') ?: $this->readableAdditionalHours($booking),
            'schedule_daily_display' => $this->miceDraftMetaValue($booking, 'schedule_daily_display'),
            'event_name' => $this->text($record->event_name),
            'classification_of_event' => $this->text($record->classification_of_event ?: $record->event_category),
            'type_of_event' => $this->text($record->mice_type_of_event ?: $record->type_of_event),
            'foreign_attendees' => (int) ($record->foreign_attendees ?? 0),
            'domestic_attendees' => (int) ($record->domestic_attendees ?? 0),
            'total_number_of_countries' => (int) ($record->total_number_of_countries ?? 0),
            'countries_breakdown_text' => $this->countriesBreakdown($record),
            'has_exhibitions' => (bool) $record->has_exhibitions,
            'exhibitors_count' => (int) ($record->exhibitors_count ?? 0),
            'visitors_count' => (int) ($record->visitors_count ?? 0),
            'organization_name' => $this->text($record->organizer_organization_name ?: $record->organization_name),
            'organizer_address' => $this->text($record->organizer_address ?: $record->address),
            'contact_person' => $this->text($record->organizer_contact_person ?: $record->contact_person),
            'contact_number' => $this->text($record->organizer_contact_number ?: $record->contact_number),
            'email' => $this->text($record->email),
            'comments_feedback' => $this->text($record->comments_feedback ?: $record->remarks ?: 'N/A'),
            'finalized_at' => $this->dateTime($record->finalized_at),
            'draft_expires_at' => $this->dateTime($record->draft_expires_at),
        ];
    }

    private function approval(Booking $booking): array
    {
        return [
            'confirmed_at' => $this->dateTime($booking->confirmed_at),
            'declined_at' => $this->dateTime($booking->declined_at),
            'cancelled_at' => $this->dateTime($booking->cancelled_at),
            'completed_at' => $this->dateTime($booking->completed_at),
            'cancellation_penalty_rate' => (float) ($booking->cancellation_penalty_rate ?? 0),
            'cancellation_penalty_amount' => $this->money($booking->cancellation_penalty_amount ?? 0),
            'bond_paid_at' => $this->dateTime($booking->bond_paid_at),
            'bond_waived_at' => $this->dateTime($booking->bond_waived_at),
            'bond_waiver_reason' => $this->text($booking->bond_waiver_reason),
        ];
    }

    private function countriesBreakdown(MiceRecord $record): string
    {
        if (filled($record->countries_breakdown_text)) {
            return (string) $record->countries_breakdown_text;
        }

        $countries = is_array($record->countries_breakdown ?? null) ? $record->countries_breakdown : [];

        if ($countries === []) {
            return $this->text($record->main_origin_country ?: 'Philippines');
        }

        return collect($countries)
            ->map(function ($row) {
                if (is_array($row)) {
                    $country = $row['country'] ?? $row['name'] ?? null;
                    $count = $row['count'] ?? $row['participants'] ?? null;
                    return trim($country . ($count !== null ? ' (' . $count . ')' : ''));
                }

                return (string) $row;
            })
            ->filter()
            ->implode(', ');
    }

    private function roleFromRoute(Request $request): string
    {
        $routeName = (string) optional($request->route())->getName();

        return match (true) {
            str_starts_with($routeName, 'admin.') => 'admin',
            str_starts_with($routeName, 'manager.') => 'manager',
            str_starts_with($routeName, 'staff.') => 'staff',
            str_starts_with($routeName, 'user.') => 'user',
            default => 'workspace',
        };
    }

    private function text(mixed $value, string $fallback = '—'): string
    {
        if ($value === null) {
            return $fallback;
        }

        $text = trim((string) $value);

        return $text !== '' ? $text : $fallback;
    }

    private function dateTime(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            return Carbon::parse($value)->toIso8601String();
        } catch (\Throwable) {
            return null;
        }
    }

    private function date(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function roundMoney(float $value): float
    {
        return round($value, 2);
    }

    private function money(mixed $value): float
    {
        if ($value === null || $value === '') {
            return 0.0;
        }

        if (is_numeric($value)) {
            return round((float) $value, 2);
        }

        $clean = preg_replace('/[^0-9.\-]/', '', (string) $value);

        return $clean !== '' && is_numeric($clean) ? round((float) $clean, 2) : 0.0;
    }

    private function peso(float $value): string
    {
        return "\u{20B1}" . number_format($this->roundMoney($value), 2);
    }
}
