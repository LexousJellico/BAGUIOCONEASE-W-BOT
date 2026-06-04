<?php

namespace App\Http\Controllers;

use App\Models\BookingPayment;
use App\Services\NotificationService;
use App\Services\PaymentReviewService;
use App\Support\WorkspacePage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class PaymentReviewController extends Controller
{
    public function __construct(private readonly NotificationService $notifications)
    {
    }

    public function index(Request $request, PaymentReviewService $service): Response
    {
        $query = BookingPayment::query()
            ->with([
                'booking',
                'booking.service',
                'booking.service.serviceType',
                'booking.payments',
                'booking.bookingServices',
            ])
            ->latest();

        if ($request->filled('q')) {
            $search = trim((string) $request->input('q'));

            $query->where(function ($builder) use ($search): void {
                foreach ([
                    'transaction_reference',
                    'reference_number',
                    'payment_method',
                    'payment_gateway',
                    'payment_type',
                    'status',
                    'payment_status',
                    'remarks',
                ] as $column) {
                    if (Schema::hasColumn('booking_payments', $column)) {
                        $builder->orWhere($column, 'like', "%{$search}%");
                    }
                }

                $builder->orWhereHas('booking', function ($bookingQuery) use ($search): void {
                    foreach ([
                        'client_name',
                        'company_name',
                        'client_email',
                        'type_of_event',
                        'booking_status',
                        'payment_status',
                    ] as $column) {
                        if (Schema::hasColumn('bookings', $column)) {
                            $bookingQuery->orWhere($column, 'like', "%{$search}%");
                        }
                    }
                });
            });
        }

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();

            $query->where(function ($builder) use ($status): void {
                if (Schema::hasColumn('booking_payments', 'status')) {
                    $builder->orWhere('status', $status);
                }

                if (Schema::hasColumn('booking_payments', 'payment_status')) {
                    $builder->orWhere('payment_status', $status);
                }
            });
        } else {
            $query->where(function ($builder): void {
                $reviewStatuses = [
                    'pending',
                    'submitted',
                    'for_review',
                    'for review',
                    'awaiting_review',
                    'awaiting review',
                ];

                if (Schema::hasColumn('booking_payments', 'status')) {
                    $builder->orWhereIn('status', $reviewStatuses);
                }

                if (Schema::hasColumn('booking_payments', 'payment_status')) {
                    $builder->orWhereIn('payment_status', $reviewStatuses);
                }
            });
        }

        $payments = $query
            ->paginate(12)
            ->withQueryString()
            ->through(fn (BookingPayment $payment): array => $this->serializePayment($request, $payment, $service));

        return Inertia::render(WorkspacePage::resolve($request, 'admin/payments/review'), [
            'workspaceRole' => $this->workspaceRole($request),
            'payments' => $payments,
            'filters' => [
                'q' => $request->input('q', ''),
                'status' => $request->input('status', ''),
            ],
        ]);
    }

    public function update(
        Request $request,
        BookingPayment $payment,
        PaymentReviewService $service
    ): RedirectResponse {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:approved,rejected'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validated['status'] === 'approved') {
            $reviewed = $service->approve($payment, $request->user()?->id);
            $reviewed->loadMissing('booking');
            $this->notifications->paymentReviewed($reviewed, $reviewed->booking, $request->user(), 'approved');
            $this->notifyBookingIfPaymentCompleted($reviewed, $request);

            return back()->with('success', 'Payment proof approved successfully.');
        }

        $reviewed = $service->reject(
            payment: $payment,
            userId: $request->user()?->id,
            remarks: $validated['remarks'] ?? null
        );
        $reviewed->loadMissing('booking');
        $this->notifications->paymentReviewed($reviewed, $reviewed->booking, $request->user(), 'rejected', $validated['remarks'] ?? null);

        return back()->with('success', 'Payment proof rejected successfully.');
    }

    public function approve(
        Request $request,
        BookingPayment $payment,
        PaymentReviewService $service
    ): RedirectResponse {
        $reviewed = $service->approve($payment, $request->user()?->id);
        $reviewed->loadMissing('booking');
        $this->notifications->paymentReviewed($reviewed, $reviewed->booking, $request->user(), 'approved');
        $this->notifyBookingIfPaymentCompleted($reviewed, $request);

        return back()->with('success', 'Payment proof approved successfully.');
    }

    public function reject(
        Request $request,
        BookingPayment $payment,
        PaymentReviewService $service
    ): RedirectResponse {
        $validated = $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $reviewed = $service->reject(
            payment: $payment,
            userId: $request->user()?->id,
            remarks: $validated['remarks'] ?? null
        );
        $reviewed->loadMissing('booking');
        $this->notifications->paymentReviewed($reviewed, $reviewed->booking, $request->user(), 'rejected', $validated['remarks'] ?? null);

        return back()->with('success', 'Payment proof rejected successfully.');
    }

    private function notifyBookingIfPaymentCompleted(BookingPayment $payment, Request $request): void
    {
        $booking = $payment->booking;

        if (! $booking) {
            return;
        }

        $bookingStatus = strtolower(str_replace(['-', ' '], '_', (string) ($booking->booking_status ?? '')));
        $paymentStatus = strtolower(str_replace(['-', ' '], '_', (string) ($booking->payment_status ?? '')));

        if (in_array($bookingStatus, ['confirmed', 'approved', 'active'], true) && in_array($paymentStatus, ['paid', 'approved', 'settled'], true)) {
            $this->notifications->bookingApprovedAfterPayment($booking, $request->user());
        }
    }

    private function serializePayment(Request $request, BookingPayment $payment, PaymentReviewService $service): array
    {
        $booking = $payment->booking;

        return [
            'id' => $payment->id,
            'booking_id' => $payment->booking_id,
            'amount' => $payment->amount ?? 0,
            'status' => $payment->status ?? $payment->payment_status ?? 'pending',
            'payment_status' => $payment->payment_status ?? $payment->status ?? 'pending',
            'payment_method' => $this->safeAttribute($payment, 'payment_method'),
            'payment_gateway' => $this->safeAttribute($payment, 'payment_gateway'),
            'payment_type' => $this->safeAttribute($payment, 'payment_type'),
            'transaction_reference' => $this->safeAttribute($payment, 'transaction_reference'),
            'reference_number' => $this->safeAttribute($payment, 'reference_number'),
            'proof_image_url' => $this->paymentProofUrl($request, $payment),
            'proof_image' => $this->safeAttribute($payment, 'proof_image'),
            'receipt_url' => $this->safeAttribute($payment, 'receipt_url'),
            'remarks' => $this->safeAttribute($payment, 'remarks'),
            'created_at' => optional($payment->created_at)->toDateTimeString(),
            'updated_at' => optional($payment->updated_at)->toDateTimeString(),
            'booking' => $booking ? $this->serializeBooking($booking, $service) : null,
        ];
    }

    private function serializeBooking($booking, PaymentReviewService $service): array
    {
        $itemsTotal = $service->bookingTotalCharges($booking);
        $confirmedPayments = $service->approvedPaymentTotal($booking);
        $submittedPayments = $service->submittedPaymentTotal($booking);

        return [
            'id' => $booking->id,
            'client_name' => $booking->client_name,
            'company_name' => $booking->company_name,
            'client_email' => $booking->client_email,
            'type_of_event' => $booking->type_of_event,
            'booking_status' => $booking->booking_status,
            'payment_status' => $booking->payment_status,
            'booking_date_from' => optional($booking->booking_date_from)->toDateTimeString(),
            'booking_date_to' => optional($booking->booking_date_to)->toDateTimeString(),

            'expired_at' => optional($booking->expired_at)->toDateTimeString(),
            'payment_balance_due_at' => optional($booking->payment_balance_due_at)->toDateTimeString(),
            'auto_declined_at' => optional($booking->auto_declined_at)->toDateTimeString(),
            'auto_decline_reason' => $booking->auto_decline_reason,

            'deadline_at' => $booking->deadline_at,
            'deadline_state' => $booking->deadline_state,
            'deadline_label' => $booking->deadline_label,

            'service' => $booking->service ? [
                'id' => $booking->service->id,
                'name' => $booking->service->name ?? null,
                'service_type' => $booking->service->serviceType ? [
                    'id' => $booking->service->serviceType->id,
                    'name' => $booking->service->serviceType->name ?? null,
                ] : null,
                'serviceType' => $booking->service->serviceType ? [
                    'id' => $booking->service->serviceType->id,
                    'name' => $booking->service->serviceType->name ?? null,
                ] : null,
            ] : null,

            'totals' => [
                'items_total' => $itemsTotal,
                'payments_total' => $confirmedPayments,
                'submitted_payments_total' => $submittedPayments,
                'confirmed_payments_total' => $confirmedPayments,
                'remaining_balance' => max($itemsTotal - $confirmedPayments, 0),
            ],
        ];
    }

    private function paymentProofUrl(Request $request, BookingPayment $payment): ?string
    {
        if (filled($payment->proof_image_path) && filled($payment->booking_id) && filled($payment->id)) {
            try {
                $routeName = WorkspacePage::routeName($request, 'bookings.payments.proof');
                $base = route($routeName, [
                    'booking' => $payment->booking_id,
                    'payment' => $payment->id,
                ], false);
                $version = $payment->updated_at?->timestamp ?? $payment->created_at?->timestamp ?? time();

                return $base . '?v=' . $version;
            } catch (\Throwable) {
                // Fall through to legacy URLs below. Review should never break because a route cannot be resolved.
            }
        }

        foreach (['proof_image_url', 'receipt_url'] as $attribute) {
            if (filled($this->safeAttribute($payment, $attribute))) {
                return (string) $this->safeAttribute($payment, $attribute);
            }
        }

        foreach (['proof_image', 'receipt_path'] as $attribute) {
            $value = $this->safeAttribute($payment, $attribute);

            if (blank($value)) {
                continue;
            }

            $text = (string) $value;

            if (str_starts_with($text, 'http://') || str_starts_with($text, 'https://') || str_starts_with($text, '/')) {
                return $text;
            }

            return asset('storage/' . ltrim($text, '/'));
        }

        return null;
    }

    private function safeAttribute($model, string $key): mixed
    {
        return array_key_exists($key, $model->getAttributes()) ? $model->{$key} : null;
    }

    private function workspaceRole(Request $request): string
    {
        $path = $request->path();

        if (str_starts_with($path, 'manager/')) {
            return 'manager';
        }

        if (str_starts_with($path, 'staff/')) {
            return 'staff';
        }

        return 'admin';
    }
}
