<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop the UNIQUE index from booking_payments.payment_gateway.
     *
     * Why:
     *  - A payment gateway name (e.g. "stripe", "paypal") is not globally unique per payment.
     *  - The previous schema prevented recording more than one payment with the same gateway.
     */
    public function up(): void
    {
        if (! Schema::hasTable('booking_payments')) {
            return;
        }

        // Attempt drop using Laravel's conventional index naming.
        try {
            Schema::table('booking_payments', function (Blueprint $table) {
                $table->dropUnique(['payment_gateway']);
            });

            return;
        } catch (\Throwable $e) {
            // continue to fallback
        }

        // Fallback: attempt drop by explicit index name.
        try {
            Schema::table('booking_payments', function (Blueprint $table) {
                $table->dropUnique('booking_payments_payment_gateway_unique');
            });
        } catch (\Throwable $e) {
            // If the index doesn't exist (already dropped / different driver), ignore.
        }
    }

    /**
     * Down migration intentionally does NOT re-add the unique index, because:
     *  - Existing data may already contain duplicates, and rollback would fail.
     */
    public function down(): void
    {
        // no-op
    }
};
