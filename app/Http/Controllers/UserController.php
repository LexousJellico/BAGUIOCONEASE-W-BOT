<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\NotificationService;
use App\Support\WorkspacePage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct(private readonly NotificationService $notifications)
    {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('q', $request->input('search', '')));
        $role = trim((string) $request->input('role', ''));

        $query = User::query()
            ->withCount([
                'bookingsCreated as bookings_count',
                'bookingsCreated as approved_bookings_count' => fn ($bookingQuery) => $bookingQuery->whereIn('booking_status', ['approved', 'confirmed', 'active', 'completed']),
                'bookingsCreated as pending_bookings_count' => fn ($bookingQuery) => $bookingQuery->whereIn('booking_status', ['pending', 'pencil_booked', 'for_review', 'submitted', 'awaiting_downpayment', 'awaiting_balance']),
            ])
            ->with([
                'latestBookingCreated.service.serviceType',
                'latestBookingCreated.bookingServices.service.serviceType',
            ]);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('organization_name', 'like', "%{$search}%")
                    ->orWhere('position_title', 'like', "%{$search}%");
            });
        }

        if ($role !== '') {
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        $users = $query
            ->with('roles')
            ->orderByDesc('id')
            ->paginate((int) $request->integer('per_page', 10))
            ->withQueryString()
            ->through(fn (User $user) => $this->serializeUser($user));

        $availableRoles = Role::query()
            ->orderBy('name')
            ->pluck('name')
            ->all();

        return Inertia::render(WorkspacePage::resolve($request, 'users/index'), [
            'workspaceRole' => WorkspacePage::role($request),
            'users' => $users,
            'availableRoles' => $availableRoles,
            'filters' => [
                'q' => $search,
                'search' => $search,
                'role' => $role,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render(WorkspacePage::resolve($request, 'users/create'), [
            'workspaceRole' => WorkspacePage::role($request),
            'availableRoles' => Role::query()->orderBy('name')->pluck('name')->all(),
            'defaults' => [
                'country' => 'Philippines',
                'email_is_verified' => true,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $actor = $request->user();
        $payload = $this->validatedPayload($request);

        $user = User::create([
            'name' => $this->buildFullName(
                $payload['first_name'],
                $payload['middle_name'] ?? null,
                $payload['last_name']
            ),
            'first_name' => $payload['first_name'],
            'middle_name' => $payload['middle_name'] ?? null,
            'last_name' => $payload['last_name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'phone_number' => $payload['phone_number'] ?? null,
            'organization_name' => $payload['organization_name'] ?? null,
            'organization_type' => $payload['organization_type'] ?? null,
            'position_title' => $payload['position_title'] ?? null,
            'address_line1' => $payload['address_line1'] ?? null,
            'barangay' => $payload['barangay'] ?? null,
            'city_municipality' => $payload['city_municipality'] ?? null,
            'province' => $payload['province'] ?? null,
            'postal_code' => $payload['postal_code'] ?? null,
            'country' => $payload['country'] ?? 'Philippines',
            'email_verified_at' => ($payload['email_is_verified'] ?? false) ? now() : null,
        ]);

        $oldRoles = [];
        $newRoles = [];

        if (! empty($payload['role'])) {
            $user->syncRoles([$payload['role']]);
            $newRoles = [$payload['role']];
        } else {
            $user->syncRoles([]);
        }

        if ($actor) {
            $this->notifications->userCreated($user, $actor);

            if (! empty($newRoles)) {
                $this->notifications->userRolesUpdated($user, $actor, $oldRoles, $newRoles);
            }
        }

        return redirect()
            ->route(WorkspacePage::routeName($request, 'users.index'))
            ->with('success', 'User created successfully.');
    }

    public function show(Request $request, User $user): Response
    {
        $user->load('roles');
        $user->loadCount([
            'bookingsCreated as bookings_count',
            'bookingsCreated as approved_bookings_count' => fn ($bookingQuery) => $bookingQuery->whereIn('booking_status', ['approved', 'confirmed', 'active', 'completed']),
            'bookingsCreated as pending_bookings_count' => fn ($bookingQuery) => $bookingQuery->whereIn('booking_status', ['pending', 'pencil_booked', 'for_review', 'submitted', 'awaiting_downpayment', 'awaiting_balance']),
        ]);
        $user->load([
            'latestBookingCreated.service.serviceType',
            'latestBookingCreated.bookingServices.service.serviceType',
            'bookingsCreated' => fn ($bookingQuery) => $bookingQuery
                ->with([
                    'service.serviceType',
                    'bookingServices.service.serviceType',
                    'payments',
                    'postEventCharges',
                    'miceRecord',
                ])
                ->latest('booking_date_from')
                ->latest('id')
                ->limit(12),
        ]);

        return Inertia::render(WorkspacePage::resolve($request, 'users/show'), [
            'workspaceRole' => WorkspacePage::role($request),
            'user' => $this->serializeUser($user, true),
        ]);
    }

    public function edit(Request $request, User $user): Response
    {
        $user->load('roles');
        $user->loadCount([
            'bookingsCreated as bookings_count',
            'bookingsCreated as approved_bookings_count' => fn ($bookingQuery) => $bookingQuery->whereIn('booking_status', ['approved', 'confirmed', 'active', 'completed']),
            'bookingsCreated as pending_bookings_count' => fn ($bookingQuery) => $bookingQuery->whereIn('booking_status', ['pending', 'pencil_booked', 'for_review', 'submitted', 'awaiting_downpayment', 'awaiting_balance']),
        ]);
        $user->load(['latestBookingCreated.service.serviceType', 'latestBookingCreated.bookingServices.service.serviceType']);

        return Inertia::render(WorkspacePage::resolve($request, 'users/edit'), [
            'workspaceRole' => WorkspacePage::role($request),
            'user' => $this->serializeUser($user, true),
            'availableRoles' => Role::query()->orderBy('name')->pluck('name')->all(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $actor = $request->user();
        $payload = $this->validatedPayload($request, $user);

        $original = $user->getOriginal();
        $oldRoles = $user->roles->pluck('name')->all();

        $user->update([
            'name' => $this->buildFullName(
                $payload['first_name'],
                $payload['middle_name'] ?? null,
                $payload['last_name']
            ),
            'first_name' => $payload['first_name'],
            'middle_name' => $payload['middle_name'] ?? null,
            'last_name' => $payload['last_name'],
            'email' => $payload['email'],
            'phone_number' => $payload['phone_number'] ?? null,
            'organization_name' => $payload['organization_name'] ?? null,
            'organization_type' => $payload['organization_type'] ?? null,
            'position_title' => $payload['position_title'] ?? null,
            'address_line1' => $payload['address_line1'] ?? null,
            'barangay' => $payload['barangay'] ?? null,
            'city_municipality' => $payload['city_municipality'] ?? null,
            'province' => $payload['province'] ?? null,
            'postal_code' => $payload['postal_code'] ?? null,
            'country' => $payload['country'] ?? 'Philippines',
            'email_verified_at' => ($payload['email_is_verified'] ?? false)
                ? ($user->email_verified_at ?: now())
                : null,
        ]);

        if (! empty($payload['password'])) {
            $user->update([
                'password' => Hash::make($payload['password']),
            ]);
        }

        if (! empty($payload['role'])) {
            $user->syncRoles([$payload['role']]);
        } else {
            $user->syncRoles([]);
        }

        $user->refresh()->load('roles');

        $newRoles = $user->roles->pluck('name')->all();

        $changes = [];

        foreach ($user->getAttributes() as $field => $newVal) {
            if (! array_key_exists($field, $original)) {
                continue;
            }

            $oldVal = $original[$field];

            if ($oldVal == $newVal) {
                continue;
            }

            if (in_array($field, ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'], true)) {
                $changes[$field] = ['(hidden)', '(hidden)'];
                continue;
            }

            $changes[$field] = [$oldVal, $newVal];
        }

        if ($actor) {
            $this->notifications->userUpdated($user, $actor, $changes);

            $oldSorted = $oldRoles;
            $newSorted = $newRoles;

            sort($oldSorted);
            sort($newSorted);

            if ($oldSorted !== $newSorted) {
                $this->notifications->userRolesUpdated($user, $actor, $oldRoles, $newRoles);
            }
        }

        return redirect()
            ->route(WorkspacePage::routeName($request, 'users.index'))
            ->with('success', 'User updated successfully.');
    }

    public function verifyEmail(Request $request, User $user): RedirectResponse
    {
        if (! $user->email_verified_at) {
            $user->forceFill([
                'email_verified_at' => now(),
            ])->save();

            if ($request->user()) {
                $this->notifications->userUpdated($user, $request->user(), [
                    'email_verified_at' => [null, $user->email_verified_at?->format('Y-m-d H:i:s')],
                ]);
            }
        }

        return back()->with('success', 'Email marked as verified successfully.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ((int) $user->id === (int) auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($user->hasRole('admin') && User::role('admin')->count() <= 1) {
            return back()->with('error', 'You cannot delete the last admin account.');
        }

        if ($request->user()) {
            $this->notifications->userDeleted($user, $request->user());
        }

        $user->delete();

        return redirect()
            ->route(WorkspacePage::routeName($request, 'users.index'))
            ->with('success', 'User deleted successfully.');
    }

    protected function validatedPayload(Request $request, ?User $user = null): array
    {
        $phoneNumber = $this->normalizePhoneNumber($request->input('phone_number'));

        $data = $request->merge([
            'first_name' => $this->trimNullable($request->input('first_name')),
            'middle_name' => $this->trimNullable($request->input('middle_name')),
            'last_name' => $this->trimNullable($request->input('last_name')),
            'email' => strtolower(trim((string) $request->input('email'))),
            'phone_number' => $phoneNumber,
            'organization_name' => $this->trimNullable($request->input('organization_name')),
            'organization_type' => $this->trimNullable($request->input('organization_type')),
            'position_title' => $this->trimNullable($request->input('position_title')),
            'address_line1' => $this->trimNullable($request->input('address_line1')),
            'barangay' => $this->trimNullable($request->input('barangay')),
            'city_municipality' => $this->trimNullable($request->input('city_municipality')),
            'province' => $this->trimNullable($request->input('province')),
            'postal_code' => $this->trimNullable($request->input('postal_code')),
            'country' => $this->trimNullable($request->input('country')) ?: 'Philippines',
            'email_is_verified' => $request->boolean('email_is_verified'),
        ])->all();

        $passwordRules = $user
            ? ['nullable', 'string', Password::defaults(), 'confirmed']
            : ['required', 'string', Password::defaults(), 'confirmed'];

        return validator($data, [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'phone_number' => ['nullable', 'regex:/^\d{11}$/', Rule::unique('users', 'phone_number')->ignore($user?->id)],
            'organization_name' => ['nullable', 'string', 'max:255'],
            'organization_type' => ['nullable', 'string', 'max:255'],
            'position_title' => ['nullable', 'string', 'max:255'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'city_municipality' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:120'],
            'password' => $passwordRules,
            'role' => ['nullable', 'string', 'exists:roles,name'],
            'email_is_verified' => ['nullable', 'boolean'],
        ])->validate();
    }

    protected function serializeLatestBooking(User $user): ?array
    {
        $booking = $user->latestBookingCreated;

        if (! $booking) {
            return null;
        }

        $services = $booking->bookingServices
            ->map(function ($item) {
                $service = $item->service;
                $area = $service?->serviceType?->name;
                $name = $service?->name;

                return trim(implode(' · ', array_filter([$area, $name])));
            })
            ->filter()
            ->values()
            ->all();

        if (empty($services) && $booking->service) {
            $services = [trim(implode(' · ', array_filter([
                $booking->service?->serviceType?->name,
                $booking->service?->name,
            ])))];
        }

        return [
            'id' => $booking->id,
            'title' => $booking->display_title,
            'client' => $booking->display_client,
            'type_of_event' => $booking->type_of_event,
            'company_name' => $booking->company_name,
            'booking_status' => $booking->booking_status,
            'payment_status' => $booking->payment_status,
            'selected_package_code' => $booking->selected_package_code,
            'booking_date_from' => $this->formatDateTime($booking->booking_date_from),
            'booking_date_to' => $this->formatDateTime($booking->booking_date_to),
            'services' => $services,
        ];
    }


    protected function serializeUserBookings(User $user): array
    {
        if (! $user->relationLoaded('bookingsCreated')) {
            return [];
        }

        return $user->bookingsCreated
            ->map(fn ($booking) => $this->serializeUserBooking($booking))
            ->values()
            ->all();
    }

    protected function serializeUserBooking($booking): array
    {
        $services = $booking->bookingServices
            ->map(function ($item) {
                $service = $item->service;
                $area = $service?->serviceType?->name;
                $name = $service?->name;

                return trim(implode(' · ', array_filter([$area, $name])));
            })
            ->filter()
            ->values()
            ->all();

        if (empty($services) && $booking->service) {
            $services = [trim(implode(' · ', array_filter([
                $booking->service?->serviceType?->name,
                $booking->service?->name,
            ])))];
        }

        $payments = $booking->payments ?? collect();
        $postEventCharges = $booking->postEventCharges ?? collect();
        $financialSummary = $booking->financial_summary ?? [];
        $baseTotal = round((float) ($financialSummary['base_total'] ?? $financialSummary['subtotal'] ?? $booking->finalized_total ?? 0), 2);
        $postEventTotal = round((float) ($financialSummary['post_event_total'] ?? $postEventCharges->sum(fn ($charge) => (float) ($charge->amount ?? 0))), 2);
        $totalPayable = round((float) ($financialSummary['total_with_post_event'] ?? ($baseTotal + $postEventTotal)), 2);
        $confirmedPayments = round((float) ($financialSummary['paid'] ?? $payments->filter(fn ($payment) => in_array(strtolower((string) $payment->status), ['confirmed', 'approved', 'verified', 'paid', 'completed', 'settled'], true))->sum(fn ($payment) => (float) ($payment->amount ?? 0))), 2);
        $pendingPayments = round((float) ($financialSummary['pending'] ?? $payments->filter(fn ($payment) => in_array(strtolower((string) $payment->status), ['pending', 'submitted', 'for_review'], true))->sum(fn ($payment) => (float) ($payment->amount ?? 0))), 2);

        return [
            'id' => $booking->id,
            'title' => $booking->display_title,
            'client' => $booking->display_client,
            'type_of_event' => $booking->type_of_event,
            'company_name' => $booking->company_name,
            'client_name' => $booking->client_name,
            'client_email' => $booking->client_email,
            'client_contact_number' => $booking->client_contact_number,
            'organization_type' => $booking->organization_type,
            'head_of_organization' => $booking->head_of_organization,
            'booking_status' => $booking->booking_status,
            'payment_status' => $booking->payment_status,
            'selected_package_code' => $booking->selected_package_code,
            'booking_date_from' => $this->formatDateTime($booking->booking_date_from),
            'booking_date_to' => $this->formatDateTime($booking->booking_date_to),
            'number_of_guests' => $booking->number_of_guests,
            'services' => $services,
            'mice_report' => $booking->miceRecord ? [
                'id' => $booking->miceRecord->id,
                'status' => $booking->miceRecord->status ?? null,
                'reference_code' => $booking->miceRecord->reference_code ?? null,
                'event_name' => $booking->miceRecord->event_name ?? null,
                'event_scope' => $booking->miceRecord->event_scope ?? null,
                'total_participants' => $booking->miceRecord->total_participants ?? null,
            ] : null,
            'payments_count' => $payments->count(),
            'post_event_charges_count' => $postEventCharges->count(),
            'totals' => [
                'base_total' => $baseTotal,
                'post_event_total' => $postEventTotal,
                'total_payable' => $totalPayable,
                'confirmed_payments' => $confirmedPayments,
                'pending_payments' => $pendingPayments,
                'remaining_balance' => round((float) ($financialSummary['balance'] ?? max(0, $totalPayable - $confirmedPayments)), 2),
            ],
        ];
    }

    protected function serializeUser(User $user, bool $detailed = false): array
    {
        $roles = $user->roles->pluck('name')->values()->all();

        $payload = [
            'id' => $user->id,
            'name' => $user->display_name ?: $user->name,
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone_number' => $user->phone_number,
            'organization_name' => $user->organization_name,
            'organization_type' => $user->organization_type,
            'position_title' => $user->position_title,
            'email_verified_at' => $this->formatDateTime($user->email_verified_at),
            'last_login_at' => $this->formatDateTime($user->last_login_at ?? null),
            'google_id' => $user->google_id,
            'role' => $roles[0] ?? null,
            'roles' => $roles,
            'created_at' => $this->formatDateTime($user->created_at),
            'bookings_count' => (int) ($user->bookings_count ?? 0),
            'approved_bookings_count' => (int) ($user->approved_bookings_count ?? 0),
            'pending_bookings_count' => (int) ($user->pending_bookings_count ?? 0),
            'latest_booking' => $this->serializeLatestBooking($user),
            'recent_bookings' => $this->serializeUserBookings($user),
        ];

        if (! $detailed) {
            return $payload;
        }

        return array_merge($payload, [
            'address_line1' => $user->address_line1,
            'barangay' => $user->barangay,
            'city_municipality' => $user->city_municipality,
            'province' => $user->province,
            'postal_code' => $user->postal_code,
            'country' => $user->country ?: 'Philippines',
            'email_is_verified' => (bool) $user->email_verified_at,
            'updated_at' => $this->formatDateTime($user->updated_at),
        ]);
    }

    protected function formatDateTime(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        return (string) $value;
    }

    protected function normalizePhoneNumber(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $value) ?? '';

        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '639') && strlen($digits) === 12) {
            return '0' . substr($digits, 2);
        }

        if (str_starts_with($digits, '9') && strlen($digits) === 10) {
            return '0' . $digits;
        }

        return $digits;
    }

    protected function trimNullable(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    protected function buildFullName(string $firstName, ?string $middleName, string $lastName): string
    {
        return trim(implode(' ', array_filter([$firstName, $middleName, $lastName], function ($value) {
            return is_string($value) && trim($value) !== '';
        })));
    }
}
