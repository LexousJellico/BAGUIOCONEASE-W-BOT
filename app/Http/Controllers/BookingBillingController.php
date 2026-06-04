<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingPostEventChargeRequest;
use App\Http\Requests\UpdateBookingBillingRequest;
use App\Models\Booking;
use App\Models\BookingPostEventCharge;
use App\Services\BookingBillingService;
use App\Support\WorkspaceAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BookingBillingController extends Controller
{
    public function __construct(private readonly BookingBillingService $billing)
    {
    }

    public function update(UpdateBookingBillingRequest $request, Booking $booking): RedirectResponse
    {
        $this->authorizeBilling($request);
        $this->billing->updateBilling($booking, $request->validated(), $request->user()?->id);

        return back()->with('success', 'Booking billing settings updated.');
    }

    public function storePostEventCharge(StoreBookingPostEventChargeRequest $request, Booking $booking): RedirectResponse
    {
        $this->authorizeBilling($request);
        $this->billing->createPostEventCharge($booking, $request->validated(), $request->user()?->id);

        return back()->with('success', 'Post-event charge added.');
    }

    public function updatePostEventCharge(
        StoreBookingPostEventChargeRequest $request,
        Booking $booking,
        BookingPostEventCharge $bookingPostEventCharge,
    ): RedirectResponse {
        $this->authorizeBilling($request);
        $this->ensureChargeBelongsToBooking($booking, $bookingPostEventCharge);
        $this->billing->updatePostEventCharge($bookingPostEventCharge, $request->validated());

        return back()->with('success', 'Post-event charge updated.');
    }

    public function destroyPostEventCharge(
        Request $request,
        Booking $booking,
        BookingPostEventCharge $bookingPostEventCharge,
    ): RedirectResponse {
        $this->authorizeBilling($request);
        $this->ensureChargeBelongsToBooking($booking, $bookingPostEventCharge);
        $this->billing->deletePostEventCharge($bookingPostEventCharge);

        return back()->with('success', 'Post-event charge removed.');
    }

    private function authorizeBilling(Request $request): void
    {
        abort_unless(WorkspaceAccess::isAdmin($request) || WorkspaceAccess::isManager($request), 403);
    }

    private function ensureChargeBelongsToBooking(Booking $booking, BookingPostEventCharge $charge): void
    {
        abort_if((int) $charge->booking_id !== (int) $booking->id, 404);
    }
}
