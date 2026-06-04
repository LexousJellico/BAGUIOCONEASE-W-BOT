<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingPaymentRequest;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\StoreBookingMiceSurveyRequest;
use App\Http\Requests\UpdateBookingPaymentRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\ServiceResource;
use App\Http\Resources\ServiceTypeResource;
use App\Models\Booking;
use App\Models\BookingDraft;
use App\Models\BookingPayment;
use App\Models\MiceRecord;
use App\Models\Service;
use App\Models\ServiceType;
use App\Models\VenuePackageTemplate;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\NotificationService;
use App\Support\BookingStatusCatalog;
use App\Support\BookingScheduleCatalog;
use App\Support\DressingRoomCatalog;
use App\Support\MiceReportCatalog;
use App\Support\MiceRecordPayload;
use App\Support\VenueAreaCatalog;
use App\Support\ActiveVenueCatalog;
use App\Support\VenuePackageCatalog;
use App\Support\WorkspaceAccess;
use App\Support\WorkspacePage;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function __construct(
        private readonly BookingServiceInterface $bookings,
        private readonly NotificationService $notifications,
    ) {
    }

    public function index(Request $request): Response
    {
        abort_unless($request->user(), 403);

        $perPage = (int) $request->integer('per_page', 10);
        $perPage = max(5, min($perPage, 100));

        $rawFilters = $request->only([
            'booking_status',
            'status',
            'payment_status',
            'service_id',
            'q',
            'date_from',
            'date_to',
            'sort',
        ]);

        if (empty($rawFilters['booking_status']) && ! empty($rawFilters['status'])) {
            $rawFilters['booking_status'] = $rawFilters['status'];
        }

        $filters = WorkspaceAccess::isStaffLike($request)
            ? WorkspaceAccess::staffFilters($rawFilters)
            : WorkspaceAccess::clientSafeFilters($rawFilters);

        if (empty($filters['sort'])) {
            $filters['sort'] = WorkspaceAccess::isClient($request) ? 'newest' : 'upcoming';
        }

        $paginated = $this->bookings->paginate($filters, $perPage);

        $paginated->getCollection()->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
            'miceRecord',
            'scheduleSegments',
            'postEventCharges',
        ]);

        $statusCounts = $this->bookings->getStatusCounts($filters);

        $services = WorkspaceAccess::isStaffLike($request)
            ? ServiceResource::collection(
                Service::with('serviceType')->orderBy('name')->get()
            )->resolve($request)
            : [];

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/index'), [
            'bookings' => BookingResource::collection($paginated)
                ->response()
                ->getData(true),
            'services' => $services,
            'filters' => $filters,
            'statusCounts' => $statusCounts,
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
            'canCreateBooking' => WorkspaceAccess::canCreateBooking($request),
            'canManagePayments' => WorkspaceAccess::canManagePayments($request),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user(), 403);
        abort_unless(WorkspaceAccess::canCreateBooking($request), 403);

        $types = ServiceType::with([
            'services' => fn ($query) => $query
                ->with('serviceType')
                ->orderBy('name'),
        ])
            ->orderBy('name')
            ->get();

        $serviceTypesWithServices = ServiceTypeResource::collection($types)->resolve($request);

        $services = ServiceResource::collection(
            Service::with('serviceType')->orderBy('name')->get()
        )->resolve($request);

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/create'), [
            'serviceTypes' => $serviceTypesWithServices,
            'services' => $services,
            'venuePackages' => $this->venuePackageOptions(),
            'bookingFormOptions' => $this->bookingFormOptions(),
            'unavailableDates' => [],
            'initialSchedule' => $this->extractInitialSchedule($request),
            'initialPackageCode' => $this->extractInitialPackageCode($request),
            'initialAreaKeys' => $this->extractInitialAreaKeys($request),
            'initialVenue' => trim((string) $request->query('venue', $request->query('area', ''))) ?: null,
            'initialEventType' => trim((string) $request->query('event_type', '')) ?: null,
            'initialGuests' => $request->filled('guests') ? (int) $request->query('guests') : null,
            'latestDraft' => $this->latestBookingDraftPayload($request),
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
        ]);
    }

    public function store(StoreBookingRequest $request): RedirectResponse
    {
        abort_unless(WorkspaceAccess::canCreateBooking($request), 403);

        $data = $request->validated();

        /*
         * The old survey proof upload is no longer part of booking creation.
         * Every booking now continues to the built-in MICE report page.
         */
        unset(
            $data['survey_proof_image'],
            $data['survey_proof_image_path'],
            $data['survey_proof_image_name'],
            $data['survey_proof_image_mime']
        );

        if (WorkspaceAccess::isClient($request)) {
            $data = $this->forceClientBookingDefaults($request, $data);
        } elseif ($request->user()) {
            $data['created_by_user_id'] = $data['created_by_user_id'] ?? $request->user()->id;
        }

        $booking = $this->bookings->create($data);
        $this->saveOfficialMiceRecordFromBookingForm($request, $booking);
        $this->markBookingDraftSubmitted($request, $booking);

        return redirect()
            ->route(WorkspacePage::routeName($request, 'bookings.show'), $booking->id)
            ->with('success', 'Reservation submitted successfully. Your MICE report details were saved with the booking and the reservation is now pending review.');
    }

    public function survey(Request $request, Booking $booking): Response
    {
        $this->ensureBookingAccess($request, $booking);

        $booking->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
            'miceRecord',
            'scheduleSegments',
            'postEventCharges',
        ]);

        $record = MiceRecord::query()
            ->where('booking_id', $booking->id)
            ->first();

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/survey'), [
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
            'booking' => $this->bookingMicePayload($booking),
            'miceRecord' => $record ? $this->micePayload($record) : null,
            'defaults' => $this->miceDefaultsFromBooking($booking),
            'formOptions' => [
                ...$this->bookingFormOptions(),
                'eventCategories' => MiceReportCatalog::classificationOptions(),
                'eventTypes' => MiceReportCatalog::typeOptions(),
                'eventScopes' => MiceReportCatalog::eventScopeOptions(),
                'countries' => MiceReportCatalog::countryOptions(),
                'classificationInstructions' => MiceReportCatalog::classificationInstructions(),
                'eventTypeInstructions' => MiceReportCatalog::eventTypeInstructions(),
                'organizerTypes' => [
                    'Private',
                    'Government',
                    'NGO',
                    'Academe',
                    'Religious',
                    'Corporate',
                    'Association',
                    'Other',
                ],
                'enterpriseGroups' => [
                    'PTE',
                    'STE',
                    'UNCLASSIFIED',
                ],
            ],
        ]);
    }

    public function storeSurvey(StoreBookingMiceSurveyRequest $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);

        $booking->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'scheduleSegments',
            'postEventCharges',
        ]);

        $existing = MiceRecord::query()
            ->where('booking_id', $booking->id)
            ->first();

        $payload = MiceRecordPayload::fromRequest(
            $request->safe()->except('certified'),
            $booking,
            $request->user(),
        );

        $yearRecorded = (int) ($payload['year_recorded'] ?? now()->year);
        $payload['record_no'] = $existing?->record_no ?: $this->nextMiceRecordNumber($yearRecorded);
        $payload['updated_by_user_id'] = $request->user()?->id;
        $payload['submitted_at'] = now();

        if (! $existing) {
            $payload['submitted_by_user_id'] = $request->user()?->id;
        }

        $payload['status'] = 'submitted';
        $payload['draft_expires_at'] = null;
        $payload['finalized_at'] = $existing?->finalized_at ?: now();

        MiceRecord::query()->updateOrCreate(
            ['booking_id' => $booking->id],
            $payload,
        );

        return redirect()
            ->route(WorkspacePage::routeName($request, 'bookings.show'), $booking->id)
            ->with('success', 'MICE report details saved with this booking.');
    }

    public function show(Request $request, Booking $booking): Response
    {
        $this->ensureBookingAccess($request, $booking);

        $this->notifyPendingBookingViewedByHead($request, $booking);
        $this->markAsViewed($request, $booking);
        $this->bookings->syncLifecycleStatus($booking);

        $booking->refresh()->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
            'lifecycleEvents.actor',
            'miceRecord',
            'scheduleSegments',
            'postEventCharges',
        ]);

        $services = WorkspaceAccess::isStaffLike($request)
            ? ServiceResource::collection(
                Service::with('serviceType')->orderBy('name')->get()
            )->resolve($request)
            : [];

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/show'), [
            'booking' => (new BookingResource($booking))->resolve($request),
            'services' => $services,
            'unavailableDates' => $this->bookings->getUnavailableDates($booking->id),
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
            'canUpdateBooking' => WorkspaceAccess::canUpdateBooking($request, $booking),
            'canDeleteBooking' => WorkspaceAccess::canDeleteBooking($request, $booking),
            'canManagePayments' => WorkspaceAccess::canManagePayments($request),
        ]);
    }

    public function surveyProofImage(Request $request, Booking $booking)
    {
        $this->ensureBookingAccess($request, $booking);

        $file = $this->locateStoredFile($booking->survey_proof_image_path);

        if (! $file) {
            abort(404);
        }

        $ext = pathinfo($file['path'], PATHINFO_EXTENSION);
        $filename = 'legacy-survey-proof-' . $booking->id . ($ext ? ('.' . $ext) : '');
        $filename = preg_replace('/[^A-Za-z0-9._-]+/', '_', $filename) ?: 'legacy-survey-proof';

        return $this->streamStoredFile($file['disk'], $file['path'], $filename, $booking->survey_proof_image_mime);
    }

    public function paymentProofImage(Request $request, Booking $booking, BookingPayment $payment)
    {
        $this->ensureBookingAccess($request, $booking);

        if ((int) $payment->booking_id !== (int) $booking->id) {
            abort(404);
        }

        $file = $this->locateStoredFile($payment->proof_image_path);

        if (! $file) {
            abort(404);
        }

        $ext = pathinfo($file['path'], PATHINFO_EXTENSION);
        $filename = 'payment-proof-' . $booking->id . '-' . $payment->id . ($ext ? ('.' . $ext) : '');
        $filename = preg_replace('/[^A-Za-z0-9._-]+/', '_', $filename) ?: 'payment-proof';

        return $this->streamStoredFile($file['disk'], $file['path'], $filename, $payment->proof_image_mime);
    }

    public function edit(Request $request, Booking $booking): Response
    {
        $this->ensureBookingAccess($request, $booking);
        abort_unless(WorkspaceAccess::canUpdateBooking($request, $booking), 403);

        $this->notifyPendingBookingViewedByHead($request, $booking);
        $this->markAsViewed($request, $booking);
        $this->bookings->syncLifecycleStatus($booking);

        $booking->refresh()->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
            'lifecycleEvents.actor',
            'miceRecord',
        ]);

        $types = ServiceType::with([
            'services' => fn ($query) => $query
                ->with('serviceType')
                ->orderBy('name'),
        ])
            ->orderBy('name')
            ->get();

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/edit'), [
            'booking' => (new BookingResource($booking))->resolve($request),
            'serviceTypes' => ServiceTypeResource::collection($types)->resolve($request),
            'services' => ServiceResource::collection(
                Service::with('serviceType')->orderBy('name')->get()
            )->resolve($request),
            'venuePackages' => $this->venuePackageOptions(),
            'bookingFormOptions' => $this->bookingFormOptions(),
            'unavailableDates' => $this->bookings->getUnavailableDates($booking->id),
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
        ]);
    }

    public function update(UpdateBookingRequest $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);
        abort_unless(WorkspaceAccess::canUpdateBooking($request, $booking), 403);

        $data = $request->validated();

        unset(
            $data['survey_proof_image'],
            $data['survey_proof_image_path'],
            $data['survey_proof_image_name'],
            $data['survey_proof_image_mime']
        );

        if (WorkspaceAccess::isClient($request)) {
            $data = $this->clientSafeUpdatePayload($request, $data);
        }

        $data = $this->managerSafeUpdatePayload($request, $data);

        $booking = $this->bookings->update($booking, $data);
        $this->saveOfficialMiceRecordFromBookingForm($request, $booking);

        return redirect()
            ->route(WorkspacePage::routeName($request, 'bookings.show'), $booking->id)
            ->with('success', 'Booking updated.');
    }

    public function destroy(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);
        abort_unless(WorkspaceAccess::canDeleteBooking($request, $booking), 403);

        $this->bookings->delete($booking);

        return redirect()
            ->route(WorkspacePage::routeName($request, 'bookings.index'))
            ->with('success', 'Booking deleted successfully.');
    }

    public function storePayment(StoreBookingPaymentRequest $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);

        $data = $request->validated();
        $canManage = WorkspaceAccess::canManagePayments($request);
        $data = $this->normalizePaymentPayload($request, $data, $canManage);

        try {
            $payment = $booking->payments()->create($data);
        } catch (\Throwable $exception) {
            if (! empty($data['proof_image_path'])) {
                $this->deleteStoredFile($data['proof_image_path']);
            }

            throw $exception;
        }

        $this->bookings->recalculatePaymentStatus($booking->refresh());

        return redirect()
            ->back()
            ->with('success', $canManage ? 'Payment recorded successfully.' : 'Payment proof submitted for review.');
    }

    public function updatePayment(
        UpdateBookingPaymentRequest $request,
        Booking $booking,
        BookingPayment $payment,
    ): RedirectResponse {
        $this->ensureBookingAccess($request, $booking);
        abort_unless(WorkspaceAccess::canManagePayments($request), 403);

        if ((int) $payment->booking_id !== (int) $booking->id) {
            abort(404);
        }

        $data = $request->validated();
        $oldProofPath = $payment->proof_image_path;
        $oldStatus = BookingStatusCatalog::normalizePaymentProofStatus((string) ($payment->status ?? $payment->payment_status ?? 'pending'), 'pending');

        $data = $this->normalizePaymentPayload($request, $data, true, $payment);

        if (! array_key_exists('proof_image_path', $data)) {
            $data['proof_image_path'] = $oldProofPath;
            $data['proof_image_name'] = $payment->proof_image_name;
            $data['proof_image_mime'] = $payment->proof_image_mime;
        }

        $newProofPath = $data['proof_image_path'] ?? null;

        try {
            $payment->update($data);
        } catch (\Throwable $exception) {
            if ($newProofPath && $newProofPath !== $oldProofPath) {
                $this->deleteStoredFile($newProofPath);
            }

            throw $exception;
        }

        if ($newProofPath && $newProofPath !== $oldProofPath) {
            $this->deleteStoredFile($oldProofPath);
        }

        $this->bookings->recalculatePaymentStatus($booking->refresh());

        $newStatus = BookingStatusCatalog::normalizePaymentProofStatus((string) ($payment->status ?? $payment->payment_status ?? 'pending'), 'pending');
        if ($newStatus !== $oldStatus && in_array($newStatus, ['approved', 'rejected'], true)) {
            $this->notifications->paymentReviewed(
                $payment->refresh(),
                $booking->refresh(),
                $request->user(),
                $newStatus,
                $newStatus === 'rejected' ? ($data['remarks'] ?? null) : null
            );
        }

        return redirect()
            ->back()
            ->with('success', 'Payment updated successfully.');
    }

    public function availability(Request $request): JsonResponse
    {
        $date = trim((string) $request->query('date', ''));

        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return response()->json([
                'message' => 'Invalid date. Use YYYY-MM-DD format.',
            ], 422);
        }

        $excludeIdRaw = $request->query('exclude_booking_id');
        $excludeId = is_numeric($excludeIdRaw) ? (int) $excludeIdRaw : null;

        $area = trim((string) $request->query('venue', $request->query('area', '')));
        $availability = $this->bookings->getDailyAvailability($date, $excludeId, $area !== '' ? $area : null);

        if (! isset($availability['busy']) || ! is_array($availability['busy'])) {
            $availability['busy'] = [];
        }

        if (! isset($availability['free']) || ! is_array($availability['free'])) {
            $availability['free'] = [];
        }

        if (! isset($availability['blocks']) || ! is_array($availability['blocks'])) {
            $availability['blocks'] = [];
        }

        if (! isset($availability['is_fully_booked'])) {
            $availability['is_fully_booked'] = false;
        }

        $availability['venue'] = $area !== '' ? $area : null;

        if (! WorkspaceAccess::isStaffLike($request)) {
            return response()->json([
                'date' => $availability['date'] ?? $date,
                'venue' => $availability['venue'] ?? null,
                'blocks' => $availability['blocks'] ?? [],
                'is_fully_booked' => (bool) ($availability['is_fully_booked'] ?? false),
            ]);
        }

        return response()->json($availability);
    }

    private function normalizePaymentPayload(
        Request $request,
        array $data,
        bool $canManage,
        ?BookingPayment $existingPayment = null,
    ): array {
        $amount = round((float) ($data['amount'] ?? 0), 2);

        $gateway = strtolower(trim((string) ($data['payment_gateway'] ?? '')));
        $method = strtolower(trim((string) ($data['payment_method'] ?? 'online')));
        $paymentType = strtolower(trim((string) ($data['payment_type'] ?? 'down')));
        $status = BookingStatusCatalog::normalizePaymentProofStatus((string) ($data['status'] ?? 'pending'), 'pending');

        if ($gateway === 'cash') {
            $method = 'cash';
        } elseif ($gateway === 'card') {
            $method = 'card';
        } elseif ($gateway === 'manual') {
            $method = 'manual';
        } elseif ($method === '') {
            $method = 'online';
        }

        if (! $canManage) {
            $status = 'pending';
        }

        $normalized = [
            'amount' => $amount,
            'payment_method' => $method,
            'payment_gateway' => $gateway !== '' ? $gateway : null,
            'payment_type' => $paymentType !== '' ? $paymentType : 'down',
            'transaction_reference' => trim((string) ($data['transaction_reference'] ?? '')) ?: null,
            'remarks' => trim((string) ($data['remarks'] ?? '')) ?: null,
            'status' => $status,
            'payer_name' => trim((string) ($data['payer_name'] ?? '')) ?: null,
            'card_holder_name' => trim((string) ($data['card_holder_name'] ?? '')) ?: null,
            'card_expiration' => trim((string) ($data['card_expiration'] ?? '')) ?: null,
            'marketing_consent' => (bool) ($data['marketing_consent'] ?? false),
        ];

        $cardNumber = preg_replace('/\D+/', '', (string) $request->input('card_number', ''));

        $normalized['card_last_four'] = $cardNumber !== ''
            ? substr($cardNumber, -4)
            : ($existingPayment?->card_last_four);

        if ($request->hasFile('proof_image')) {
            $proofFile = $request->file('proof_image');

            if ($proofFile instanceof UploadedFile) {
                $stored = $proofFile->store('booking-payment-proofs', 'local');

                if ($stored) {
                    $normalized['proof_image_path'] = $stored;
                    $normalized['proof_image_name'] = $proofFile->getClientOriginalName();
                    $normalized['proof_image_mime'] = $proofFile->getClientMimeType() ?: $proofFile->getMimeType();
                }
            }
        }

        $normalized['payment_meta'] = array_filter([
            'gateway' => $gateway !== '' ? $gateway : null,
            'payment_type' => $paymentType !== '' ? $paymentType : null,
            'card_holder_name' => trim((string) $request->input('card_holder_name', '')) ?: null,
            'card_expiration' => trim((string) $request->input('card_expiration', '')) ?: null,
            'marketing_consent' => (bool) $request->boolean('marketing_consent'),
            'submitted_by_user_id' => $request->user()?->id,
        ], static fn ($value) => $value !== null && $value !== '');

        $now = now();

        $normalized['paid_at'] = $existingPayment?->paid_at;
        $normalized['verified_at'] = $existingPayment?->verified_at;
        $normalized['approved_at'] = $existingPayment?->approved_at;
        $normalized['declined_at'] = $existingPayment?->declined_at;
        $normalized['failed_at'] = $existingPayment?->failed_at;

        if (in_array($status, ['confirmed', 'approved', 'verified', 'paid', 'completed', 'settled'], true)) {
            $normalized['paid_at'] = $normalized['paid_at'] ?: $now;
            $normalized['verified_at'] = $normalized['verified_at'] ?: $now;
            $normalized['approved_at'] = $normalized['approved_at'] ?: $now;
            $normalized['declined_at'] = null;
            $normalized['failed_at'] = null;
        } elseif (in_array($status, ['declined', 'rejected'], true)) {
            $normalized['declined_at'] = $now;
            $normalized['failed_at'] = null;
        } elseif ($status === 'failed') {
            $normalized['failed_at'] = $now;
            $normalized['declined_at'] = null;
        } elseif ($status === 'pending') {
            $normalized['declined_at'] = null;
            $normalized['failed_at'] = null;

            if (! $existingPayment) {
                $normalized['paid_at'] = null;
                $normalized['verified_at'] = null;
                $normalized['approved_at'] = null;
            }
        }

        return $normalized;
    }

    private function latestBookingDraftPayload(Request $request): ?array
    {
        $user = $request->user();

        if (! $user || ! Schema::hasTable('booking_drafts')) {
            return null;
        }

        $draft = BookingDraft::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['auto', 'manual'])
            ->latest('last_touched_at')
            ->latest('updated_at')
            ->first();

        if (! $draft) {
            return null;
        }

        return [
            'id' => $draft->id,
            'draft_key' => $draft->draft_key,
            'status' => $draft->status,
            'workspace_role' => $draft->workspace_role,
            'current_step' => $draft->current_step,
            'payload' => $draft->payload ?: [],
            'last_touched_at' => optional($draft->last_touched_at)->toIso8601String(),
        ];
    }

    private function saveOfficialMiceRecordFromBookingForm(Request $request, Booking $booking): void
    {
        if (! Schema::hasTable('mice_records')) {
            return;
        }

        $booking->refresh()->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'scheduleSegments',
            'postEventCharges',
        ]);

        $raw = $request->input('mice_payload');

        if (! is_array($raw)) {
            $meta = $request->input('payment_meta', []);
            $raw = is_array($meta) && isset($meta['mice_draft']) && is_array($meta['mice_draft'])
                ? $meta['mice_draft']
                : [];
        }

        $fallback = $this->miceDefaultsFromBooking($booking);
        $payload = MiceRecordPayload::fromRequest(
            array_replace($fallback, $raw),
            $booking,
            $request->user(),
        );

        $existing = MiceRecord::query()
            ->where('booking_id', $booking->id)
            ->first();

        $yearRecorded = (int) ($payload['year_recorded'] ?? now()->year);
        $payload['record_no'] = $existing?->record_no ?: $this->nextMiceRecordNumber($yearRecorded);
        $payload['status'] = 'submitted';
        $payload['draft_expires_at'] = null;
        $payload['finalized_at'] = $existing?->finalized_at ?: now();
        $payload['submitted_at'] = $existing?->submitted_at ?: now();
        $payload['updated_by_user_id'] = $request->user()?->id;

        if (! $existing) {
            $payload['submitted_by_user_id'] = $request->user()?->id;
        }

        MiceRecord::query()->updateOrCreate(
            ['booking_id' => $booking->id],
            $payload,
        );
    }

    private function markBookingDraftSubmitted(Request $request, Booking $booking): void
    {
        $user = $request->user();

        if (! $user || ! Schema::hasTable('booking_drafts')) {
            return;
        }

        $draftKey = trim((string) ($request->input('booking_draft_key') ?: $request->input('draft_key') ?: ''));

        $query = BookingDraft::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['auto', 'manual']);

        if ($draftKey !== '') {
            $query->where('draft_key', $draftKey);
        } else {
            $query->latest('last_touched_at')->latest('updated_at')->limit(1);
        }

        $draft = $query->first();

        if (! $draft) {
            return;
        }

        $draft->forceFill([
            'booking_id' => $booking->id,
            'status' => 'submitted',
            'submitted_at' => now(),
            'last_touched_at' => now(),
        ])->saveQuietly();
    }

    private function ensureBookingAccess(Request $request, Booking $booking): void
    {
        abort_unless(WorkspaceAccess::canViewBooking($request, $booking), 403);
    }

    private function forceClientBookingDefaults(Request $request, array $data): array
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $data['client_email'] = strtolower(trim((string) $user->email));
        $data['created_by_user_id'] = $user->id;
        $data['booking_status'] = 'pending';
        $data['payment_status'] = 'unpaid';

        unset(
            $data['approved_by_user_id'],
            $data['cancelled_by_user_id'],
            $data['declined_by_user_id'],
            $data['completed_by_user_id']
        );

        return $data;
    }

    private function clientSafeUpdatePayload(Request $request, array $data): array
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $allowed = [
            'client_name',
            'company_name',
            'client_contact_number',
            'client_email',
            'client_address',
            'client_region',
            'client_province',
            'client_city_municipality',
            'client_barangay',
            'client_zip_code',
            'client_street_address',
            'head_of_organization',
            'organization_type',
            'type_of_event',
            'number_of_guests',
            'selected_package_code',
            'selected_area_keys',
            'dressing_room_selection',
            'dressing_room_charge',
            'mice_required',
            'mice_exemption_reason',
            'private_event_type',
            'booking_date_from',
            'booking_date_to',
            'schedule_version',
            'schedule_meta',
            'schedule_segments',
        ];

        $safe = array_intersect_key($data, array_flip($allowed));
        $safe['client_email'] = strtolower(trim((string) $user->email));

        return $safe;
    }

    private function managerSafeUpdatePayload(Request $request, array $data): array
    {
        if (WorkspaceAccess::role($request) !== 'manager') {
            return $data;
        }

        unset(
            $data['created_by_user_id'],
            $data['approved_by_user_id'],
            $data['cancelled_by_user_id'],
            $data['declined_by_user_id'],
            $data['completed_by_user_id']
        );

        return $data;
    }

    private function notifyPendingBookingViewedByHead(Request $request, Booking $booking): void
    {
        $user = $request->user();

        if (! $user || ! WorkspaceAccess::isStaffLike($request)) {
            return;
        }

        $status = BookingStatusCatalog::normalizeBookingStatus((string) ($booking->booking_status ?? ''), 'pending');

        if (! in_array($status, ['pending', 'submitted', 'pencil_booked', 'for_review'], true)) {
            return;
        }

        if (Schema::hasColumn('bookings', 'review_notified_at') && filled($booking->review_notified_at)) {
            return;
        }

        $this->notifications->bookingOpenedForReview($booking, $user);

        $payload = [];

        if (Schema::hasColumn('bookings', 'review_notified_at')) {
            $payload['review_notified_at'] = now();
        }

        if (Schema::hasColumn('bookings', 'review_notified_by_user_id')) {
            $payload['review_notified_by_user_id'] = $user->id;
        }

        if (! empty($payload)) {
            $booking->forceFill($payload)->saveQuietly();
        }
    }

    private function markAsViewed(Request $request, Booking $booking): void
    {
        $user = $request->user();

        if (! $user || ! method_exists($booking, 'views')) {
            return;
        }

        try {
            $booking->views()->updateOrCreate(
                ['user_id' => $user->id],
                ['viewed_at' => now()],
            );
        } catch (\Throwable) {
            // View tracking should never block booking access.
        }
    }

    private function bookingMicePayload(Booking $booking): array
    {
        return (new BookingResource($booking))->resolve(request());
    }

    private function miceDefaultsFromBooking(Booking $booking): array
    {
        $booking->loadMissing(['bookingServices.service.serviceType', 'service.serviceType', 'scheduleSegments']);

        $start = $booking->booking_date_from ? Carbon::parse($booking->booking_date_from) : now();
        $end = $booking->booking_date_to ? Carbon::parse($booking->booking_date_to) : $start;

        $venueArea = $booking->bookingServices->isNotEmpty()
            ? $booking->bookingServices
                ->map(fn ($item) => $item->service?->serviceType?->name ?: $item->service?->name)
                ->filter()
                ->unique()
                ->implode(', ')
            : ($booking->service?->serviceType?->name ?: $booking->service?->name ?: 'Baguio Convention and Cultural Center');

        $hours = $booking->scheduleSegments->sum(function ($segment): float {
            if (! $segment->starts_at || ! $segment->ends_at) {
                return 0;
            }

            try {
                return max(0, Carbon::parse($segment->starts_at)->floatDiffInHours(Carbon::parse($segment->ends_at)));
            } catch (\Throwable) {
                return 0;
            }
        });

        if ($hours <= 0) {
            $hours = max(1, $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1) * 10;
        }

        $totalGuests = (int) ($booking->number_of_guests ?? 0);

        return [
            'event_scope' => MiceReportCatalog::EVENT_SCOPE_PUBLIC,
            'year_recorded' => $start->year,
            'event_center_name' => MiceReportCatalog::EVENT_CENTER_NAME,
            'function_halls_count' => MiceReportCatalog::FUNCTION_HALLS_COUNT,
            'function_hall_capacity' => MiceReportCatalog::FUNCTION_HALL_CAPACITY,
            'covered_month' => $start->format('F'),
            'event_started_at' => $start->toDateString(),
            'event_finished_at' => $end->toDateString(),
            'number_of_hours' => round($hours, 2),
            'event_name' => mb_strtoupper((string) ($booking->type_of_event ?: $booking->public_calendar_title ?: '')),
            'event_category' => 'REGIONAL PHILIPPINES',
            'classification_of_event' => 'REGIONAL PHILIPPINES',
            'type_of_event' => 'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS',
            'mice_type_of_event' => 'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS',
            'venue_area' => $venueArea,
            'event_date_from' => $start->toDateString(),
            'event_date_to' => $end->toDateString(),
            'organization_name' => mb_strtoupper((string) ($booking->company_name ?: $booking->client_name ?: '')),
            'organizer_organization_name' => mb_strtoupper((string) ($booking->company_name ?: $booking->client_name ?: '')),
            'organizer_name' => mb_strtoupper((string) ($booking->head_of_organization ?: '')),
            'organizer_type' => $booking->organization_type,
            'contact_person' => mb_strtoupper((string) ($booking->client_name ?: '')),
            'organizer_contact_person' => mb_strtoupper((string) ($booking->client_name ?: '')),
            'contact_number' => $booking->client_contact_number,
            'organizer_contact_number' => $booking->client_contact_number,
            'email' => $booking->client_email,
            'address' => mb_strtoupper((string) ($booking->client_address ?: '')),
            'organizer_address' => mb_strtoupper((string) ($booking->client_address ?: '')),
            'domestic_attendees' => $totalGuests,
            'foreign_attendees' => 0,
            'total_participants' => $totalGuests,
            'total_number_of_countries' => 1,
            'main_origin_country' => 'Philippines',
            'comments_feedback' => 'N/A',
        ];
    }

    private function micePayload(MiceRecord $record): array
    {
        return [
            'id' => $record->id,
            'booking_id' => $record->booking_id,
            'record_no' => $record->record_no,
            'year_recorded' => $record->year_recorded,
            'event_scope' => $record->event_scope ?? MiceReportCatalog::EVENT_SCOPE_PUBLIC,
            'status' => $record->status,
            'draft_expires_at' => optional($record->draft_expires_at)->toIso8601String(),
            'finalized_at' => optional($record->finalized_at)->toIso8601String(),
            'enterprise_group' => $record->enterprise_group,
            'btc_group_code' => $record->btc_group_code,
            'event_center_name' => $record->event_center_name,
            'function_halls_count' => $record->function_halls_count,
            'function_hall_capacity' => $record->function_hall_capacity,
            'covered_month' => $record->covered_month,
            'event_started_at' => optional($record->event_started_at)->toDateString(),
            'event_finished_at' => optional($record->event_finished_at)->toDateString(),
            'number_of_hours' => $record->number_of_hours,
            'event_name' => $record->event_name,
            'event_category' => $record->event_category,
            'type_of_event' => $record->type_of_event,
            'classification_of_event' => $record->classification_of_event,
            'mice_type_of_event' => $record->mice_type_of_event,
            'venue_area' => $record->venue_area,
            'event_date_from' => optional($record->event_date_from)->toDateString(),
            'event_date_to' => optional($record->event_date_to)->toDateString(),
            'event_days' => $record->event_days,
            'foreign_attendees' => $record->foreign_attendees,
            'domestic_attendees' => $record->domestic_attendees,
            'total_number_of_countries' => $record->total_number_of_countries,
            'countries_breakdown' => $record->countries_breakdown ?: [],
            'countries_breakdown_text' => $record->countries_breakdown_text,
            'has_exhibitions' => (bool) $record->has_exhibitions,
            'exhibitors_count' => $record->exhibitors_count,
            'visitors_count' => $record->visitors_count,
            'organizer_organization_name' => $record->organizer_organization_name,
            'organizer_address' => $record->organizer_address,
            'organizer_contact_person' => $record->organizer_contact_person,
            'organizer_contact_number' => $record->organizer_contact_number,
            'comments_feedback' => $record->comments_feedback,
            'organization_name' => $record->organization_name,
            'organizer_name' => $record->organizer_name,
            'organizer_type' => $record->organizer_type,
            'contact_person' => $record->contact_person,
            'contact_number' => $record->contact_number,
            'email' => $record->email,
            'address' => $record->address,
            'local_male_participants' => $record->local_male_participants,
            'local_female_participants' => $record->local_female_participants,
            'domestic_male_participants' => $record->domestic_male_participants,
            'domestic_female_participants' => $record->domestic_female_participants,
            'foreign_male_participants' => $record->foreign_male_participants,
            'foreign_female_participants' => $record->foreign_female_participants,
            'total_participants' => $record->total_participants,
            'main_origin_country' => $record->main_origin_country,
            'main_origin_province' => $record->main_origin_province,
            'main_origin_city' => $record->main_origin_city,
            'same_day_visitors' => $record->same_day_visitors,
            'overnight_visitors' => $record->overnight_visitors,
            'estimated_room_nights' => $record->estimated_room_nights,
            'estimated_tourism_receipts' => $record->estimated_tourism_receipts,
            'total_employees' => $record->total_employees,
            'female_employees' => $record->female_employees,
            'male_employees' => $record->male_employees,
            'permit_to_engage' => (bool) $record->permit_to_engage,
            'dot_accredited' => (bool) $record->dot_accredited,
            'active_member' => (bool) $record->active_member,
            'remarks' => $record->remarks,
            'submitted_at' => optional($record->submitted_at)->toIso8601String(),
        ];
    }

    private function guessMiceCategory(string $eventType): string
    {
        $value = strtolower($eventType);

        if (str_contains($value, 'exhibit') || str_contains($value, 'expo') || str_contains($value, 'fair')) {
            return 'Exhibition';
        }

        if (str_contains($value, 'convention') || str_contains($value, 'conference') || str_contains($value, 'summit')) {
            return 'Convention';
        }

        if (str_contains($value, 'meeting') || str_contains($value, 'seminar') || str_contains($value, 'training') || str_contains($value, 'workshop')) {
            return 'Meeting';
        }

        if (str_contains($value, 'government')) {
            return 'Government';
        }

        if (str_contains($value, 'cultural') || str_contains($value, 'concert')) {
            return 'Cultural';
        }

        if (str_contains($value, 'corporate')) {
            return 'Corporate';
        }

        return 'Other';
    }

    private function nextMiceRecordNumber(int $year): int
    {
        return ((int) MiceRecord::query()
            ->where('year_recorded', $year)
            ->max('record_no')) + 1;
    }

    private function bookingFormOptions(): array
    {
        return [
            'venueAreas' => VenueAreaCatalog::publicOptions(),
            'venuePackages' => $this->venuePackageOptions(),
            'dressingRooms' => collect(DressingRoomCatalog::options())
                ->map(fn (array $option, string $key) => [
                    'value' => $key,
                    'label' => $option['label'] ?? $key,
                    'charge' => $option['charge'] ?? 0,
                    'charge_label' => '₱' . number_format((float) ($option['charge'] ?? 0), 2),
                ])
                ->values()
                ->all(),
            'schedule' => [
                'baseBlocks' => BookingScheduleCatalog::baseBlocks(),
                'segmentRoles' => BookingScheduleCatalog::segmentRoles(),
                'additionalHourOptions' => BookingScheduleCatalog::additionalHourOptions(),
            ],
            'mice' => [
                'classificationOptions' => MiceReportCatalog::classificationOptions(),
                'typeOptions' => MiceReportCatalog::typeOptions(),
                'coveredMonthOptions' => MiceReportCatalog::coveredMonthOptions(),
                'eventCenterOptions' => MiceReportCatalog::eventCenterOptions(),
                'eventScopeOptions' => MiceReportCatalog::eventScopeOptions(),
                'countryOptions' => MiceReportCatalog::countryOptions(),
                'classificationInstructions' => MiceReportCatalog::classificationInstructions(),
                'eventTypeInstructions' => MiceReportCatalog::eventTypeInstructions(),
            ],
        ];
    }

    private function venuePackageOptions(): array
    {
        // The active booking UI must use the official 8 BCCC package catalog.
        // Database package templates are intentionally bypassed here because old
        // template rows can still contain legacy combinations and make the form
        // show more than the approved 8 choices.
        return VenuePackageCatalog::options();
    }

    private function extractInitialPackageCode(Request $request): ?string
    {
        return VenuePackageCatalog::normalizeCode(
            $request->query('package')
                ?? $request->query('package_code')
                ?? $request->query('selected_package_code')
                ?? null
        );
    }

    private function extractInitialAreaKeys(Request $request): array
    {
        $raw = $request->query('areas')
            ?? $request->query('area_keys')
            ?? $request->query('selected_area_keys')
            ?? $request->query('area')
            ?? $request->query('venue');

        return ActiveVenueCatalog::sanitizeKeys($raw);
    }

    private function extractInitialSchedule(Request $request): array
    {
        $date = trim((string) $request->query('date', ''));
        $start = trim((string) $request->query('start', ''));
        $end = trim((string) $request->query('end', ''));
        $block = strtoupper(trim((string) $request->query('block', '')));

        if ($date !== '' && $block !== '' && ($start === '' || $end === '')) {
            [$start, $end] = match ($block) {
                'AM' => ['06:00', '12:00'],
                'PM' => ['12:00', '18:00'],
                'EVE', 'EVENING' => ['18:00', '23:59'],
                default => [$start, $end],
            };
        }

        $dateFrom = trim((string) $request->query('date_from', ''));
        $dateTo = trim((string) $request->query('date_to', ''));

        $startDate = trim((string) $request->query('start_date', ''));
        $endDate = trim((string) $request->query('end_date', ''));

        if (
            preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)
            && preg_match('/^\d{2}:\d{2}$/', $start)
            && preg_match('/^\d{2}:\d{2}$/', $end)
        ) {
            return [
                'date' => $date,
                'start_time' => $start,
                'end_time' => $end,
                'date_from' => "{$date}T{$start}",
                'date_to' => "{$date}T{$end}",
                'booking_date_from' => "{$date}T{$start}",
                'booking_date_to' => "{$date}T{$end}",
                'from' => "{$date}T{$start}",
                'to' => "{$date}T{$end}",
            ];
        }

        if (
            preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $dateFrom)
            && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $dateTo)
        ) {
            return [
                'date' => substr($dateFrom, 0, 10),
                'start_time' => substr($dateFrom, 11, 5),
                'end_time' => substr($dateTo, 11, 5),
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'booking_date_from' => $dateFrom,
                'booking_date_to' => $dateTo,
                'from' => $dateFrom,
                'to' => $dateTo,
            ];
        }

        if (
            preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)
            && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)
        ) {
            return [
                'date' => $startDate,
                'start_time' => '06:00',
                'end_time' => '23:59',
                'date_from' => "{$startDate}T06:00",
                'date_to' => "{$endDate}T23:59",
                'booking_date_from' => "{$startDate}T06:00",
                'booking_date_to' => "{$endDate}T23:59",
                'from' => "{$startDate}T06:00",
                'to' => "{$endDate}T23:59",
            ];
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return [
                'date' => $date,
                'start_time' => '06:00',
                'end_time' => '12:00',
                'date_from' => "{$date}T06:00",
                'date_to' => "{$date}T12:00",
                'booking_date_from' => "{$date}T06:00",
                'booking_date_to' => "{$date}T12:00",
                'from' => "{$date}T06:00",
                'to' => "{$date}T12:00",
            ];
        }

        return [
            'date' => null,
            'start_time' => null,
            'end_time' => null,
            'date_from' => null,
            'date_to' => null,
            'booking_date_from' => null,
            'booking_date_to' => null,
            'from' => null,
            'to' => null,
        ];
    }

    private function locateStoredFile(?string $path): ?array
    {
        if (! $path) {
            return null;
        }

        foreach (['local', 'public'] as $disk) {
            if (Storage::disk($disk)->exists($path)) {
                return [
                    'disk' => $disk,
                    'path' => $path,
                ];
            }
        }

        return null;
    }

    private function streamStoredFile(string $disk, string $path, string $filename, ?string $mimeOverride = null)
    {
        $storage = Storage::disk($disk);
        $mime = $mimeOverride ?: ($storage->mimeType($path) ?: 'application/octet-stream');
        $safeFilename = str_replace(['\\', '"'], ['_', '\"'], $filename);

        return response()->stream(function () use ($storage, $path): void {
            echo $storage->get($path);
        }, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . $safeFilename . '"',
            'Cache-Control' => 'private, max-age=300',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function deleteStoredFile(?string $path): void
    {
        if (! $path) {
            return;
        }

        foreach (['local', 'public'] as $disk) {
            try {
                if (Storage::disk($disk)->exists($path)) {
                    Storage::disk($disk)->delete($path);
                }
            } catch (\Throwable) {
                // File cleanup should not block the main transaction.
            }
        }
    }
}
