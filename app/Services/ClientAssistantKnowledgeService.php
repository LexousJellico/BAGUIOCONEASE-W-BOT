<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Service;
use App\Models\ServiceType;
use App\Models\SiteSetting;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\VenueSpace;
use App\Support\VenueAreaCatalog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ClientAssistantKnowledgeService
{
    public function __construct(
        private readonly BookingService $bookingService,
        private readonly AssistantSystemSearchService $systemSearch,
    ) {
    }

    /**
     * Build a compact, trusted knowledge pack for the global assistant.
     *
     * @param  array<int, string>  $dates
     * @param  array<string, mixed>  $pageContext
     * @return array<string, mixed>
     */
    public function build(?User $user, string $message, array $dates = [], array $pageContext = []): array
    {
        $surface = $this->normalizeSurface((string) ($pageContext['surface'] ?? ($user ? 'client' : 'public')));
        $trustedSearch = $this->systemSearch->search($user, $message, $dates, [
            'page' => $pageContext['page'] ?? '',
            'context' => $pageContext['context'] ?? '',
            'surface' => $surface,
        ]);

        return [
            'system' => $this->systemFacts($surface),
            'audience' => [
                'authenticated' => $user !== null,
                'surface' => $surface,
                'user_role_hint' => $this->roleHint($user, $surface),
                'privacy_note' => $user ? 'The assistant may summarize this authenticated user\'s own booking and notification snapshots only.' : 'The assistant is serving a public/guest visitor and must not claim access to private account data.',
            ],
            'page_context' => [
                'url' => Str::limit((string) ($pageContext['page'] ?? ''), 255, ''),
                'label' => Str::limit((string) ($pageContext['context'] ?? ''), 160, ''),
            ],
            'question' => Str::limit($message, 1200, ''),
            'availability' => $this->availabilityFacts($dates),
            'system_search' => $trustedSearch,
            'backend_assistant' => $this->backendAssistantFacts($user, $surface),
            'client_recent_bookings' => $user ? $this->clientRecentBookings($user) : [],
            'client_recent_notices' => $user ? $this->clientRecentNotices($user) : [],
            'venue_and_rates' => $this->venueAndRateFacts(),
            'booking_lifecycle' => $this->bookingLifecycleFacts(),
            'payment_rules' => $this->paymentFacts(),
            'requirements' => $this->requirementFacts(),
            'contacts' => $this->contactFacts(),
            'public_links' => $this->publicLinks(),
            'safety_boundaries' => [
                'Never invent an unavailable date or final approval. Availability must be based only on provided availability facts.',
                'When the system_search pack has sources, use those trusted internal records before giving a generic answer.',
                'When confidence is low, say the answer needs BCCC staff confirmation and guide the user to the exact page/action.',
                'Do not expose another client\'s private details. Only summarize the authenticated user\'s own bookings/notices when the user is logged in.',
                'For guests, invite them to log in or submit a booking when private account details are needed.',
                'For policy/rate uncertainty, tell the user to confirm with BCCC staff through the official booking record.',
                'Keep answers helpful, simple, professional, and specific to BCCC EASE.',
            ],
        ];
    }

    /**
     * @param  array<int, string>  $dates
     * @param  array<string, mixed>  $knowledgePack
     * @return array<string, mixed>
     */
    public function localAnswer(?User $user, string $message, array $dates = [], array $knowledgePack = []): array
    {
        $lower = mb_strtolower($message);
        $sections = [];
        $isBackendSurface = $this->isBackendSurface($user, $knowledgePack);

        if ($dates !== []) {
            $sections[] = $this->availabilityAnswer($dates);
        }

        if ($isBackendSurface && $this->mentions($lower, ['admin', 'manager', 'staff', 'dashboard', 'booking', 'bookings', 'assist', 'approve', 'approval', 'review', 'operation', 'operations', 'analytics', 'report', 'mice', 'content', 'inquiry', 'user', 'role', 'permission', 'calendar block', 'block date', 'decline', 'reject', 'payment', 'proof', 'calendar'])) {
            $sections[] = $this->backendOperationsGuide($user, $message, $knowledgePack);
        }

        if (! $isBackendSurface && $this->mentions($lower, ['payment', 'pay', 'proof', 'downpayment', 'down payment', 'balance', 'gcash', 'receipt', 'bond', 'unpaid'])) {
            $sections[] = $this->paymentGuide($user);
        }

        if (! $isBackendSurface && $this->mentions($lower, ['book', 'booking', 'reservation', 'reserve', 'event', 'schedule', 'request', 'step', 'how', 'submit'])) {
            $sections[] = $this->bookingGuide($user);
        }

        if ($this->mentions($lower, ['calendar', 'available', 'availability', 'date', 'fully booked', 'blocked', 'vacant', 'slot'])) {
            $sections[] = $dates === []
                ? 'To check exact availability, send a complete date such as “June 20, 2026” or “2026-06-20”. I will explain the day status and whether you should proceed, choose another block, or wait for BCCC confirmation. Final approval still depends on BCCC review.'
                : null;
        }

        if ($this->mentions($lower, ['requirement', 'requirements', 'document', 'mice', 'survey', 'form', 'needed', 'upload'])) {
            $sections[] = $this->requirementsGuide();
        }

        if ($this->mentions($lower, ['area', 'venue', 'rental', 'hall', 'dressing', 'room', 'capacity', 'price', 'rate', 'service', 'package'])) {
            $sections[] = $this->venueGuide();
        }

        if ($this->mentions($lower, ['status', 'pending', 'approved', 'declined', 'cancel', 'completed', 'expired', 'notification', 'notice', 'announcement'])) {
            $sections[] = $this->statusGuide($user);
        }

        if ($this->mentions($lower, ['device', 'login', 'security', 'two factor', '2fa', 'remember me', 'password', 'trusted'])) {
            $sections[] = $this->securityGuide($user);
        }

        if ($this->mentions($lower, ['contact', 'phone', 'email', 'office', 'location', 'address', 'where'])) {
            $sections[] = $this->contactGuide();
        }

        if ($this->mentions($lower, ['faq', 'help', 'guide', 'what can you do'])) {
            $sections[] = $this->capabilityGuide($user, $knowledgePack);
        }

        $sections = array_values(array_filter($sections));
        $systemSearch = is_array(data_get($knowledgePack, 'system_search')) ? data_get($knowledgePack, 'system_search') : [];
        $systemSearchAnswer = $this->systemSearchAnswer($systemSearch);

        if ($sections === []) {
            $sections[] = $systemSearchAnswer ?: $this->defaultAnswer($user, $knowledgePack);
        } elseif ($systemSearchAnswer && (int) data_get($systemSearch, 'confidence', 0) >= 72) {
            $sections[] = $systemSearchAnswer;
        }

        return [
            'answer' => $this->compactAssistantAnswer(implode("\n\n", $sections), $isBackendSurface),
            'mode' => 'local',
            'suggestions' => $this->suggestions($message, $dates, $user, $knowledgePack),
            'confidence' => (int) data_get($systemSearch, 'confidence', $sections === [] ? 35 : 60),
            'source_count' => (int) data_get($systemSearch, 'source_count', 0),
            'learned' => (int) data_get($systemSearch, 'source_count', 0) > 0,
        ];
    }

    /** @return array<int, string> */
    public function extractDates(string $message): array
    {
        preg_match_all('/\b(20\d{2})[-\/](0?[1-9]|1[0-2])[-\/](0?[1-9]|[12]\d|3[01])\b/', $message, $isoMatches, PREG_SET_ORDER);
        preg_match_all('/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+20\d{2}\b/i', $message, $textMatches);

        $dates = [];

        foreach ($isoMatches as $match) {
            try {
                $dates[] = Carbon::createFromDate((int) $match[1], (int) $match[2], (int) $match[3], config('app.timezone'))->format('Y-m-d');
            } catch (\Throwable) {
                // Ignore invalid dates like 2026-02-31.
            }
        }

        foreach ($textMatches[0] ?? [] as $match) {
            try {
                $dates[] = Carbon::parse($match, config('app.timezone'))->format('Y-m-d');
            } catch (\Throwable) {
                // Ignore unparseable date text.
            }
        }

        return collect($dates)->unique()->values()->all();
    }

    /**
     * @param  array<int, string>  $dates
     * @param  array<string, mixed>  $knowledgePack
     * @return array<int, string>
     */
    public function suggestions(string $message = '', array $dates = [], ?User $user = null, array $knowledgePack = []): array
    {
        $surface = (string) data_get($knowledgePack, 'audience.surface', $user ? 'client' : 'public');
        if ($surface === 'backend' && $user) {
            $role = $this->backendRole($user);

            $base = match ($role) {
                'admin' => [
                    'What should I check first today?',
                    'How do I approve a booking?',
                    'How do I review payments?',
                    'How do I manage calendar blocks?',
                    'How do I update content or users?',
                ],
                'manager' => [
                    'What needs manager review?',
                    'How do I approve or decline a booking?',
                    'How do I verify payment proof?',
                    'How do I check MICE reports?',
                    'What analytics should I review?',
                ],
                'staff' => [
                    'How do I assist a client booking?',
                    'How do I check availability?',
                    'How do I send a client notice?',
                    'How do I prepare booking documents?',
                    'What status should I update?',
                ],
                default => [
                    'What can I do in the backend?',
                    'How do I review bookings?',
                    'How do I check calendar schedules?',
                    'How do I review payments?',
                    'How do I use notifications?',
                ],
            };

            return array_values(array_slice(array_unique($base), 0, 5));
        }

        $base = [
            'How do I book an event?',
            'What requirements do I need?',
            'What payment notices should I watch?',
            'Explain booking status',
        ];

        if ($dates === []) {
            array_unshift($base, 'Check availability on June 20, 2026');
        } else {
            $base[] = 'What should I do if my selected date is unavailable?';
        }

        if ($user) {
            $base[] = 'How does 2FA and trusted devices work?';
            $base[] = 'What should I check in my notifications?';
        } elseif ($surface === 'public') {
            $base[] = 'Where can I see the public calendar?';
            $base[] = 'How can I contact BCCC?';
        }

        return array_values(array_slice(array_unique($base), 0, 5));
    }

    /** @return array<string, mixed> */
    private function systemFacts(string $surface): array
    {
        return [
            'name' => config('app.name', 'BCCC EASE'),
            'timezone' => config('app.timezone', 'Asia/Manila'),
            'surface' => $surface,
            'purpose' => 'Baguio Convention and Cultural Center Events Access Scheduling Engine for public information, event booking, calendar availability, booking lifecycle notices, payment proof tracking, and MICE/reporting requirements.',
            'assistant_guided_booking' => [
                'The assistant can guide booking drafts step by step from chat.',
                'It may ask for date range, package or manual venue/services, event type, and guest count.',
                'It should prepare a Book Event link with safe query parameters, but the user must still review the form, complete required contact/MICE fields, acknowledge policies, and submit.',
                'Never claim a booking was officially submitted or approved unless the system confirms it.',
            ],
            'public_navigation' => [
                'Home' => '/',
                'Facilities' => '/facilities',
                'Events' => '/events',
                'Calendar' => '/calendar',
                'Guidelines' => '/guidelines',
                'FAQs' => '/faqs',
                'Contact' => '/contact',
                'Book Event' => '/book',
            ],
            'client_navigation' => [
                'Dashboard' => '/my-dashboard',
                'My Calendar' => '/my-calendar',
                'My Bookings' => '/my-bookings',
                'Book Event' => '/book',
                'Notifications' => '/notifications',
            ],
            'backend_navigation_note' => 'Admin, manager, and staff booking pages use role prefixes such as /admin/bookings, /manager/bookings, and /staff/bookings.',
            'backend_navigation' => [
                'Admin Dashboard' => '/admin/dashboard',
                'Admin Calendar' => '/admin/calendar',
                'Admin Bookings' => '/admin/bookings',
                'New Admin Booking' => '/admin/bookings/create',
                'Payment Review' => '/admin/payments/review',
                'MICE Registry' => '/admin/reports/mice-registry',
                'Analytics' => '/admin/analytics',
                'Content Manager' => '/admin/content',
                'Guidelines & Contacts' => '/admin/guidelines-contacts',
                'Public Inquiries' => '/admin/inquiries',
                'Venue Areas' => '/admin/venue-areas',
                'Rental Options' => '/admin/rental-options',
                'Users & Roles' => '/admin/users',
            ],
        ];
    }

    private function normalizeSurface(string $surface): string
    {
        $surface = strtolower(trim($surface));

        return in_array($surface, ['public', 'client', 'backend'], true) ? $surface : 'public';
    }

    private function roleHint(?User $user, string $surface): string
    {
        if (! $user) {
            return $surface === 'backend' ? 'backend visitor without authenticated private data' : 'public visitor';
        }

        $roles = method_exists($user, 'getRoleNames')
            ? $user->getRoleNames()->implode(', ')
            : (string) ($user->role ?? 'client');

        return $roles !== '' ? $roles : 'authenticated user';
    }

    /** @param array<int, string> $dates */
    private function availabilityFacts(array $dates): array
    {
        return collect($dates)
            ->take(5)
            ->map(function (string $date): array {
                try {
                    $status = $this->bookingService->getPublicDayStatus($date, '');

                    return [
                        'date' => Carbon::parse($date)->format('Y-m-d'),
                        'human_date' => Carbon::parse($date)->format('F d, Y'),
                        'title' => (string) ($status['title'] ?? 'Availability checked'),
                        'description' => (string) ($status['description'] ?? ''),
                        'can_proceed' => (bool) ($status['can_proceed'] ?? false),
                        'blocks' => $this->normalizeAvailabilityBlocks($status['blocks'] ?? []),
                    ];
                } catch (\Throwable $exception) {
                    report($exception);

                    return [
                        'date' => $date,
                        'human_date' => $date,
                        'title' => 'Availability could not be verified',
                        'description' => 'The calendar service did not return a reliable result for this date.',
                        'can_proceed' => false,
                        'blocks' => [],
                    ];
                }
            })
            ->values()
            ->all();
    }

    private function normalizeAvailabilityBlocks(mixed $blocks): array
    {
        return collect(is_array($blocks) ? $blocks : [])
            ->map(function (mixed $block, mixed $key): array {
                if (is_bool($block)) {
                    return [
                        'label' => Str::headline((string) $key),
                        'available' => $block,
                        'reason' => null,
                    ];
                }

                if (! is_array($block)) {
                    return [];
                }

                return [
                    'label' => (string) ($block['label'] ?? $block['key'] ?? Str::headline((string) $key)),
                    'available' => (bool) ($block['is_available'] ?? $block['isAvailable'] ?? ! ($block['booked'] ?? false)),
                    'reason' => filled($block['reason'] ?? null) ? (string) $block['reason'] : null,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function clientRecentBookings(User $user): array
    {
        if (! Schema::hasTable('bookings')) {
            return [];
        }

        $hasCreatedBy = Schema::hasColumn('bookings', 'created_by_user_id');
        $hasClientEmail = Schema::hasColumn('bookings', 'client_email') && filled($user->email);

        if (! $hasCreatedBy && ! $hasClientEmail) {
            return [];
        }

        $query = Booking::query()
            ->where(function ($inner) use ($user, $hasCreatedBy, $hasClientEmail): void {
                if ($hasCreatedBy) {
                    $inner->where('created_by_user_id', $user->id);
                }

                if ($hasClientEmail) {
                    $hasCreatedBy
                        ? $inner->orWhere('client_email', $user->email)
                        : $inner->where('client_email', $user->email);
                }
            });

        return $query
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(fn (Booking $booking): array => [
                'id' => $booking->id,
                'title' => $booking->display_title,
                'date_from' => optional($booking->booking_date_from)->format('Y-m-d'),
                'date_to' => optional($booking->booking_date_to)->format('Y-m-d'),
                'booking_status' => $booking->booking_status,
                'payment_status' => $booking->payment_status,
                'link' => '/my-bookings/'.$booking->id,
            ])
            ->values()
            ->all();
    }

    private function clientRecentNotices(User $user): array
    {
        if (! Schema::hasTable('user_notifications')) {
            return [];
        }

        return UserNotification::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (UserNotification $notice): array => [
                'title' => $notice->title,
                'message' => Str::limit((string) $notice->message, 280),
                'kind' => $notice->kind,
                'severity' => $notice->severity,
                'read' => $notice->read_at !== null,
                'created_at' => optional($notice->created_at)->toDateTimeString(),
                'link' => $notice->link,
            ])
            ->values()
            ->all();
    }

    private function venueAndRateFacts(): array
    {
        $areas = class_exists(VenueAreaCatalog::class)
            ? VenueAreaCatalog::displayNames(VenueAreaCatalog::activeSelectableKeys())
            : [];

        $venueSpaces = [];
        if (Schema::hasTable('venue_spaces')) {
            $venueSpaces = VenueSpace::query()
                ->orderBy('sort_order')
                ->orderBy('title')
                ->limit(8)
                ->get(['title', 'category', 'capacity', 'short_description', 'summary'])
                ->map(fn (VenueSpace $space): array => [
                    'title' => $space->title,
                    'category' => $space->category,
                    'capacity' => $space->capacity,
                    'summary' => $space->summary ?: $space->short_description,
                ])
                ->values()
                ->all();
        }

        $serviceTypes = [];
        if (Schema::hasTable('service_types') && Schema::hasTable('services')) {
            $serviceTypes = ServiceType::query()
                ->with(['services' => fn ($query) => $query->orderBy('name')->limit(8)])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->limit(8)
                ->get()
                ->map(fn (ServiceType $type): array => [
                    'name' => $type->name,
                    'description' => $type->description,
                    'capacity' => $type->capacity ?: trim(collect([$type->min_capacity, $type->max_capacity])->filter()->implode(' - ')),
                    'options_note' => $type->options_note,
                    'services' => $type->services->map(fn (Service $service): array => [
                        'name' => $service->name,
                        'description' => $service->description,
                        'uom' => $service->uom,
                        'price' => $service->price !== null ? 'PHP '.number_format((float) $service->price, 2) : null,
                        'quantity' => $service->quantity,
                        'capacity_note' => $service->capacity_note,
                    ])->values()->all(),
                ])
                ->values()
                ->all();
        }

        return [
            'catalog_area_names' => array_values(array_slice($areas, 0, 20)),
            'venue_spaces' => $venueSpaces,
            'service_types' => $serviceTypes,
            'computation_note' => 'The booking computation depends on selected venue area/package, schedule date count, time block, rentals/add-ons, dressing rooms, and post-event charges when applicable. Final computation is only official after BCCC review/finalization.',
        ];
    }

    private function bookingLifecycleFacts(): array
    {
        return [
            'Pending' => 'Submitted by the client and waiting for BCCC checking.',
            'Under Review' => 'BCCC staff are checking details, schedule, requirements, and computation.',
            'Pencil-booked / Confirmed' => 'The schedule may be temporarily held or ready for the next payment/compliance step. Watch payment deadlines.',
            'Approved / Active' => 'The booking is accepted and should appear in the approved calendar scope when public visibility applies.',
            'Completed' => 'The event schedule has ended and post-event/final computation steps may follow.',
            'Declined / Expired / Cancelled' => 'The request will not proceed unless BCCC reopens it or the client submits a new request.',
        ];
    }

    private function paymentFacts(): array
    {
        return [
            'Upload or record payment proof only in the matching booking details page.',
            'The client must monitor down payment, full payment, remaining balance, bond, and proof-review notices in Notifications and My Bookings.',
            'A payment is not final until BCCC reviews it and the booking/payment status changes in the system.',
            'Bond/payment handling follows the booking computation and official BCCC review.',
        ];
    }

    private function requirementFacts(): array
    {
        return [
            'Complete contact details, organization/company details, event title/type, expected guest count, date range, time blocks, and selected venue/rental options.',
            'Confirm public calendar title visibility if the event should appear on the public calendar.',
            'Submit MICE survey/report information and proof documents when the booking workflow asks for them.',
            'Keep payment proof and supporting files clear/readable to avoid review delays.',
        ];
    }

    private function contactFacts(): array
    {
        if (! Schema::hasTable('site_settings')) {
            return [];
        }

        $settings = SiteSetting::query()->first();

        if (! $settings) {
            return [];
        }

        return [
            'address' => $settings->address,
            'phone' => $settings->phone,
            'email' => $settings->email,
            'map_url' => $settings->open_map_url,
        ];
    }

    private function publicLinks(): array
    {
        return [
            'Book Event' => '/book',
            'Public Calendar' => '/calendar',
            'Facilities' => '/facilities',
            'Guidelines' => '/guidelines',
            'FAQs' => '/faqs',
            'Contact' => '/contact',
        ];
    }

    private function backendAssistantFacts(?User $user, string $surface): array
    {
        if ($surface !== 'backend' || ! $user) {
            return [];
        }

        $role = $this->backendRole($user);

        return [
            'role' => $role,
            'purpose' => 'Guide authenticated backend users through safe admin, manager, and staff workflows without exposing secrets or private records outside their permissions.',
            'daily_checklist' => [
                'Open Dashboard and review pending bookings, upcoming events, unpaid balances, payment proof alerts, and recent notifications.',
                'Open Calendar to confirm blocked dates, approved schedules, and possible conflicts before approving requests.',
                'Open Bookings to review client details, selected venues/rentals, computation, requirements, and lifecycle status.',
                'Open Payment Review to verify clear proof, match amount/date/reference, and approve or reject with a reason.',
                'Open MICE Registry and reports when event/tourism reporting must be prepared, printed, or exported.',
            ],
            'admin_only' => [
                'Use Content Manager for public homepage, facilities, tourism office, events, and website sections.',
                'Use Guidelines & Contacts for public policy text, contact information, and office instructions.',
                'Use Venue Areas and Rental Options to maintain service types, venue spaces, rates, rentals, and add-ons.',
                'Use Users & Roles to assign accounts, roles, and permissions carefully.',
                'Use Analytics to review revenue, unpaid balance, monthly bookings, guests, trends, and operational performance.',
            ],
            'manager_focus' => [
                'Review bookings, approvals, payments, MICE registry, and reports.',
                'Verify before approving: no schedule conflict, complete requirements, correct computation, and payment status consistency.',
            ],
            'staff_focus' => [
                'Assist clients, check availability, create assisted bookings, prepare records, send notices, and monitor daily schedules.',
                'Escalate approval, major computation changes, or uncertain payment issues to manager/admin.',
            ],
            'safe_answer_rules' => [
                'Give workflow guidance first, then the exact backend page to open.',
                'Do not invent approvals, payments, rates, or calendar status.',
                'If the question needs a specific record, tell the user to open the matching booking/payment/calendar record.',
            ],
        ];
    }

    private function availabilityAnswer(array $dates): string
    {
        $facts = $this->availabilityFacts($dates);
        $lines = ['Availability check based on the current BCCC EASE calendar:'];

        foreach ($facts as $fact) {
            $blockText = collect($fact['blocks'] ?? [])
                ->map(fn (array $block): string => ($block['label'] ?? 'Block').': '.(($block['available'] ?? false) ? 'available' : 'not available').(! empty($block['reason']) ? ' — '.$block['reason'] : ''))
                ->implode('; ');

            $lines[] = '• '.$fact['human_date'].' — '.$fact['title'].'. '.trim((string) $fact['description']).($blockText ? ' Blocks: '.$blockText.'.' : '');
            $lines[] = $fact['can_proceed']
                ? '  You may proceed to Book Event, but final approval still depends on BCCC review.'
                : '  Please choose another date/block or wait for BCCC confirmation before relying on this schedule.';
        }

        return implode("\n", $lines);
    }

    private function backendOperationsGuide(?User $user, string $message, array $knowledgePack = []): string
    {
        $role = $this->backendRole($user);
        $lower = mb_strtolower($message);

        if ($this->mentions($lower, ['today', 'first', 'dashboard', 'start', 'checklist', 'monitor'])) {
            return "Admin daily checklist:
• Open Dashboard to review pending bookings, upcoming schedules, unpaid balances, and alerts.
• Open Bookings for requests needing review or status action.
• Open Calendar before approving to avoid schedule conflicts.
• Open Payment Review for submitted proof and bond/down-payment updates.
• Open Notifications/Inquiries for client messages and items that need response.";
        }

        if ($this->mentions($lower, ['approve', 'approval', 'decline', 'reject', 'pending', 'under review'])) {
            return "Booking approval guide:
• Open the matching booking record in Bookings.
• Check date/time conflicts, selected venue/rentals, client details, requirements, and service computation.
• Confirm payment/bond requirement if the workflow needs it.
• Approve only when details are complete and the schedule is valid; otherwise decline/request correction with a clear reason.
• After action, tell the client to check Notifications/My Bookings for the official update.";
        }

        if ($this->mentions($lower, ['payment', 'proof', 'paid', 'reject', 'approve proof', 'bond', 'balance'])) {
            return "Payment review guide:
• Open Payment Review or the booking payment section.
• Verify proof image/file, amount, reference number, date, payer, and matching booking.
• Approve only if the proof matches the official computation. Reject/mark failed if unclear or incorrect and provide a reason.
• Confirm whether the payment is down payment, full payment, balance, or bond-related, then recheck the booking payment status.";
        }

        if ($this->mentions($lower, ['calendar', 'block', 'availability', 'schedule', 'conflict'])) {
            return "Calendar management guide:
• Open Calendar or Calendar Manage.
• Check approved bookings, pending requests, blocked dates, and public event schedules.
• Add blocks only for official unavailable dates, maintenance, office instructions, or reserved periods.
• Before approving a booking, confirm the selected block/time is still clear.
• If there is a conflict, keep the official calendar/booking record as the source of truth.";
        }

        if ($this->mentions($lower, ['mice', 'report', 'registry', 'tourism', 'export', 'print'])) {
            return "MICE/report guide:
• Open MICE Registry from Review & Reports.
• Create or update the event record with correct event type, scope, participants/guests, dates, and classification.
• Use Print or Export for official reporting copies.
• Verify details against the booking before submission or printing.";
        }

        if ($this->mentions($lower, ['content', 'website', 'public', 'facility', 'guideline', 'contact', 'inquiry', 'tourism'])) {
            return "Public website/admin content guide:
• Use Content Manager for homepage, facilities, tourism office/team, public events, and visible website sections.
• Use Guidelines & Contacts for policies, instructions, office contact details, and public booking guidance.
• Use Public Inquiries to read and respond to messages from the Contact page.
• After changes, check the public page to confirm the display is correct.";
        }

        if ($this->mentions($lower, ['user', 'role', 'permission', 'account', 'staff', 'manager'])) {
            return "Users & roles guide:
• Open Users & Roles.
• Assign Admin, Manager, Staff, or Client roles based on actual responsibility.
• Give the least permission needed for the job.
• For suspicious access, ask the user to enable 2FA and review logged-in devices in Account Preferences.
• Avoid sharing passwords or API keys in chat, screenshots, or source code.";
        }

        return match ($role) {
            'admin' => "Admin assistant guide:
• Dashboard: monitor operations and alerts.
• Calendar: manage availability and blocks.
• Bookings: review, approve/decline, update statuses, print documents, and check computation.
• Payment Review: approve/reject proof and verify bond/balance.
• Reports/MICE: prepare tourism reporting.
• Content/Setup: maintain public content, venue areas, rentals, users, and roles.",
            'manager' => "Manager assistant guide:
• Review bookings and approve/decline only after checking schedule, requirements, computation, and payment status.
• Use Payment Review for proofs and MICE Registry for reporting.
• Use Analytics/Calendar to monitor operations before decisions.",
            'staff' => "Staff assistant guide:
• Assist clients with bookings, availability, requirements, and notices.
• Use Calendar before creating or updating requests.
• Prepare booking documents and escalate approvals, uncertain payments, or conflicts to manager/admin.",
            default => 'Backend assistant guide: use Dashboard, Calendar, Bookings, Payment Review, Reports, Notifications, and Settings based on your assigned role and permissions.',
        };
    }

    private function bookingGuide(?User $user): string
    {
        $prefix = $user
            ? 'Booking guide for your account:'
            : 'Public booking guide:';

        return $prefix."\n• Ask me: “Guide me to book June 12-14, 2026” and I will collect the needed draft details: date range, package or manual areas, event type, and estimated guests.\n• After the guided questions, I can save a booking draft for logged-in users or prepare a safe prefilled Book Event link for public visitors.\n• Open [Book Event](/book), verify the selected schedule, choose a ready package or manual venue/service areas, then review the service computation.\n• Complete contact details, organization/address fields, event/MICE details, acknowledgements, and any required proof before submission.\n• The assistant can prepare the draft, but the official booking is created only after the user reviews the form and clicks Submit.\n• After submission, monitor [My Bookings](/my-bookings) and [Notifications](/notifications) for review, payment, requirements, approval, cancellation, completion, and final computation updates.".($user ? '' : "\nFor private tracking and saved drafts, sign in or create an account when the system asks.");
    }

    private function paymentGuide(?User $user): string
    {
        return "Payment guide:\n• Use only the official amount shown in the booking record.\n• Upload clear payment proof under the matching booking.\n• Watch notices for down payment, full payment, balance, bond, proof review, and due dates.\n• A payment is final only when BCCC EASE updates the booking/payment status.".($user ? '' : "\nPublic visitors must log in or submit a booking before seeing private payment records.");
    }

    private function requirementsGuide(): string
    {
        return "Requirements guide:\n• Complete client/contact and organization details.\n• Provide event title, type, expected guests, selected dates/time blocks, and venue/rental choices.\n• Submit MICE/survey details when the workflow asks for them.\n• Upload clear proof files only, so staff can review faster.";
    }

    private function statusGuide(?User $user): string
    {
        $recent = $user ? collect($this->clientRecentBookings($user))
            ->map(fn (array $booking): string => sprintf('• %s — booking: %s, payment: %s', $booking['title'], $booking['booking_status'] ?: 'not set', $booking['payment_status'] ?: 'not set'))
            ->take(3)
            ->implode("\n") : '';

        $publicNote = $user ? '' : ' Public visitors cannot see private booking statuses until they sign in. Use the public calendar for general availability and log in to track submitted requests.';

        return 'Status guide: Pending means submitted; Under Review means BCCC is checking; Pencil-booked/Confirmed means the slot/payment step may be active; Approved/Active means accepted; Completed means the event lifecycle finished; Declined/Expired/Cancelled means it cannot proceed unless reopened or submitted again.'.$publicNote.($recent ? "\n\nYour recent booking status snapshot:\n{$recent}" : '');
    }

    private function venueGuide(): string
    {
        $facts = $this->venueAndRateFacts();
        $areas = collect($facts['catalog_area_names'] ?? [])->take(10)->implode(', ');
        $serviceTypes = collect($facts['service_types'] ?? [])
            ->take(5)
            ->map(fn (array $type): string => (string) ($type['name'] ?? ''))
            ->filter()
            ->implode(', ');

        return 'Venue and rental guide: choose the venue area, package, rentals, and add-ons that match the event. The computation uses selected dates/time blocks, quantity, services, and rentals. Known options include '.($areas ?: 'the venue areas configured by BCCC').'.'.($serviceTypes ? ' Service groups: '.$serviceTypes.'.' : '').' Final rates must still be verified in the official booking record.';
    }

    private function securityGuide(?User $user): string
    {
        return "Account security guide:\n• 2FA requires verification during login when enabled.\n• Remember Me keeps login convenient after successful verification.\n• Account Preferences shows logged-in devices, browser/platform, IP/location label, and remembered status.\n• Remove any device you do not recognize.".($user ? "\nOpen Account Preferences to review your devices." : "\nPlease log in before managing account devices.");
    }

    private function contactGuide(): string
    {
        $contacts = $this->contactFacts();

        if ($contacts === []) {
            return 'Contact guide: use the Contact page for official BCCC office details, map/location, phone/email, and inquiries.';
        }

        $parts = collect([
            ! empty($contacts['address']) ? 'Address: '.$contacts['address'] : null,
            ! empty($contacts['phone']) ? 'Phone: '.$contacts['phone'] : null,
            ! empty($contacts['email']) ? 'Email: '.$contacts['email'] : null,
        ])->filter()->implode("\n");

        return 'Contact guide: use the Contact page for official BCCC coordination.'.($parts ? "\n{$parts}" : '');
    }

    private function capabilityGuide(?User $user, array $knowledgePack = []): string
    {
        $surface = (string) data_get($knowledgePack, 'audience.surface', $user ? 'client' : 'public');

        if ($surface === 'backend') {
            return 'I can help backend users with dashboard monitoring, booking approval flow, calendar blocks, payment review, bond/balance checks, MICE reports, content manager, public inquiries, venue/rental setup, users/roles, notifications, and account security. I will guide the workflow and point you to the correct admin page without exposing secrets.';
        }

        return 'I can help with booking steps, guided booking drafts, date availability, venue/rental guidance, requirements, payments, booking statuses, notifications, account security, and the current page. Try “Guide me to book June 12-14, 2026” and I will ask the missing details, prepare a draft/prefilled form link, and guide you until submission review.'.($surface !== 'public' ? ' I can also summarize your own recent bookings/notices safely.' : ' Please log in for private booking records and saved booking drafts.');
    }



    private function compactAssistantAnswer(string $answer, bool $isBackendSurface): string
    {
        $answer = trim(preg_replace("/\n{3,}/", "\n\n", $answer) ?: $answer);
        $limit = $isBackendSurface ? 2200 : 1800;

        if (mb_strlen($answer) <= $limit) {
            return $answer;
        }

        return Str::limit(
            $answer,
            $limit,
            "\n\nPlease open the exact BCCC EASE page or record to confirm the latest official details."
        );
    }

    private function systemSearchAnswer(array $systemSearch): ?string
    {
        $direct = trim((string) data_get($systemSearch, 'direct_answer', ''));

        if ($direct !== '') {
            return $direct;
        }

        $sources = collect(data_get($systemSearch, 'sources', []))
            ->take(4)
            ->filter(fn ($source): bool => is_array($source) && filled($source['summary'] ?? null))
            ->values();

        if ($sources->isEmpty()) {
            return null;
        }

        $lines = ['I searched the connected BCCC EASE records and found these closest matches:'];
        foreach ($sources as $source) {
            $lines[] = '• '.((string) ($source['title'] ?? 'System source')).' — '.((string) ($source['summary'] ?? ''));
        }

        if ((int) data_get($systemSearch, 'confidence', 0) < 60) {
            $lines[] = 'This is a low-confidence match, so please confirm the final detail with the exact booking record, calendar, notification, or BCCC staff.';
        }

        return implode("\n", $lines);
    }

    private function defaultAnswer(?User $user, array $knowledgePack = []): string
    {
        $unread = $user && Schema::hasTable('user_notifications')
            ? UserNotification::query()->where('user_id', $user->id)->whereNull('read_at')->count()
            : 0;
        $page = (string) data_get($knowledgePack, 'page_context.label', 'this page');

        if ($this->isBackendSurface($user, $knowledgePack)) {
            return 'I can help with admin/backend tasks on '.$page.': dashboard checks, booking approval, payment review, calendar blocks, MICE reports, content manager, public inquiries, venue/rental setup, users/roles, notifications, and account security.'.($unread > 0 ? " You have {$unread} unread notice(s); open Notifications for the latest updates." : '').' Ask something like “What should I check first today?” or “How do I approve a booking?”';
        }

        return 'I can help with booking, guided booking drafts, availability, venue/rental options, payments, statuses, requirements, notices, account security, and FAQs. You are currently on '.$page.'.'.($unread > 0 ? " You have {$unread} unread notice(s); open [Notifications](/notifications) for the latest updates." : '').' For availability, send a date such as “Is June 20, 2026 available?” For guided booking, ask “Guide me to book June 12-14, 2026.”';
    }

    private function isBackendSurface(?User $user, array $knowledgePack = []): bool
    {
        return (string) data_get($knowledgePack, 'audience.surface', '') === 'backend'
            || ($user !== null && in_array($this->backendRole($user), ['admin', 'manager', 'staff'], true));
    }

    private function backendRole(?User $user): string
    {
        if (! $user || ! method_exists($user, 'hasRole')) {
            return 'backend';
        }

        if ($user->hasRole('admin')) {
            return 'admin';
        }

        if ($user->hasRole('manager')) {
            return 'manager';
        }

        if ($user->hasRole('staff')) {
            return 'staff';
        }

        return 'backend';
    }

    private function mentions(string $text, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (str_contains($text, $needle)) {
                return true;
            }
        }

        return false;
    }
}
