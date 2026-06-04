<?php

namespace App\Support;

class BcccPrintableDocumentCatalog
{
    public const RESERVATION_SUMMARY = 'reservation_summary';
    public const FINAL_BILL = 'final_bill';
    public const CANCELLATION_ASSESSMENT = 'cancellation_assessment';
    public const MICE_SUMMARY = 'mice_summary';

    public static function documents(): array
    {
        return [
            self::RESERVATION_SUMMARY => [
                'label' => 'Reservation Summary',
                'description' => 'Official-style reservation request summary for client review, staff checking, and records filing.',
                'print_code' => 'BCCC-RES',
            ],
            self::FINAL_BILL => [
                'label' => 'Final Billing Statement',
                'description' => 'Final billing view showing venue charges, hidden discount breakdown, bond, payments, and balance.',
                'print_code' => 'BCCC-BILL',
            ],
            self::CANCELLATION_ASSESSMENT => [
                'label' => 'Cancellation Assessment',
                'description' => 'Assessment sheet for cancellation timing, penalty rate, penalty amount, and remarks.',
                'print_code' => 'BCCC-CANCEL',
            ],
            self::MICE_SUMMARY => [
                'label' => 'MICE Report Summary',
                'description' => 'Booking-linked MICE/contact summary for report review and filing.',
                'print_code' => 'BCCC-MICE',
            ],
        ];
    }

    public static function meta(string $type): array
    {
        $normalized = self::normalize($type);

        return self::documents()[$normalized] ?? self::documents()[self::RESERVATION_SUMMARY];
    }

    public static function normalize(?string $type): string
    {
        $type = strtolower(trim((string) $type));
        $type = str_replace(['-', ' '], '_', $type);

        return match ($type) {
            'bill', 'billing', 'final_bill', 'final_billing', 'final_billing_statement' => self::FINAL_BILL,
            'cancel', 'cancellation', 'cancellation_assessment' => self::CANCELLATION_ASSESSMENT,
            'mice', 'mice_report', 'mice_summary' => self::MICE_SUMMARY,
            default => self::RESERVATION_SUMMARY,
        };
    }

    public static function policyNotes(string $type): array
    {
        $type = self::normalize($type);

        $base = [
            'Only Full Hall, Main Hall, LED Wall, Lounge, and Boardroom are active booking charge choices in BCCC EASE.',
            'Lobby use is included with Full Hall and is not billed as a separate user-facing charge.',
            'Basement areas, shop rentals, catering maintenance fee, air-conditioning charge, stationery kit, and ordinance special packages are not exposed as booking charges in this system scope.',
            'Discounts are hidden during schedule/service selection and are shown only during final computation, administrative billing, and official record views.',
            'Reservations remain subject to BCCC assessment, availability verification, and authorized approval.',
        ];

        return match ($type) {
            self::FINAL_BILL => array_merge($base, [
                'The booking is confirmed only after required payment review and acceptance according to BCCC policy.',
                'A PHP 10,000.00 bond may be required before the event unless waived for qualified official city activities.',
                'Post-event charges may be assessed for damages, house-rule violations, extra use, or unpaid balances.',
            ]),
            self::CANCELLATION_ASSESSMENT => array_merge($base, [
                'Cancellation penalties are computed from the event start date and the cancellation date/time.',
                'Final cancellation action must be recorded by authorized BCCC personnel for audit purposes.',
            ]),
            self::MICE_SUMMARY => array_merge($base, [
                'MICE details are kept as draft data until the booking reaches accepted/confirmed status.',
                'Private/personal events skip public tourism statistical fields and store skipped values as required by the configured MICE workflow.',
            ]),
            default => $base,
        };
    }
}
