<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PublicInquiryController extends Controller
{
    public function __construct(private readonly NotificationService $notifications)
    {
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'inquiry_type' => ['nullable', 'string', 'max:255'],
            'event_date' => ['nullable', 'date'],
            'venue' => ['nullable', 'string', 'max:255'],
            'guest_count' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $inquiry = Inquiry::create([
            'name' => trim((string) $data['name']),
            'email' => strtolower(trim((string) $data['email'])),
            'phone' => isset($data['phone']) ? trim((string) $data['phone']) : null,
            'subject' => trim((string) $data['subject']),
            'inquiry_type' => isset($data['inquiry_type']) ? trim((string) $data['inquiry_type']) : null,
            'event_date' => $data['event_date'] ?? null,
            'venue' => isset($data['venue']) ? trim((string) $data['venue']) : null,
            'guest_count' => $data['guest_count'] ?? null,
            'message' => trim((string) $data['message']),
        ]);

        $this->notifications->publicInquiryCreated($inquiry);

        return back()->with('success', 'Your inquiry has been submitted successfully.');
    }
}
