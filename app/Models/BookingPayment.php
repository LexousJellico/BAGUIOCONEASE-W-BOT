<?php

namespace App\Models;

use App\Services\BookingFinancialSummaryService;
use App\Support\BookingStatusCatalog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class BookingPayment extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'amount' => 'decimal:2',
        'marketing_consent' => 'boolean',
        'payment_meta' => 'array',
        'paid_at' => 'datetime',
        'verified_at' => 'datetime',
        'approved_at' => 'datetime',
        'declined_at' => 'datetime',
        'failed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'proof_image_url',
        'display_status',
        'display_amount',
    ];

    protected static function booted(): void
    {
        static::saving(function (BookingPayment $payment) {
            $now = now();

            $status = BookingStatusCatalog::normalizePaymentProofStatus((string) ($payment->status ?? ''), 'pending');
            $payment->status = $status;

            if (in_array($status, ['confirmed', 'approved', 'verified', 'paid', 'completed', 'settled'], true)) {
                $payment->paid_at ??= $now;
            }

            if (in_array($status, ['confirmed', 'approved', 'verified', 'paid', 'completed', 'settled'], true)) {
                $payment->verified_at ??= $now;
            }

            if (in_array($status, ['confirmed', 'approved', 'verified', 'paid', 'completed', 'settled'], true)) {
                $payment->approved_at ??= $now;
            }

            if (in_array($status, ['declined', 'rejected'], true)) {
                $payment->declined_at ??= $now;
            }

            if ($status === 'failed') {
                $payment->failed_at ??= $now;
            }
        });

        static::saved(function (BookingPayment $payment) {
            if ($payment->booking) {
                app(BookingFinancialSummaryService::class)->syncBookingPaymentStatus($payment->booking);
            }
        });

        static::deleted(function (BookingPayment $payment) {
            if ($payment->booking) {
                app(BookingFinancialSummaryService::class)->syncBookingPaymentStatus($payment->booking);
            }
        });
    }


    public function setStatusAttribute($value): void
    {
        $this->attributes['status'] = BookingStatusCatalog::normalizePaymentProofStatus(
            is_string($value) ? $value : (string) $value,
            'pending'
        );
    }

    public function setPaymentStatusAttribute($value): void
    {
        $this->attributes['payment_status'] = BookingStatusCatalog::normalizePaymentProofStatus(
            is_string($value) ? $value : (string) $value,
            'pending'
        );
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function getProofImageUrlAttribute(): ?string
    {
        if (! $this->proof_image_path) {
            return null;
        }

        return Storage::disk('public')->url($this->proof_image_path);
    }

    public function getDisplayStatusAttribute(): string
    {
        return match ($this->status) {
            'paid' => 'Paid',
            'confirmed' => 'Confirmed',
            'approved' => 'Approved',
            'verified' => 'Verified',
            'declined' => 'Declined',
            'rejected' => 'Rejected',
            'for_review' => 'For Review',
            'submitted' => 'Submitted',
            'failed' => 'Failed',
            'pending' => 'Pending Review',
            default => ucfirst((string) ($this->status ?: 'Pending')),
        };
    }

    public function getDisplayAmountAttribute(): string
    {
        return '₱' . number_format((float) $this->amount, 2);
    }

    public function scopeConfirmed($query)
    {
        return $query->whereIn('status', [
            'paid',
            'success',
            'successful',
            'completed',
            'confirmed',
            'approved',
            'verified',
            'settled',
        ]);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [
            'pending',
            'submitted',
            'processing',
            'review',
            'for_review',
            'under_review',
        ]);
    }

    public function scopeDeclined($query)
    {
        return $query->whereIn('status', [
            'declined',
            'failed',
            'cancelled',
            'canceled',
            'void',
            'rejected',
        ]);
    }
}
