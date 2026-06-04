<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Support\WorkspacePage;

class AdminGuidelinesContactController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensureAdminLike($request);

        $settings = SiteSetting::query()->first();

        return Inertia::render(WorkspacePage::resolve($request, 'admin/guidelines-contacts'), [
            'siteSettings' => [
                'mapEmbedUrl' => $settings?->map_embed_url,
                'openMapUrl' => $settings?->open_map_url,
                'address' => $settings?->address,
                'phone' => $settings?->phone,
                'email' => $settings?->email,
                'visitaUrl' => $settings?->visita_url,
                'creativeBaguioUrl' => $settings?->creative_baguio_url,
                'footerDescription' => $settings?->footer_description,
                'footerCopyright' => $settings?->footer_copyright,
            ],
            'guidelinesSections' => $this->guidelinesSections(),
            'contactCards' => $this->contactCards(),
            'rentalAreas' => $this->rentalAreas(),
            'reservationNotes' => $this->reservationNotes(),
            'signatories' => $this->signatories(),
            'operationalNotes' => $this->operationalNotes(),
        ]);
    }

    public function update(Request $request): RedirectResponse|JsonResponse
    {
        $this->ensureAdminLike($request);

        $data = $request->validate([
            'map_embed_url' => ['nullable', 'string', 'max:2000'],
            'open_map_url' => ['nullable', 'url', 'max:2000'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'visita_url' => ['nullable', 'url', 'max:2000'],
            'creative_baguio_url' => ['nullable', 'url', 'max:2000'],
            'footer_description' => ['nullable', 'string'],
            'footer_copyright' => ['nullable', 'string', 'max:255'],
        ]);

        $settings = SiteSetting::query()->firstOrCreate([]);

        $settings->update([
            'map_embed_url' => $this->sanitizeMapEmbedUrl($data['map_embed_url'] ?? null),
            'open_map_url' => $this->sanitizeHttpsUrl($data['open_map_url'] ?? null),
            'address' => $this->nullableTrim($data['address'] ?? null),
            'phone' => $this->nullableTrim($data['phone'] ?? null),
            'email' => $this->nullableTrim($data['email'] ?? null),
            'visita_url' => $this->sanitizeHttpsUrl($data['visita_url'] ?? null),
            'creative_baguio_url' => $this->sanitizeHttpsUrl($data['creative_baguio_url'] ?? null),
            'footer_description' => $this->nullableTrim($data['footer_description'] ?? null),
            'footer_copyright' => $this->nullableTrim($data['footer_copyright'] ?? null),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Guidelines & contact settings updated successfully.',
            ]);
        }

        return back()->with('success', 'Guidelines & contact settings updated successfully.');
    }

    protected function ensureAdminLike(Request $request): void
    {
        $user = $request->user();

        if (! $user || ! method_exists($user, 'hasAnyRole') || ! $user->hasAnyRole(['admin', 'manager', 'staff'])) {
            abort(403);
        }
    }

    protected function guidelinesSections(): array
    {
        return [
            [
                'title' => '1. Ingress & Egress Protocol',
                'items' => [
                    'Organizers must seek clearance from BCC administration prior to ingress.',
                    'All items and equipment to be brought inside the facility must be declared with the secretariat for review and approval.',
                    'Setup of decors, technical, secretariat, and catering must be with prior arrangement with BCC administration.',
                    'Inform BCC secretariat of the time of egress for monitoring and assessment.',
                ],
            ],
            [
                'title' => '2. House Rules for Organizers',
                'items' => [
                    'Full payment must be settled before ingress and shall follow the separate billing statement.',
                    'Setting up booths for exhibits, merchandizing, or selling is prohibited unless there is prior arrangement with BCCC administration.',
                    'Avoid any damage or marring of any surface, fixture, furniture, or equipment of the facility. Damage shall be charged accordingly to the organizers.',
                    'Observe environmentally friendly practices such as reducing plastics and tarpaulins, using recycled packaging or eco-bags, sourcing local supplies, and applying trash segregation.',
                    'Play reminder videos and Baguio AVPs before and during the activity when required by management.',
                ],
            ],
            [
                'title' => '3. House Rules for Participants (to be strictly observed by all)',
                'items' => [
                    'No smoking at all times in all areas, including outdoor and parking spaces.',
                    'Observe clean-as-you-go. Trash and garbage must be disposed properly in designated bins.',
                    'Bringing in of food and beverage shall be restricted to those distributed by the official caterer.',
                    'Avoid noise and unnecessary movement during the actual program and proceedings. Turn off or put in silent mode all electronic gadgets.',
                    'Always be in proper dress code and wear IDs as prescribed by the organizer.',
                    'Be aware of emergency exits, emergency contacts, health advisories, and evacuation protocol.',
                    'Save water and energy. Use water, soap, and tissue prudently.',
                    'Be conscious and vigilant of your own belongings. BCC management shall not be responsible for any loss or damage of personal belongings.',
                    'Bringing in of illegal substances or paraphernalia, deadly weapons, and animals or pets are strictly prohibited.',
                    'For any concern, please seek assistance at the information booth.',
                    'Strictly implement the minimum health and safety protocols such as wearing face masks and always observe social distancing.',
                    'Temperature checking during registration may be enforced when required.',
                ],
            ],
        ];
    }

    protected function contactCards(): array
    {
        return [
            [
                'office' => 'City Tourism & Special Events Office',
                'person' => 'Engr. Aloysius C. Mapalo',
                'role' => 'Supervising Tourism Operations Officer',
                'email' => 'alecmapalo@gmail.com',
                'phones' => ['0917 506 8528'],
            ],
            [
                'office' => 'Baguio Convention Center Secretariat',
                'person' => 'Mr. Ian Lyle B. Catacutan',
                'role' => 'Reservations',
                'email' => null,
                'phones' => ['446 2009', '0961 6703371'],
            ],
        ];
    }

    protected function rentalAreas(): array
    {
        return [
            [
                'area' => 'Full Hall',
                'rates' => [
                    ['usage' => 'Whole Day', 'rate' => '₱80,000.00'],
                    ['usage' => 'Half Day', 'rate' => '₱45,000.00'],
                    ['usage' => 'Additional Hour', 'rate' => '₱5,000.00'],
                ],
            ],
            [
                'area' => 'Main Hall',
                'rates' => [
                    ['usage' => 'Whole Day', 'rate' => '₱60,000.00'],
                    ['usage' => 'Half Day', 'rate' => '₱35,000.00'],
                    ['usage' => 'Additional Hour', 'rate' => '₱5,000.00'],
                ],
            ],
            [
                'area' => 'LED Wall',
                'rates' => [
                    ['usage' => 'Whole Day', 'rate' => '₱30,000.00'],
                    ['usage' => 'Half Day', 'rate' => '₱15,000.00'],
                    ['usage' => 'Additional Hour', 'rate' => '₱3,500.00'],
                ],
            ],
            [
                'area' => 'Lounge',
                'rates' => [
                    ['usage' => 'Whole Day', 'rate' => '₱6,000.00'],
                    ['usage' => 'Half Day', 'rate' => '₱3,500.00'],
                    ['usage' => 'Additional Hour', 'rate' => '₱500.00'],
                ],
            ],
            [
                'area' => 'Boardroom',
                'rates' => [
                    ['usage' => 'Whole Day', 'rate' => '₱6,000.00'],
                    ['usage' => 'Half Day', 'rate' => '₱3,500.00'],
                    ['usage' => 'Additional Hour', 'rate' => '₱500.00'],
                ],
            ],
        ];
    }

    protected function reservationNotes(): array
    {
        return [
            'Additional charges may be imposed after assessment at egress.',
            'The City has the right to bump off all reservations regardless of reservation status.',
            'Other rentals and additional charges should be itemized during formal assessment and reflected in the final billing sheet.',
        ];
    }

    protected function signatories(): array
    {
        return [
            [
                'label' => 'Assessed by',
                'name' => 'Ian Catacutan',
                'role' => 'Reservations',
            ],
            [
                'label' => 'Recommending Approval',
                'name' => 'Engr. Aloysius C. Mapalo',
                'role' => 'City Tourism Officer',
            ],
            [
                'label' => 'Approved by',
                'name' => 'Vittorio Jerico L. Cawis',
                'role' => 'City Administrator',
            ],
        ];
    }

    protected function operationalNotes(): array
    {
        return [
            'This backend page should remain staff-facing only and should not be shown as a public frontend reference page.',
            'Use this page as the internal source for the current office contacts, official reservation rates, and organizer/participant reminders.',
            'When public contact links are updated here, confirm the footer, contact page, and tourism/arts outbound links immediately after saving.',
        ];
    }

    protected function nullableTrim(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        return $value !== '' ? $value : null;
    }

    protected function sanitizeHttpsUrl(?string $value): ?string
    {
        $value = $this->nullableTrim($value);

        if (! $value || ! filter_var($value, FILTER_VALIDATE_URL)) {
            return null;
        }

        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true) ? $value : null;
    }

    protected function sanitizeMapEmbedUrl(?string $value): ?string
    {
        $value = $this->sanitizeHttpsUrl($value);

        if (! $value) {
            return null;
        }

        $host = strtolower((string) parse_url($value, PHP_URL_HOST));
        $allowedHosts = [
            'www.google.com',
            'google.com',
            'maps.google.com',
            'www.google.com.ph',
            'google.com.ph',
        ];

        return in_array($host, $allowedHosts, true) ? $value : null;
    }
}
