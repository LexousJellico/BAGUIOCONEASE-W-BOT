<?php

namespace App\Http\Controllers;

use App\Http\Requests\BookingApprovalDecisionRequest;
use App\Models\Booking;
use App\Services\BookingApprovalWorkflowService;
use App\Support\WorkspaceAccess;
use Illuminate\Http\RedirectResponse;

class BookingApprovalController extends Controller
{
    public function __construct(private readonly BookingApprovalWorkflowService $workflow)
    {
    }

    public function forReview(BookingApprovalDecisionRequest $request, Booking $booking): RedirectResponse
    {
        $this->authorizeDecision($request);
        $this->workflow->markForReview($booking, $request->user()?->id, $request->input('remarks'));

        return back()->with('success', 'Booking moved to review.');
    }

    public function pencilBook(BookingApprovalDecisionRequest $request, Booking $booking): RedirectResponse
    {
        $this->authorizeDecision($request);
        $this->workflow->pencilBook($booking, $request->user()?->id, $request->input('remarks'));

        return back()->with('success', 'Booking pencil-booked and final computation locked for payment review.');
    }

    public function confirm(BookingApprovalDecisionRequest $request, Booking $booking): RedirectResponse
    {
        $this->authorizeDecision($request);
        $this->workflow->confirm(
            booking: $booking,
            userId: $request->user()?->id,
            remarks: $request->input('remarks'),
            force: $request->boolean('force_confirm')
        );

        return back()->with('success', 'Booking confirmed. The MICE draft was finalized when available.');
    }

    public function decline(BookingApprovalDecisionRequest $request, Booking $booking): RedirectResponse
    {
        $this->authorizeDecision($request);
        $this->workflow->decline($booking, $request->user()?->id, $request->input('reason', $request->input('remarks')));

        return back()->with('success', 'Booking declined.');
    }

    public function cancel(BookingApprovalDecisionRequest $request, Booking $booking): RedirectResponse
    {
        $this->authorizeDecision($request);
        $this->workflow->cancel(
            booking: $booking,
            userId: $request->user()?->id,
            reason: $request->input('reason', $request->input('remarks')),
            afterOfficeHoursDayBefore: $request->boolean('after_office_hours_day_before')
        );

        return back()->with('success', 'Booking cancelled and cancellation penalty assessed when applicable.');
    }

    public function complete(BookingApprovalDecisionRequest $request, Booking $booking): RedirectResponse
    {
        $this->authorizeDecision($request);
        $this->workflow->complete($booking, $request->user()?->id, $request->input('remarks'));

        return back()->with('success', 'Booking marked completed.');
    }

    private function authorizeDecision(BookingApprovalDecisionRequest $request): void
    {
        abort_unless(WorkspaceAccess::isAdmin($request) || WorkspaceAccess::isManager($request), 403);
    }
}
