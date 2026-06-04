<?php

namespace App\Http\Resources;

use App\Models\BookingPayment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BookingPayment
 */
class BookingPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'booking_id' => $this->booking_id,

            'amount' => $this->amount,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'payment_gateway' => $this->payment_gateway,
            'payment_type' => $this->payment_type,

            'transaction_reference' => $this->transaction_reference,
            'payer_name' => $this->payer_name,

            'proof_image_path' => $this->proof_image_path,
            'proof_image_name' => $this->proof_image_name,
            'proof_image_mime' => $this->proof_image_mime,
            'proof_image_url' => $this->proofImageUrl($request),

            'remarks' => $this->remarks,
            'payment_meta' => $this->payment_meta,

            'paid_at' => optional($this->paid_at)->toIso8601String(),
            'verified_at' => optional($this->verified_at)->toIso8601String(),
            'approved_at' => optional($this->approved_at)->toIso8601String(),
            'declined_at' => optional($this->declined_at)->toIso8601String(),
            'failed_at' => optional($this->failed_at)->toIso8601String(),

            'reviewed_by_user_id' => $this->reviewed_by_user_id,

            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }

    private function proofImageUrl(Request $request): ?string
    {
        if (empty($this->proof_image_path) || empty($this->booking_id)) {
            return null;
        }

        $role = $this->workspaceRole($request);

        return match ($role) {
            'admin' => url("/admin/bookings/{$this->booking_id}/payments/{$this->id}/proof"),
            'manager' => url("/manager/bookings/{$this->booking_id}/payments/{$this->id}/proof"),
            'staff' => url("/staff/bookings/{$this->booking_id}/payments/{$this->id}/proof"),
            default => url("/my-bookings/{$this->booking_id}/payments/{$this->id}/proof"),
        };
    }

    private function workspaceRole(Request $request): string
    {
        $path = trim($request->path(), '/');

        if (str_starts_with($path, 'admin/')) {
            return 'admin';
        }

        if (str_starts_with($path, 'manager/')) {
            return 'manager';
        }

        if (str_starts_with($path, 'staff/')) {
            return 'staff';
        }

        return 'user';
    }
}
