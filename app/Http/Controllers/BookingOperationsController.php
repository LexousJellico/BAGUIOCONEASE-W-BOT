<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingLifecycleEvent;
use App\Models\BookingPayment;
use App\Services\BookingService;
use App\Support\WorkspaceAccess;
use App\Support\WorkspacePage;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BookingOperationsController extends Controller
{
    private const CONFIRMED_PAYMENT_STATUSES = [
        'confirmed',
        'verified',
        'paid',
    ];

    private const SUBMITTED_PAYMENT_STATUSES = [
        'pending',
        'confirmed',
        'verified',
        'paid',
    ];

    public function index(Request $request): Response
    {
        Gate::authorize('bookings.view');

        $filters = [
            'q' => trim((string) $request->string('q')->value('')),
            'booking_status' => trim((string) $request->string('booking_status')->value('')),
            'payment_status' => trim((string) $request->string('payment_status')->value('')),
            'risk' => trim((string) $request->string('risk')->value('')),
            'attention' => trim((string) $request->string('attention')->value('')),
            'gateway' => trim((string) $request->string('gateway')->value('')),
        ];

        $baseQuery = Booking::query()
            ->with([
                'bookingServices.service.serviceType',
                'payments' => fn ($query) => $query->latest('created_at'),
                'createdBy',
            ])
            ->latest('created_at');

        $this->applyDirectFilters($baseQuery, $filters);

        $bookings = $baseQuery
            ->get()
            ->filter(fn (Booking $booking) => $this->matchesDerivedFilters($booking, $filters))
            ->values();

        $paginated = $this->paginateCollection(
            $bookings,
            max(1, (int) $request->integer('page', 1)),
            10,
            $request,
        );

        $paginated->setCollection(
            $paginated
                ->getCollection()
                ->map(fn (Booking $booking) => $this->transformBooking($booking))
                ->values()
        );

        $visibleIds = $bookings
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $pendingPayments = empty($visibleIds)
            ? collect()
            : BookingPayment::query()
                ->with(['booking'])
                ->whereIn('status', ['pending', 'submitted', 'for_review'])
                ->whereIn('booking_id', $visibleIds)
                ->latest('created_at')
                ->limit(8)
                ->get()
                ->map(fn (BookingPayment $payment) => $this->transformPayment($payment))
                ->values();

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/operations'), [
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
            'filters' => $filters,
            'bookings' => $paginated,
            'summary' => $this->summarizeBookings($bookings),
            'pendingPayments' => $pendingPayments,
            'automationEvents' => $this->automationEvents($filters),
        ]);
    }

    public function approvePayment(
        Request $request,
        BookingPayment $payment,
        BookingService $bookingService,
    ): RedirectResponse {
        Gate::authorize('payments.manage');

        $data = $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $status = strtolower((string) $payment->status);

        if (! in_array($status, ['pending', 'failed', 'declined'], true)) {
            return back()->with('error', 'Only pending, failed, or declined payments can be approved.');
        }

        DB::transaction(function () use ($data, $payment, $bookingService) {
            $payment->forceFill([
                'status' => 'confirmed',
                'remarks' => $this->mergeRemarks(
                    $payment->remarks,
                    trim((string) ($data['remarks'] ?? 'Approved from operations center.')),
                ),
                'paid_at' => $payment->paid_at ?: now(),
                'verified_at' => $payment->verified_at ?: now(),
                'approved_at' => $payment->approved_at ?: now(),
                'declined_at' => null,
                'failed_at' => null,
            ])->save();

            $this->refreshBookingPaymentStatus($payment, $bookingService);
        });

        return back()->with('success', 'Payment approved successfully.');
    }

    public function declinePayment(
        Request $request,
        BookingPayment $payment,
        BookingService $bookingService,
    ): RedirectResponse {
        Gate::authorize('payments.manage');

        $data = $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $status = strtolower((string) $payment->status);

        if (! in_array($status, ['pending', 'failed'], true)) {
            return back()->with('error', 'Only pending or failed payments can be declined.');
        }

        DB::transaction(function () use ($data, $payment, $bookingService) {
            $payment->forceFill([
                'status' => 'declined',
                'remarks' => $this->mergeRemarks(
                    $payment->remarks,
                    trim((string) ($data['remarks'] ?? 'Declined from operations center.')),
                ),
                'declined_at' => now(),
                'failed_at' => null,
            ])->save();

            $this->refreshBookingPaymentStatus($payment, $bookingService);
        });

        return back()->with('success', 'Payment declined successfully.');
    }

    public function failPayment(
        Request $request,
        BookingPayment $payment,
        BookingService $bookingService,
    ): RedirectResponse {
        Gate::authorize('payments.manage');

        $data = $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $status = strtolower((string) $payment->status);

        if (! in_array($status, ['pending', 'declined'], true)) {
            return back()->with('error', 'Only pending or declined payments can be marked as failed.');
        }

        DB::transaction(function () use ($data, $payment, $bookingService) {
            $payment->forceFill([
                'status' => 'failed',
                'remarks' => $this->mergeRemarks(
                    $payment->remarks,
                    trim((string) ($data['remarks'] ?? 'Marked failed from operations center.')),
                ),
                'failed_at' => now(),
                'declined_at' => null,
            ])->save();

            $this->refreshBookingPaymentStatus($payment, $bookingService);
        });

        return back()->with('success', 'Payment marked as failed.');
    }

    protected function applyDirectFilters(Builder $query, array $filters): void
    {
        $query->when($filters['q'] ?? null, function (Builder $builder, string $search) {
            $builder->where(function (Builder $nested) use ($search) {
                $nested
                    ->where('client_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('client_email', 'like', "%{$search}%")
                    ->orWhere('client_contact_number', 'like', "%{$search}%")
                    ->orWhere('type_of_event', 'like', "%{$search}%")
                    ->orWhereHas('payments', function (Builder $payments) use ($search) {
                        $payments
                            ->where('transaction_reference', 'like', "%{$search}%")
                            ->orWhere('payer_name', 'like', "%{$search}%")
                            ->orWhere('remarks', 'like', "%{$search}%");
                    });
            });
        });

        $query->when(
            $filters['booking_status'] ?? null,
            fn (Builder $builder, string $value) => $builder->where('booking_status', $value),
        );

        $query->when(
            $filters['payment_status'] ?? null,
            fn (Builder $builder, string $value) => $builder->where('payment_status', $value),
        );

        $query->when($filters['gateway'] ?? null, function (Builder $builder, string $gateway) {
            $builder->whereHas(
                'payments',
                fn (Builder $paymentQuery) => $paymentQuery->where('payment_gateway', $gateway),
            );
        });

        if (($filters['attention'] ?? '') === '') {
            return;
        }

        $attention = $filters['attention'];

        if ($attention === 'needs_review') {
            $query->whereHas('payments', fn (Builder $payments) => $payments->whereIn('status', ['pending', 'submitted', 'for_review']));
            return;
        }

        if ($attention === 'with_proof') {
            $query->whereHas('payments', fn (Builder $payments) => $payments->whereNotNull('proof_image_path'));
            return;
        }

        if ($attention === 'without_proof') {
            $query->whereDoesntHave('payments', fn (Builder $payments) => $payments->whereNotNull('proof_image_path'));
            return;
        }

        if ($attention === 'outstanding') {
            $query->where(function (Builder $bookingQuery) {
                $bookingQuery
                    ->whereNull('payment_status')
                    ->orWhereIn('payment_status', ['unpaid', 'partial', 'owing']);
            });
        }
    }

    protected function matchesDerivedFilters(Booking $booking, array $filters): bool
    {
        $deadline = $this->deadlineStateFromModel($booking);

        if (($filters['risk'] ?? '') !== '' && ($deadline['risk'] ?? '') !== $filters['risk']) {
            return false;
        }

        return true;
    }

    protected function transformBooking(Booking $booking): array
    {
        $items = $this->bookingItems($booking);
        $itemsTotal = $this->itemsTotal($booking);
        $submittedTotal = $this->submittedPaymentsTotal($booking);
        $confirmedTotal = $this->confirmedPaymentsTotal($booking);
        $deadline = $this->deadlineState($booking, $itemsTotal, $submittedTotal, $confirmedTotal);

        $latestPayment = collect($booking->payments ?? [])->first();

        return [
            'id' => $booking->id,
            'client_name' => $booking->client_name,
            'company_name' => $booking->company_name,
            'client_email' => $booking->client_email,
            'client_contact_number' => $booking->client_contact_number,
            'type_of_event' => $booking->type_of_event,
            'booking_status' => $booking->booking_status,
            'payment_status' => $booking->payment_status,
            'booking_date_from' => optional($booking->booking_date_from)->toIso8601String(),
            'booking_date_to' => optional($booking->booking_date_to)->toIso8601String(),
            'created_at' => optional($booking->created_at)->toIso8601String(),
            'created_by_name' => $booking->createdBy?->name,
            'items' => $items,
            'latest_payment' => $latestPayment ? $this->transformPayment($latestPayment, false) : null,
            'totals' => [
                'items_total' => round($itemsTotal, 2),
                'submitted_payments_total' => round($submittedTotal, 2),
                'confirmed_payments_total' => round($confirmedTotal, 2),
                'remaining_balance' => round(max(0, $itemsTotal - $confirmedTotal), 2),
                'down_payment_required' => $itemsTotal > 0 ? round($itemsTotal * 0.5, 2) : 0.0,
            ],
            'deadline' => $deadline,
        ];
    }

    protected function transformPayment(BookingPayment $payment, bool $includeBooking = true): array
    {
        return [
            'id' => $payment->id,
            'amount' => (float) $payment->amount,
            'status' => $payment->status,
            'payment_gateway' => $payment->payment_gateway,
            'payment_method' => $payment->payment_method,
            'payment_type' => $payment->payment_type,
            'transaction_reference' => $payment->transaction_reference,
            'payer_name' => $payment->payer_name,
            'proof_image_url' => $payment->proof_image_url,
            'created_at' => optional($payment->created_at)->toIso8601String(),
            'paid_at' => optional($payment->paid_at)->toIso8601String(),
            'verified_at' => optional($payment->verified_at)->toIso8601String(),
            'approved_at' => optional($payment->approved_at)->toIso8601String(),
            'declined_at' => optional($payment->declined_at)->toIso8601String(),
            'failed_at' => optional($payment->failed_at)->toIso8601String(),
            'booking' => $includeBooking && $payment->booking ? [
                'id' => $payment->booking->id,
                'client_name' => $payment->booking->client_name,
                'company_name' => $payment->booking->company_name,
                'booking_status' => $payment->booking->booking_status,
                'payment_status' => $payment->booking->payment_status,
            ] : null,
        ];
    }

    protected function summarizeBookings(Collection $bookings): array
    {
        $visible = $bookings->count();
        $reviewNeeded = 0;
        $dueSoon = 0;
        $overdue = 0;
        $outstandingTotal = 0.0;
        $submittedTotal = 0.0;
        $confirmedTotal = 0.0;

        foreach ($bookings as $booking) {
            $itemsTotal = $this->itemsTotal($booking);
            $submitted = $this->submittedPaymentsTotal($booking);
            $confirmed = $this->confirmedPaymentsTotal($booking);

            $submittedTotal += $submitted;
            $confirmedTotal += $confirmed;
            $outstandingTotal += max(0, $itemsTotal - $confirmed);

            if ($this->hasPendingPaymentReview($booking)) {
                $reviewNeeded++;
            }

            $deadline = $this->deadlineState($booking, $itemsTotal, $submitted, $confirmed);

            if (($deadline['risk'] ?? '') === 'due_soon') {
                $dueSoon++;
            } elseif (($deadline['risk'] ?? '') === 'overdue') {
                $overdue++;
            }
        }

        return [
            'visible' => $visible,
            'review_needed' => $reviewNeeded,
            'due_soon' => $dueSoon,
            'overdue' => $overdue,
            'submitted_total' => round($submittedTotal, 2),
            'confirmed_total' => round($confirmedTotal, 2),
            'outstanding_total' => round($outstandingTotal, 2),
        ];
    }

    protected function deadlineStateFromModel(Booking $booking): array
    {
        return $this->deadlineState(
            $booking,
            $this->itemsTotal($booking),
            $this->submittedPaymentsTotal($booking),
            $this->confirmedPaymentsTotal($booking),
        );
    }

    protected function deadlineState(
        Booking $booking,
        float $itemsTotal,
        float $submittedTotal,
        float $confirmedTotal,
    ): array {
        $createdAt = $booking->created_at instanceof Carbon
            ? $booking->created_at->copy()
            : ($booking->created_at ? Carbon::parse($booking->created_at) : now());

        $downRequired = $itemsTotal > 0 ? round($itemsTotal * 0.5, 2) : 0.0;
        $downDeadline = $createdAt->copy()->addHours(24);
        $fullDeadline = $createdAt->copy()->addHours(48);
        $now = now();

        if (in_array((string) $booking->booking_status, ['cancelled', 'declined', 'completed'], true)) {
            return [
                'risk' => 'closed',
                'label' => 'Closed',
                'recommended' => 'This booking is no longer inside the payment-rule watch list.',
                'down_deadline' => $downDeadline->toIso8601String(),
                'full_deadline' => $fullDeadline->toIso8601String(),
                'down_required' => $downRequired,
                'submitted_total' => round($submittedTotal, 2),
                'confirmed_total' => round($confirmedTotal, 2),
            ];
        }

        if ($itemsTotal <= 0) {
            return [
                'risk' => 'normal',
                'label' => 'No payment gate',
                'recommended' => 'This booking has no billable amount blocking schedule progress.',
                'down_deadline' => $downDeadline->toIso8601String(),
                'full_deadline' => $fullDeadline->toIso8601String(),
                'down_required' => $downRequired,
                'submitted_total' => round($submittedTotal, 2),
                'confirmed_total' => round($confirmedTotal, 2),
            ];
        }

        $risk = 'normal';
        $label = 'On track';
        $recommended = 'No immediate action required.';

        if ($confirmedTotal + 0.00001 < $downRequired) {
            if ($downDeadline->isPast()) {
                $risk = 'overdue';
                $label = $submittedTotal > $confirmedTotal ? '24H awaiting review' : '24H overdue';
                $recommended = $submittedTotal > $confirmedTotal
                    ? 'A payment was submitted but is still pending review. Confirm or reject it immediately.'
                    : 'Review immediately. 50% down payment was not confirmed within the first 24 hours.';
            } elseif ($now->lte($downDeadline) && $now->diffInHours($downDeadline) <= 6) {
                $risk = 'due_soon';
                $label = '24H due soon';
                $recommended = 'Follow up now. The booking is still waiting for the required 50% confirmed down payment.';
            } else {
                $risk = 'watch';
                $label = 'Awaiting 50%';
                $recommended = 'Monitor the initial down payment window.';
            }
        } elseif ($confirmedTotal + 0.00001 < $itemsTotal) {
            if ($fullDeadline->isPast()) {
                $risk = 'overdue';
                $label = $submittedTotal > $confirmedTotal ? '48H awaiting review' : '48H overdue';
                $recommended = $submittedTotal > $confirmedTotal
                    ? 'A remaining payment was submitted but is still pending review. Resolve it immediately.'
                    : 'Review immediately. The booking has not reached full confirmed compliance within 48 hours.';
            } elseif ($now->lte($fullDeadline) && $now->diffInHours($fullDeadline) <= 8) {
                $risk = 'due_soon';
                $label = '48H due soon';
                $recommended = 'Follow up for the remaining balance before the final payment window closes.';
            } else {
                $risk = 'watch';
                $label = 'Balance pending';
                $recommended = 'The 50% threshold is met, but the booking still has an outstanding balance.';
            }
        } else {
            $risk = 'normal';
            $label = 'Payment covered';
            $recommended = 'Confirmed payment already satisfies the current automation thresholds.';
        }

        return [
            'risk' => $risk,
            'label' => $label,
            'recommended' => $recommended,
            'down_deadline' => $downDeadline->toIso8601String(),
            'full_deadline' => $fullDeadline->toIso8601String(),
            'down_required' => $downRequired,
            'submitted_total' => round($submittedTotal, 2),
            'confirmed_total' => round($confirmedTotal, 2),
        ];
    }

    protected function automationEvents(array $filters): Collection
    {
        if (! class_exists(BookingLifecycleEvent::class)) {
            return collect();
        }

        return BookingLifecycleEvent::query()
            ->with(['booking', 'actor:id,name,email'])
            ->when(($filters['booking_status'] ?? '') !== '', function (Builder $query) use ($filters) {
                $status = $filters['booking_status'];

                $query->where(function (Builder $nested) use ($status) {
                    $nested
                        ->where('to_status', $status)
                        ->orWhere('from_status', $status);
                });
            })
            ->when(($filters['payment_status'] ?? '') !== '', function (Builder $query) use ($filters) {
                $status = $filters['payment_status'];

                $query->where(function (Builder $nested) use ($status) {
                    $nested
                        ->where('to_payment_status', $status)
                        ->orWhere('from_payment_status', $status);
                });
            })
            ->when(($filters['q'] ?? '') !== '', function (Builder $query) use ($filters) {
                $search = '%' . $filters['q'] . '%';

                $query->where(function (Builder $nested) use ($search) {
                    $nested
                        ->where('title', 'like', $search)
                        ->orWhere('reason', 'like', $search)
                        ->orWhere('event_key', 'like', $search)
                        ->orWhereHas('actor', function (Builder $actor) use ($search) {
                            $actor
                                ->where('name', 'like', $search)
                                ->orWhere('email', 'like', $search);
                        });
                });
            })
            ->latest('event_at')
            ->limit(10)
            ->get()
            ->map(function (BookingLifecycleEvent $event) {
                return [
                    'id' => $event->id,
                    'event_key' => $event->event_key,
                    'title' => $event->title,
                    'reason' => $event->reason,
                    'from_status' => $event->from_status,
                    'to_status' => $event->to_status,
                    'from_payment_status' => $event->from_payment_status,
                    'to_payment_status' => $event->to_payment_status,
                    'event_at' => optional($event->event_at ?? $event->created_at)->toIso8601String(),
                    'meta' => $event->meta,
                    'actor' => $event->actor ? [
                        'id' => $event->actor->id,
                        'name' => $event->actor->name,
                        'email' => $event->actor->email,
                    ] : null,
                    'booking' => $event->booking ? [
                        'id' => $event->booking->id,
                        'client_name' => $event->booking->client_name,
                        'company_name' => $event->booking->company_name,
                    ] : null,
                ];
            })
            ->values();
    }

    protected function bookingItems(Booking $booking): array
    {
        return collect($booking->bookingServices ?? [])
            ->map(function ($item) {
                $service = $item->service;
                $serviceType = $service?->serviceType;
                $quantity = max(1, (int) ($item->quantity ?? 1));
                $unitPrice = (float) ($item->unit_price ?? $item->price ?? $service?->price ?? 0);

                return [
                    'id' => $item->id,
                    'service_id' => $item->service_id,
                    'service_name' => $service?->name,
                    'area' => $serviceType?->name,
                    'quantity' => $quantity,
                    'unit_price' => round($unitPrice, 2),
                    'line_total' => round($unitPrice * $quantity, 2),
                ];
            })
            ->values()
            ->all();
    }

    protected function itemsTotal(Booking $booking): float
    {
        return collect($this->bookingItems($booking))
            ->reduce(fn (float $sum, array $item) => $sum + (float) ($item['line_total'] ?? 0), 0.0);
    }

    protected function submittedPaymentsTotal(Booking $booking): float
    {
        return collect($booking->payments ?? [])
            ->filter(fn ($payment) => in_array(
                strtolower((string) ($payment->status ?? '')),
                self::SUBMITTED_PAYMENT_STATUSES,
                true,
            ))
            ->reduce(fn (float $sum, $payment) => $sum + (float) ($payment->amount ?? 0), 0.0);
    }

    protected function confirmedPaymentsTotal(Booking $booking): float
    {
        return collect($booking->payments ?? [])
            ->filter(fn ($payment) => in_array(
                strtolower((string) ($payment->status ?? '')),
                self::CONFIRMED_PAYMENT_STATUSES,
                true,
            ))
            ->reduce(fn (float $sum, $payment) => $sum + (float) ($payment->amount ?? 0), 0.0);
    }

    protected function hasPendingPaymentReview(Booking $booking): bool
    {
        return collect($booking->payments ?? [])
            ->contains(fn ($payment) => strtolower((string) ($payment->status ?? '')) === 'pending');
    }

    protected function refreshBookingPaymentStatus(BookingPayment $payment, BookingService $bookingService): void
    {
        $booking = $payment->booking;

        if (! $booking) {
            return;
        }

        $bookingService->recalculatePaymentStatus(
            $booking->fresh(['bookingServices.service', 'payments'])
        );
    }

    protected function paginateCollection(
        Collection $items,
        int $page,
        int $perPage,
        Request $request,
    ): LengthAwarePaginator {
        $page = max(1, $page);
        $results = $items->forPage($page, $perPage)->values();

        return new LengthAwarePaginator(
            $results,
            $items->count(),
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ],
        );
    }

    protected function mergeRemarks(?string $existing, string $message): string
    {
        $existing = trim((string) $existing);
        $message = trim($message);

        if ($message === '') {
            $message = 'Updated from operations center.';
        }

        if ($existing === '') {
            return '[' . now()->format('Y-m-d H:i') . '] ' . $message;
        }

        return $existing . "\n" . '[' . now()->format('Y-m-d H:i') . '] ' . $message;
    }
}
