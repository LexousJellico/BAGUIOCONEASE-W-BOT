<?php

namespace App\Services;

use App\Models\AssistantKnowledgeEntry;
use App\Models\AssistantQuestionLog;
use App\Models\Booking;
use App\Models\CalendarBlock;
use App\Models\FeaturePackage;
use App\Models\PublicEvent;
use App\Models\Service;
use App\Models\ServiceType;
use App\Models\SiteSetting;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\VenueSpace;
use App\Support\BcccBookingPolicyCatalog;
use App\Support\BookingScheduleCatalog;
use App\Support\DressingRoomCatalog;
use App\Support\MiceReportCatalog;
use App\Support\VenuePackageCatalog;
use App\Support\VenueRateCatalog;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AssistantSystemSearchService
{
    /** @return array<string, mixed> */
    public function search(?User $user, string $message, array $dates = [], array $pageContext = []): array
    {
        $surface = $this->normalizeSurface((string) ($pageContext['surface'] ?? ($user ? 'client' : 'public')));
        $terms = $this->terms($message);
        $sources = [];

        $sources = array_merge($sources, $this->searchReviewedKnowledge($terms, $surface));
        $sources = array_merge($sources, $this->searchApprovedCorrections($terms, $surface));
        $sources = array_merge($sources, $this->staticPolicySources($message, $terms));
        $sources = array_merge($sources, $this->backendWorkflowSources($user, $message, $terms, $surface));
        $sources = array_merge($sources, $this->searchPublicContent($terms));
        $sources = array_merge($sources, $this->searchCalendarContext($terms, $dates));
        $sources = array_merge($sources, $this->searchUserContext($user, $terms, $surface));
        $sources = array_merge($sources, $this->searchBackendContext($user, $terms, $surface));

        $sources = collect($sources)
            ->filter(fn (array $source): bool => filled($source['summary'] ?? null))
            ->map(function (array $source) use ($terms): array {
                $source['summary'] = Str::limit(trim(preg_replace('/\s+/', ' ', (string) $source['summary']) ?: ''), 950, '...');
                $source['title'] = Str::limit((string) ($source['title'] ?? 'System source'), 140, '');
                $source['confidence'] = max(0, min(100, (int) ($source['confidence'] ?? 60)));
                $source['score'] = (int) ($source['score'] ?? $source['confidence']);
                $source['term_matches'] = $this->matchingTermCount(implode(' ', [
                    $source['title'],
                    $source['summary'],
                    (string) ($source['category'] ?? ''),
                ]), $terms);

                return $source;
            })
            ->filter(fn (array $source): bool => $terms === []
                || (int) $source['term_matches'] >= (count($terms) >= 3 ? 2 : 1))
            ->sortByDesc(fn (array $source): int => ((int) $source['score'] * 2) + (int) $source['confidence'])
            ->unique(fn (array $source): string => implode('|', [
                (string) ($source['type'] ?? 'source'),
                (string) ($source['id'] ?? ''),
                Str::lower((string) ($source['title'] ?? '')),
            ]))
            ->take(16)
            ->values()
            ->all();

        $confidence = $this->confidence($sources, $dates, $terms);
        $directAnswer = $this->directAnswer($sources, $confidence, $surface);

        return [
            'query_terms' => $terms,
            'surface' => $surface,
            'confidence' => $confidence,
            'source_count' => count($sources),
            'sources' => $sources,
            'direct_answer' => $directAnswer,
            'needs_human_review' => $confidence < 48,
            'learning_policy' => [
                'type' => 'retrieval_augmented_assistant',
                'meaning' => 'The assistant does not train a private AI model inside production. It improves safely by searching trusted BCCC EASE database records, reviewed knowledge entries, corrections, booking/calendar tables, content manager data, and user feedback logs before answering.',
                'unanswered_questions' => 'Low-confidence questions are logged for review so staff/admins can add corrected knowledge later.',
            ],
        ];
    }

    /** @return array<int, string> */
    public function terms(string $message): array
    {
        $text = Str::lower(Str::ascii($message));
        $text = preg_replace('/[^a-z0-9\s#-]+/', ' ', $text) ?: '';
        $tokens = preg_split('/\s+/', $text) ?: [];
        $stop = array_flip([
            'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'what', 'when', 'where', 'which', 'about', 'how', 'why', 'can', 'could', 'should', 'would', 'please', 'need', 'needs', 'want', 'wants', 'user', 'client', 'system', 'bccc', 'ease', 'booking', 'bookings', 'event', 'events', 'page', 'tell', 'give', 'show', 'explain', 'complete', 'detail', 'details', 'does', 'have', 'has', 'are', 'was', 'were', 'will', 'all', 'any', 'is', 'to', 'of', 'in', 'on', 'at', 'as', 'or', 'my', 'me', 'i', 'it', 'a', 'an',
        ]);

        return collect($tokens)
            ->map(fn (string $token): string => trim($token, " \t\n\r\0\x0B-#"))
            ->filter(fn (string $token): bool => strlen($token) >= 3 && ! isset($stop[$token]))
            ->unique()
            ->take(20)
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function searchReviewedKnowledge(array $terms, string $surface): array
    {
        if ($terms === [] || ! Schema::hasTable('assistant_knowledge_entries')) {
            return [];
        }

        $allowed = match ($surface) {
            'backend' => ['public', 'client', 'backend'],
            'client' => ['public', 'client'],
            default => ['public'],
        };

        $entries = AssistantKnowledgeEntry::query()
            ->where('is_active', true)
            ->whereIn('visibility', $allowed)
            ->where(function (Builder $query) use ($terms): void {
                foreach ($terms as $term) {
                    $query->orWhere('title', 'like', "%{$term}%")
                        ->orWhere('question', 'like', "%{$term}%")
                        ->orWhere('answer', 'like', "%{$term}%")
                        ->orWhere('category', 'like', "%{$term}%")
                        ->orWhere('source_reference', 'like', "%{$term}%");
                }
            })
            ->orderByDesc('confidence')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get();

        return $entries->map(function (AssistantKnowledgeEntry $entry) use ($terms): array {
            $entry->forceFill([
                'hits' => ((int) $entry->hits) + 1,
                'last_used_at' => now(),
            ])->saveQuietly();

            return [
                'type' => 'reviewed_knowledge',
                'id' => $entry->id,
                'title' => $entry->title,
                'summary' => $entry->answer,
                'category' => $entry->category,
                'visibility' => $entry->visibility,
                'source_reference' => $entry->source_reference,
                'confidence' => (int) $entry->confidence,
                'score' => $this->scoreText($entry->title.' '.$entry->question.' '.$entry->answer, $terms) + (int) $entry->confidence,
            ];
        })->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function searchApprovedCorrections(array $terms, string $surface): array
    {
        if ($terms === [] || ! Schema::hasTable('assistant_question_logs')) {
            return [];
        }

        return AssistantQuestionLog::query()
            ->where('helpful', true)
            ->whereNotNull('corrected_answer')
            ->whereIn('surface', $surface === 'backend' ? ['public', 'client', 'backend'] : ($surface === 'client' ? ['public', 'client'] : ['public']))
            ->where(function (Builder $query) use ($terms): void {
                foreach ($terms as $term) {
                    $query->orWhere('question', 'like', "%{$term}%")
                        ->orWhere('corrected_answer', 'like', "%{$term}%");
                }
            })
            ->latest()
            ->limit(4)
            ->get()
            ->map(fn (AssistantQuestionLog $log): array => [
                'type' => 'approved_feedback_memory',
                'id' => $log->id,
                'title' => 'Reviewed assistant correction',
                'summary' => $log->corrected_answer,
                'category' => 'learned_feedback',
                'visibility' => $log->surface,
                'confidence' => 72,
                'score' => $this->scoreText($log->question.' '.$log->corrected_answer, $terms) + 72,
            ])
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function backendWorkflowSources(?User $user, string $message, array $terms, string $surface): array
    {
        if ($surface !== 'backend' || ! $user || ! $this->isBackendUser($user)) {
            return [];
        }

        $lower = Str::lower($message);
        $sources = [];

        $dailyNeedles = ['dashboard', 'today', 'monitor', 'overview', 'first', 'checklist', 'alert', 'summary'];
        $bookingNeedles = ['booking', 'approve', 'approval', 'decline', 'reject', 'request', 'pending', 'confirmed', 'status', 'document', 'print'];
        $paymentNeedles = ['payment', 'proof', 'paid', 'balance', 'bond', 'down', 'unpaid', 'receipt', 'reference'];
        $calendarNeedles = ['calendar', 'block', 'availability', 'schedule', 'conflict', 'maintenance', 'reserved'];
        $reportNeedles = ['mice', 'report', 'registry', 'tourism', 'analytics', 'export', 'print', 'revenue'];
        $contentNeedles = ['content', 'website', 'public', 'facility', 'guideline', 'contact', 'inquiry', 'tourism office'];
        $setupNeedles = ['user', 'role', 'permission', 'venue area', 'rental', 'service', 'setup', 'rate'];

        if ($terms === [] || $this->mentions($lower, $dailyNeedles)) {
            $sources[] = [
                'type' => 'backend_admin_guide',
                'title' => 'Admin daily dashboard and monitoring checklist',
                'summary' => 'Recommended start: open Dashboard, review pending bookings, upcoming events, unpaid balances, submitted payment proofs, unread notifications, public inquiries, and calendar conflicts. Then process Bookings, Payment Review, Calendar, and MICE/report tasks in priority order.',
                'category' => 'backend_workflow',
                'visibility' => 'backend',
                'confidence' => 92,
                'score' => 92 + $this->scoreText('dashboard today monitor overview checklist pending unpaid payment notifications inquiries calendar conflicts', $terms),
            ];
        }

        if ($this->mentions($lower, $bookingNeedles) || $this->termsMention($terms, $bookingNeedles)) {
            $sources[] = [
                'type' => 'backend_booking_guide',
                'title' => 'Backend booking approval and lifecycle workflow',
                'summary' => 'Use Bookings to open the request, verify client/event details, selected dates/time blocks, venue/rentals/add-ons, requirements, computation, and payment/bond state. Check Calendar for conflicts before approval. Approve only when complete; otherwise decline/request correction with a clear reason. Print reservation/final bill/MICE documents from the booking print actions when needed.',
                'category' => 'backend_booking',
                'visibility' => 'backend',
                'confidence' => 94,
                'score' => 94 + $this->scoreText('booking approve approval decline reject status document print client requirements computation', $terms),
            ];
        }

        if ($this->mentions($lower, $paymentNeedles) || $this->termsMention($terms, $paymentNeedles)) {
            $sources[] = [
                'type' => 'backend_payment_guide',
                'title' => 'Backend payment proof, bond, and balance workflow',
                'summary' => 'Use Payment Review or the booking payment section. Verify proof clarity, amount, reference number, payer, date, and matching booking. Confirm whether it is down payment, full payment, remaining balance, or bond-related. Approve only if proof matches official computation; reject/mark failed with a reason when unclear or incorrect.',
                'category' => 'backend_payment',
                'visibility' => 'backend',
                'confidence' => 94,
                'score' => 94 + $this->scoreText('payment proof bond balance down payment paid receipt reference review approve reject', $terms),
            ];
        }

        if ($this->mentions($lower, $calendarNeedles) || $this->termsMention($terms, $calendarNeedles)) {
            $sources[] = [
                'type' => 'backend_calendar_guide',
                'title' => 'Backend calendar, blocks, and conflict-checking workflow',
                'summary' => 'Use Calendar and Calendar Manage to review approved bookings, pending requests, blocked dates, unavailable days, maintenance periods, and public event schedules. Create blocks only for official unavailable/reserved periods. Always check calendar conflicts before approving a booking or changing a schedule.',
                'category' => 'backend_calendar',
                'visibility' => 'backend',
                'confidence' => 92,
                'score' => 92 + $this->scoreText('calendar block availability schedule conflict maintenance reserved approved pending', $terms),
            ];
        }

        if ($this->mentions($lower, $reportNeedles) || $this->termsMention($terms, $reportNeedles)) {
            $sources[] = [
                'type' => 'backend_reports_guide',
                'title' => 'Backend analytics and MICE reporting workflow',
                'summary' => 'Use Analytics for booking counts, guests, revenue, unpaid balance, monthly trends, and operational performance. Use MICE Registry to create, edit, print, or export tourism/event records. Verify participants, event type/scope/classification, booking dates, and official booking details before printing/exporting.',
                'category' => 'backend_reports',
                'visibility' => 'backend',
                'confidence' => 90,
                'score' => 90 + $this->scoreText('mice registry report tourism analytics revenue export print guests participants', $terms),
            ];
        }

        if ($this->mentions($lower, $contentNeedles) || $this->termsMention($terms, $contentNeedles)) {
            $sources[] = [
                'type' => 'backend_content_guide',
                'title' => 'Admin content manager, public inquiries, and website workflow',
                'summary' => 'Use Content Manager for homepage, facilities, tourism office, public events, and public website sections. Use Guidelines & Contacts for public policy text and office details. Use Public Inquiries to read/respond to messages. After publishing changes, verify the public page display.',
                'category' => 'backend_content',
                'visibility' => 'backend',
                'confidence' => 90,
                'score' => 90 + $this->scoreText('content manager public website facility guideline contact inquiry tourism office', $terms),
            ];
        }

        if ($this->mentions($lower, $setupNeedles) || $this->termsMention($terms, $setupNeedles)) {
            $sources[] = [
                'type' => 'backend_setup_guide',
                'title' => 'Admin setup, venue/rental catalog, users, roles, and permissions workflow',
                'summary' => 'Use Venue Areas and Rental Options to maintain service groups, venue spaces, rental options, rates, quantities, and add-ons. Use Users & Roles to assign Admin, Manager, Staff, or Client access according to responsibility. Use least privilege and ask users to enable 2FA for account security.',
                'category' => 'backend_setup',
                'visibility' => 'backend',
                'confidence' => 90,
                'score' => 90 + $this->scoreText('user role permission venue area rental service setup rate catalog 2fa security', $terms),
            ];
        }

        return $sources;
    }

    /** @return array<int, array<string, mixed>> */
    private function staticPolicySources(string $message, array $terms): array
    {
        $lower = Str::lower($message);
        $sources = [];

        if ($this->mentions($lower, ['virtual tour', 'tour', 'walk-through', 'walkthrough', 'street view', '3d layout'])) {
            $sources[] = [
                'type' => 'public_virtual_tour_guide',
                'title' => 'BCCC virtual tour and convention layout guide',
                'summary' => 'The public Virtual Tour uses a split-screen panorama and live area map. Grounds & Parking and Foyer & Lobby each have three views; Basement, VIP Lounge, and Boardroom each have two. Main Hall starts at the Ground Hall hub with choices for Upper Left, Upper Right, Upper Mid, and Stage; the left and right routes each continue through two views. Gallery 2600 and Backstage are not included as tour destinations. Visitors can drag or touch to look around, use the bottom movement controls, click map cameras, and open fullscreen. Smooth motion-blur transitions connect each route point. The separate 3D Convention Layout presents the matching public venue layers and supports exterior/interior views, selection, drag, zoom, reset, and fullscreen.',
                'category' => 'public_navigation',
                'visibility' => 'public',
                'confidence' => 96,
                'score' => 96 + $this->scoreText('virtual tour walk through street view connected 360 route points main hall ground hall upper left upper right upper mid stage move forward backward drag touch panorama smooth transition fullscreen 3d convention layout', $terms),
            ];
        }

        if ($this->mentions($lower, ['payment', 'pay', 'paid', 'down', 'bond', 'balance', 'unpaid', 'refund', 'cancel', 'penalty', 'discount'])) {
            $notice = BcccBookingPolicyCatalog::finalConfirmationNotice();
            $excluded = BcccBookingPolicyCatalog::excludedUserCharges();
            $sources[] = [
                'type' => 'policy_catalog',
                'title' => 'BCCC payment, bond, review, discount, cancellation, and post-event policy guidance',
                'summary' => 'Required down payment is '.(BcccBookingPolicyCatalog::REQUIRED_DOWN_PAYMENT_RATE * 100).'%. Standard bond amount is ₱'.number_format(BcccBookingPolicyCatalog::REQUIRED_BOND_AMOUNT, 2).'. Final computation may auto-finalize after '.BcccBookingPolicyCatalog::FINAL_COMPUTATION_AUTO_FINALIZE_GRACE_HOURS.' hours after the completed event schedule. Important notices: '.implode(' ', $notice).' Excluded/non-user charges: '.implode(' ', array_slice($excluded, 0, 5)).' Final amounts must still be checked in the official booking record.',
                'category' => 'payment_policy',
                'visibility' => 'public',
                'confidence' => 92,
                'score' => 92 + $this->scoreText('payment bond balance down payment cancellation refund discount final computation', $terms),
            ];
        }

        if ($this->mentions($lower, ['mice', 'report', 'tourism', 'classification', 'survey', 'guest', 'participant'])) {
            $sources[] = [
                'type' => 'mice_catalog',
                'title' => 'MICE survey and report classification guide',
                'summary' => 'MICE event center name: '.MiceReportCatalog::EVENT_CENTER_NAME.'. Event scopes: '.implode(', ', MiceReportCatalog::eventScopes()).'. Event types: '.implode(', ', MiceReportCatalog::eventTypes()).'. Classification guide: '.collect(MiceReportCatalog::classificationInstructions())->map(fn ($value, $key) => "{$key}: {$value}")->implode(' '),
                'category' => 'mice',
                'visibility' => 'public',
                'confidence' => 90,
                'score' => 90 + $this->scoreText('mice report survey classification tourism participants guests event type', $terms),
            ];
        }

        if ($this->mentions($lower, ['dressing', 'room', 'additional', 'add-on', 'addon', 'service'])) {
            $options = collect(DressingRoomCatalog::options())
                ->map(fn (array $option): string => ($option['label'] ?? 'Dressing room').' = ₱'.number_format((float) ($option['charge'] ?? 0), 2).' per day')
                ->implode('; ');
            $sources[] = [
                'type' => 'dressing_room_catalog',
                'title' => 'Dressing room add-on rates',
                'summary' => $options.'. The charge is multiplied by the selected number of event days when the booking computation uses dressing room days.',
                'category' => 'rates',
                'visibility' => 'public',
                'confidence' => 92,
                'score' => 92 + $this->scoreText('dressing room add on additional charge day', $terms),
            ];
        }

        if ($this->mentions($lower, ['rate', 'price', 'fee', 'hall', 'lounge', 'boardroom', 'led', 'package', 'rental', 'venue'])) {
            $rates = collect(VenueRateCatalog::options())
                ->take(12)
                ->map(function (array $option): string {
                    $name = (string) ($option['label'] ?? $option['name'] ?? $option['value'] ?? 'Venue option');
                    $whole = (float) ($option['whole_day'] ?? $option['wholeDay'] ?? $option['whole'] ?? 0);
                    $half = (float) ($option['half_day'] ?? $option['halfDay'] ?? $option['half'] ?? 0);
                    $amounts = collect([
                        $whole > 0 ? 'whole day ₱'.number_format($whole, 2) : null,
                        $half > 0 ? 'half day ₱'.number_format($half, 2) : null,
                    ])->filter()->implode(', ');

                    return trim($name.($amounts ? ': '.$amounts : ''));
                })
                ->filter()
                ->implode('; ');
            $packages = collect(VenuePackageCatalog::defaults())
                ->take(10)
                ->map(fn (array $package): string => (string) ($package['name'] ?? $package['label'] ?? $package['code'] ?? 'Package'))
                ->filter()
                ->implode(', ');

            $sources[] = [
                'type' => 'venue_rate_catalog',
                'title' => 'Venue packages and rental rate catalog',
                'summary' => 'Venue/rental catalog includes: '.($rates ?: 'configured venue rates').'. Package choices include: '.($packages ?: 'configured venue packages').'. Final official rates should be verified in the booking computation and staff review.',
                'category' => 'rates',
                'visibility' => 'public',
                'confidence' => 88,
                'score' => 88 + $this->scoreText('venue rental rate price package hall lounge boardroom led wall', $terms),
            ];
        }

        if ($this->mentions($lower, ['time', 'schedule', 'whole day', 'half day', 'morning', 'afternoon', 'night', 'ingress', 'egress'])) {
            $blocks = collect(BookingScheduleCatalog::baseBlocks())
                ->map(fn (array $block): string => (string) ($block['label'] ?? $block['value'] ?? 'Schedule block').' '.(string) ($block['starts_at'] ?? '').'-'.(string) ($block['ends_at'] ?? ''))
                ->filter()
                ->implode('; ');
            $sources[] = [
                'type' => 'schedule_catalog',
                'title' => 'Booking schedule/time-block guide',
                'summary' => 'Configured schedule blocks: '.($blocks ?: 'whole day, half day, and additional-hour blocks as configured by BCCC EASE').'. Ingress/egress flags may be used for preparation and exit periods when the booking flow asks for them.',
                'category' => 'schedule',
                'visibility' => 'public',
                'confidence' => 84,
                'score' => 84 + $this->scoreText('schedule time block whole day half day ingress egress', $terms),
            ];
        }

        return $sources;
    }

    /** @return array<int, array<string, mixed>> */
    private function searchPublicContent(array $terms): array
    {
        if ($terms === []) {
            return [];
        }

        $sources = [];

        if (Schema::hasTable('venue_spaces')) {
            $spaces = VenueSpace::query()
                ->where(function (Builder $query) use ($terms): void {
                    foreach ($terms as $term) {
                        $query->orWhere('title', 'like', "%{$term}%")
                            ->orWhere('category', 'like', "%{$term}%")
                            ->orWhere('capacity', 'like', "%{$term}%")
                            ->orWhere('short_description', 'like', "%{$term}%")
                            ->orWhere('summary', 'like', "%{$term}%");
                    }
                })
                ->orderBy('sort_order')
                ->limit(6)
                ->get();

            foreach ($spaces as $space) {
                $sources[] = [
                    'type' => 'venue_space',
                    'id' => $space->id,
                    'title' => $space->title,
                    'summary' => trim(collect([
                        $space->category ? 'Category: '.$space->category : null,
                        $space->capacity ? 'Capacity: '.$space->capacity : null,
                        $space->summary ?: $space->short_description,
                    ])->filter()->implode('. ')),
                    'category' => 'venue',
                    'visibility' => 'public',
                    'confidence' => 84,
                    'score' => 84 + $this->scoreText($space->title.' '.$space->category.' '.$space->summary.' '.$space->short_description, $terms),
                ];
            }
        }

        if (Schema::hasTable('service_types')) {
            $types = ServiceType::query()
                ->where(function (Builder $query) use ($terms): void {
                    foreach ($terms as $term) {
                        $query->orWhere('name', 'like', "%{$term}%");
                        if (Schema::hasColumn('service_types', 'description')) {
                            $query->orWhere('description', 'like', "%{$term}%");
                        }
                    }
                })
                ->limit(5)
                ->get();

            foreach ($types as $type) {
                $sources[] = [
                    'type' => 'service_type',
                    'id' => $type->id,
                    'title' => $type->name,
                    'summary' => trim(collect([
                        filled($type->description ?? null) ? (string) $type->description : null,
                        filled($type->capacity ?? null) ? 'Capacity: '.$type->capacity : null,
                        filled($type->options_note ?? null) ? 'Note: '.$type->options_note : null,
                    ])->filter()->implode('. ')) ?: 'Configured venue/rental category in BCCC EASE.',
                    'category' => 'service_type',
                    'visibility' => 'public',
                    'confidence' => 78,
                    'score' => 78 + $this->scoreText($type->name.' '.($type->description ?? ''), $terms),
                ];
            }
        }

        if (Schema::hasTable('services')) {
            $services = Service::query()
                ->with('serviceType')
                ->where(function (Builder $query) use ($terms): void {
                    foreach ($terms as $term) {
                        $query->orWhere('name', 'like', "%{$term}%")
                            ->orWhere('description', 'like', "%{$term}%")
                            ->orWhere('uom', 'like', "%{$term}%");
                    }
                })
                ->limit(8)
                ->get();

            foreach ($services as $service) {
                $sources[] = [
                    'type' => 'rental_service',
                    'id' => $service->id,
                    'title' => $service->name,
                    'summary' => trim(collect([
                        $service->serviceType?->name ? 'Group: '.$service->serviceType->name : null,
                        $service->description,
                        'Unit: '.$service->uom,
                        'Rate: ₱'.number_format((float) $service->price, 2),
                        filled($service->quantity) ? 'Default quantity: '.$service->quantity : null,
                    ])->filter()->implode('. ')),
                    'category' => 'rental_service',
                    'visibility' => 'public',
                    'confidence' => 86,
                    'score' => 86 + $this->scoreText($service->name.' '.$service->description.' '.$service->uom, $terms),
                ];
            }
        }

        if (Schema::hasTable('feature_packages')) {
            $packages = FeaturePackage::query()
                ->where(function (Builder $query) use ($terms): void {
                    foreach ($terms as $term) {
                        $query->orWhere('title', 'like', "%{$term}%")
                            ->orWhere('description', 'like', "%{$term}%");
                    }
                })
                ->orderBy('sort_order')
                ->limit(4)
                ->get();

            foreach ($packages as $package) {
                $sources[] = [
                    'type' => 'public_package',
                    'id' => $package->id,
                    'title' => $package->title,
                    'summary' => $package->description,
                    'category' => 'public_content',
                    'visibility' => 'public',
                    'confidence' => 76,
                    'score' => 76 + $this->scoreText($package->title.' '.$package->description, $terms),
                ];
            }
        }

        if (Schema::hasTable('public_events')) {
            $events = PublicEvent::query()
                ->where('is_public', true)
                ->where(function (Builder $query) use ($terms): void {
                    foreach ($terms as $term) {
                        $query->orWhere('title', 'like', "%{$term}%")
                            ->orWhere('venue', 'like', "%{$term}%")
                            ->orWhere('description', 'like', "%{$term}%")
                            ->orWhere('note', 'like', "%{$term}%");
                    }
                })
                ->orderByDesc('event_date')
                ->limit(5)
                ->get();

            foreach ($events as $event) {
                $sources[] = [
                    'type' => 'public_event',
                    'id' => $event->id,
                    'title' => $event->title,
                    'summary' => trim(collect([
                        'Date: '.optional($event->event_date)->format('F d, Y'),
                        $event->venue ? 'Venue: '.$event->venue : null,
                        $event->description,
                        $event->note,
                    ])->filter()->implode('. ')),
                    'category' => 'public_event',
                    'visibility' => 'public',
                    'confidence' => 76,
                    'score' => 76 + $this->scoreText($event->title.' '.$event->venue.' '.$event->description, $terms),
                ];
            }
        }

        if (Schema::hasTable('site_settings') && $this->termsMention($terms, ['contact', 'phone', 'email', 'address', 'location', 'map', 'office'])) {
            $settings = SiteSetting::query()->first();
            if ($settings) {
                $sources[] = [
                    'type' => 'site_settings',
                    'id' => $settings->id,
                    'title' => 'Official BCCC contact details',
                    'summary' => trim(collect([
                        $settings->address ? 'Address: '.$settings->address : null,
                        $settings->phone ? 'Phone: '.$settings->phone : null,
                        $settings->email ? 'Email: '.$settings->email : null,
                        $settings->open_map_url ? 'Map link is available on the Contact page.' : null,
                        $settings->footer_description,
                    ])->filter()->implode('. ')),
                    'category' => 'contact',
                    'visibility' => 'public',
                    'confidence' => 92,
                    'score' => 96,
                ];
            }
        }

        return $sources;
    }

    /** @return array<int, array<string, mixed>> */
    private function searchCalendarContext(array $terms, array $dates): array
    {
        if (! Schema::hasTable('calendar_blocks')) {
            return [];
        }

        $sources = [];
        if ($dates !== []) {
            $blocks = CalendarBlock::query()
                ->where(function (Builder $query) use ($dates): void {
                    foreach ($dates as $date) {
                        if (Schema::hasColumn('calendar_blocks', 'date')) {
                            $query->orWhereDate('date', $date);
                        }

                        if (Schema::hasColumn('calendar_blocks', 'date_from') && Schema::hasColumn('calendar_blocks', 'date_to')) {
                            $query->orWhere(function (Builder $range) use ($date): void {
                                $range->whereDate('date_from', '<=', $date)
                                    ->whereDate('date_to', '>=', $date);
                            });
                        }

                        if (Schema::hasColumn('calendar_blocks', 'start_date') && Schema::hasColumn('calendar_blocks', 'end_date')) {
                            $query->orWhere(function (Builder $range) use ($date): void {
                                $range->whereDate('start_date', '<=', $date)
                                    ->whereDate('end_date', '>=', $date);
                            });
                        }
                    }
                })
                ->limit(8)
                ->get();

            foreach ($blocks as $block) {
                $sources[] = [
                    'type' => 'calendar_block',
                    'id' => $block->id,
                    'title' => (string) ($block->display_title ?? $block->title ?? $block->name ?? 'Calendar block'),
                    'summary' => trim(collect([
                        filled($block->date ?? null) ? 'Date: '.Carbon::parse($block->date)->format('F d, Y') : null,
                        filled($block->date_from ?? null) ? 'From: '.Carbon::parse($block->date_from)->format('F d, Y') : null,
                        filled($block->date_to ?? null) ? 'To: '.Carbon::parse($block->date_to)->format('F d, Y') : null,
                        filled($block->start_date ?? null) ? 'Start: '.Carbon::parse($block->start_date)->format('F d, Y') : null,
                        filled($block->end_date ?? null) ? 'End: '.Carbon::parse($block->end_date)->format('F d, Y') : null,
                        filled($block->area ?? null) ? 'Area: '.$block->area : null,
                        filled($block->block ?? null) ? 'Block: '.$block->block_label : null,
                        filled($block->notes ?? null) ? 'Notes: '.$block->notes : null,
                        filled($block->reason ?? null) ? 'Reason: '.$block->reason : null,
                        filled($block->status ?? null) ? 'Status: '.$block->status : null,
                        filled($block->public_status ?? null) ? 'Public status: '.$block->public_status_label : null,
                    ])->filter()->implode('. ')),
                    'category' => 'calendar',
                    'visibility' => 'public',
                    'confidence' => 83,
                    'score' => 85,
                ];
            }
        }

        if ($terms !== [] && $this->termsMention($terms, ['calendar', 'block', 'holiday', 'available', 'availability', 'closed', 'reserved'])) {
            $recent = CalendarBlock::query()
                ->latest('updated_at')
                ->limit(4)
                ->get();
            foreach ($recent as $block) {
                $sources[] = [
                    'type' => 'calendar_recent_block',
                    'id' => $block->id,
                    'title' => (string) ($block->title ?? $block->name ?? 'Recent calendar block'),
                    'summary' => trim(collect([
                        filled($block->date ?? null) ? 'Date: '.Carbon::parse($block->date)->format('F d, Y') : null,
                        filled($block->date_from ?? null) ? 'From: '.Carbon::parse($block->date_from)->format('F d, Y') : null,
                        filled($block->date_to ?? null) ? 'To: '.Carbon::parse($block->date_to)->format('F d, Y') : null,
                        filled($block->area ?? null) ? 'Area: '.$block->area : null,
                        filled($block->block ?? null) ? 'Block: '.$block->block_label : null,
                        filled($block->notes ?? null) ? 'Notes: '.$block->notes : null,
                        filled($block->reason ?? null) ? 'Reason: '.$block->reason : null,
                        filled($block->status ?? null) ? 'Status: '.$block->status : null,
                    ])->filter()->implode('. ')),
                    'category' => 'calendar',
                    'visibility' => 'public',
                    'confidence' => 62,
                    'score' => 62,
                ];
            }
        }

        return $sources;
    }

    /** @return array<int, array<string, mixed>> */
    private function searchUserContext(?User $user, array $terms, string $surface): array
    {
        if (! $user || $surface === 'public') {
            return [];
        }

        $sources = [];

        if (Schema::hasTable('bookings') && ($this->termsMention($terms, ['status', 'payment', 'notice', 'my', 'calendar', 'schedule', 'booking', 'approved', 'pending', 'balance']) || $terms === [])) {
            $query = Booking::query();
            $query->where(function (Builder $inner) use ($user): void {
                if (Schema::hasColumn('bookings', 'created_by_user_id')) {
                    $inner->where('created_by_user_id', $user->id);
                }

                if (Schema::hasColumn('bookings', 'client_email') && filled($user->email)) {
                    Schema::hasColumn('bookings', 'created_by_user_id')
                        ? $inner->orWhere('client_email', $user->email)
                        : $inner->where('client_email', $user->email);
                }
            });

            foreach ($query->latest('updated_at')->limit(5)->get() as $booking) {
                $sources[] = [
                    'type' => 'own_booking_snapshot',
                    'id' => $booking->id,
                    'title' => (string) ($booking->display_title ?? $booking->event_title ?? 'My booking'),
                    'summary' => trim(collect([
                        'Booking ID: '.$booking->id,
                        filled($booking->booking_status ?? null) ? 'Booking status: '.$booking->booking_status : null,
                        filled($booking->payment_status ?? null) ? 'Payment status: '.$booking->payment_status : null,
                        filled($booking->booking_date_from ?? null) ? 'Start date: '.optional($booking->booking_date_from)->format('F d, Y') : null,
                        filled($booking->booking_date_to ?? null) ? 'End date: '.optional($booking->booking_date_to)->format('F d, Y') : null,
                        filled($booking->final_computation_status ?? null) ? 'Final computation: '.$booking->final_computation_status : null,
                        'Open /my-bookings/'.$booking->id.' for complete private details.',
                    ])->filter()->implode('. ')),
                    'category' => 'own_booking',
                    'visibility' => 'client',
                    'confidence' => 88,
                    'score' => 88 + $this->scoreText(($booking->display_title ?? '').' '.($booking->booking_status ?? '').' '.($booking->payment_status ?? ''), $terms),
                ];
            }
        }

        if (Schema::hasTable('user_notifications') && $this->termsMention($terms, ['notice', 'notification', 'alert', 'message', 'remind', 'device', 'login', 'payment', 'approved', 'pending'])) {
            foreach (UserNotification::query()->where('user_id', $user->id)->latest()->limit(6)->get() as $notice) {
                $sources[] = [
                    'type' => 'own_notification',
                    'id' => $notice->id,
                    'title' => $notice->title,
                    'summary' => trim(collect([
                        $notice->message,
                        filled($notice->kind ?? null) ? 'Kind: '.$notice->kind : null,
                        filled($notice->severity ?? null) ? 'Severity: '.$notice->severity : null,
                        $notice->read_at ? 'Already read.' : 'Unread notice.',
                    ])->filter()->implode('. ')),
                    'category' => 'own_notification',
                    'visibility' => 'client',
                    'confidence' => 84,
                    'score' => 84 + $this->scoreText($notice->title.' '.$notice->message, $terms),
                ];
            }
        }

        return $sources;
    }

    /** @return array<int, array<string, mixed>> */
    private function searchBackendContext(?User $user, array $terms, string $surface): array
    {
        if ($surface !== 'backend' || ! $user || ! $this->isBackendUser($user) || ! Schema::hasTable('bookings')) {
            return [];
        }

        if (! $this->termsMention($terms, ['booking', 'client', 'payment', 'approved', 'approve', 'decline', 'pending', 'calendar', 'status', 'review', 'operations', 'analytics', 'report', 'mice', 'bond', 'balance', 'proof'])) {
            return [];
        }

        $query = Booking::query();
        if ($terms !== []) {
            $query->where(function (Builder $inner) use ($terms): void {
                foreach ($terms as $term) {
                    foreach (['event_title', 'client_name', 'organization_name', 'booking_status', 'payment_status'] as $column) {
                        if (Schema::hasColumn('bookings', $column)) {
                            $inner->orWhere($column, 'like', "%{$term}%");
                        }
                    }
                }
            });
        }

        return $query->latest('updated_at')
            ->limit(6)
            ->get()
            ->map(fn (Booking $booking): array => [
                'type' => 'backend_booking_snapshot',
                'id' => $booking->id,
                'title' => (string) ($booking->display_title ?? $booking->event_title ?? 'Booking'),
                'summary' => trim(collect([
                    'Booking ID: '.$booking->id,
                    filled($booking->booking_status ?? null) ? 'Booking status: '.$booking->booking_status : null,
                    filled($booking->payment_status ?? null) ? 'Payment status: '.$booking->payment_status : null,
                    filled($booking->booking_date_from ?? null) ? 'Start date: '.optional($booking->booking_date_from)->format('F d, Y') : null,
                    filled($booking->booking_date_to ?? null) ? 'End date: '.optional($booking->booking_date_to)->format('F d, Y') : null,
                    'Use the backend booking page for full confidential details and actions.',
                ])->filter()->implode('. ')),
                'category' => 'backend_booking',
                'visibility' => 'backend',
                'confidence' => 78,
                'score' => 78 + $this->scoreText(($booking->display_title ?? '').' '.($booking->booking_status ?? '').' '.($booking->payment_status ?? ''), $terms),
            ])
            ->all();
    }

    private function directAnswer(array $sources, int $confidence, string $surface): ?string
    {
        if ($sources === [] || $confidence < 48) {
            return null;
        }

        $lines = ['I searched the BCCC EASE system records and found these relevant details:'];
        foreach (array_slice($sources, 0, 5) as $source) {
            $lines[] = '• '.$source['title'].' — '.$source['summary'];
        }

        $lines[] = match ($surface) {
            'public' => 'For private booking records, please log in and open My Bookings or Notifications.',
            'backend' => 'Use the matching Dashboard, Bookings, Calendar, Payment Review, Reports, Content, Users, Notification, or Settings page for the official record and final action.',
            default => 'Use the matching booking, notification, calendar, or settings page for the official record and final action.',
        };

        return implode("\n", $lines);
    }

    private function confidence(array $sources, array $dates, array $terms): int
    {
        if ($sources === []) {
            return $dates !== [] ? 52 : 35;
        }

        $top = collect($sources)->take(5)->avg('confidence') ?: 0;
        $bonus = min(14, count($sources) * 2) + ($terms !== [] ? 4 : 0) + ($dates !== [] ? 6 : 0);

        return max(0, min(98, (int) round($top + $bonus)));
    }

    private function scoreText(string $text, array $terms): int
    {
        $text = Str::lower(Str::ascii($text));
        $score = 0;
        foreach ($terms as $term) {
            if (str_contains($text, $term)) {
                $score += 10;
            }
        }

        return $score;
    }

    private function matchingTermCount(string $text, array $terms): int
    {
        $text = Str::lower(Str::ascii($text));

        return collect($terms)
            ->filter(fn (string $term): bool => str_contains($text, $term))
            ->count();
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

    private function termsMention(array $terms, array $needles): bool
    {
        foreach ($terms as $term) {
            foreach ($needles as $needle) {
                if (str_contains($term, $needle) || str_contains($needle, $term)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function normalizeSurface(string $surface): string
    {
        $surface = strtolower(trim($surface));

        return in_array($surface, ['public', 'client', 'backend'], true) ? $surface : 'public';
    }

    private function isBackendUser(User $user): bool
    {
        if (! method_exists($user, 'hasAnyRole')) {
            return false;
        }

        return $user->hasAnyRole(['admin', 'manager', 'staff']);
    }
}
