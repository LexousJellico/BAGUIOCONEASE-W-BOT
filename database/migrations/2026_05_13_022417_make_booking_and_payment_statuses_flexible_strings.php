<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bookings')) {
            $this->makeBookingStatusesFlexible();
            $this->normalizeBookingRows();
        }

        if (Schema::hasTable('booking_payments')) {
            $this->makePaymentProofStatusesFlexible();
            $this->normalizePaymentRows();
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('booking_payments')) {
            $this->normalizePaymentRowsForLegacyEnum();
            $this->restorePaymentProofStatusEnum();
        }

        if (Schema::hasTable('bookings')) {
            $this->normalizeBookingRowsForLegacyEnum();
            $this->restoreBookingStatusEnums();
        }
    }

    private function makeBookingStatusesFlexible(): void
    {
        if ($this->driver() !== 'mysql') {
            return;
        }

        if (Schema::hasColumn('bookings', 'booking_status')) {
            DB::statement("ALTER TABLE `bookings` MODIFY `booking_status` VARCHAR(50) NOT NULL DEFAULT 'pencil_booked'");
        }

        if (Schema::hasColumn('bookings', 'payment_status')) {
            DB::statement("ALTER TABLE `bookings` MODIFY `payment_status` VARCHAR(50) NOT NULL DEFAULT 'unpaid'");
        }
    }

    private function makePaymentProofStatusesFlexible(): void
    {
        if ($this->driver() !== 'mysql') {
            return;
        }

        if (Schema::hasColumn('booking_payments', 'status')) {
            DB::statement("ALTER TABLE `booking_payments` MODIFY `status` VARCHAR(50) NOT NULL DEFAULT 'pending'");
        }
    }

    private function restoreBookingStatusEnums(): void
    {
        if ($this->driver() !== 'mysql') {
            return;
        }

        if (Schema::hasColumn('bookings', 'booking_status')) {
            DB::statement("ALTER TABLE `bookings` MODIFY `booking_status` ENUM('pending','confirmed','active','cancelled','declined','completed') NOT NULL DEFAULT 'pending'");
        }

        if (Schema::hasColumn('bookings', 'payment_status')) {
            DB::statement("ALTER TABLE `bookings` MODIFY `payment_status` ENUM('unpaid','partial','paid','owing') NOT NULL DEFAULT 'unpaid'");
        }
    }

    private function restorePaymentProofStatusEnum(): void
    {
        if ($this->driver() !== 'mysql') {
            return;
        }

        if (Schema::hasColumn('booking_payments', 'status')) {
            DB::statement("ALTER TABLE `booking_payments` MODIFY `status` ENUM('pending','confirmed','failed','declined','refunded') NOT NULL DEFAULT 'pending'");
        }
    }

    private function normalizeBookingRows(): void
    {
        if (Schema::hasColumn('bookings', 'booking_status')) {
            DB::table('bookings')->whereNull('booking_status')->update(['booking_status' => 'pencil_booked']);
            DB::table('bookings')->whereIn('booking_status', ['submitted', 'pencil-booked', 'pencil booked', ''])->update(['booking_status' => 'pencil_booked']);
            DB::table('bookings')->whereIn('booking_status', ['for review', 'under_review', 'under review', 'awaiting_review', 'awaiting review'])->update(['booking_status' => 'for_review']);
            DB::table('bookings')->whereIn('booking_status', ['canceled'])->update(['booking_status' => 'cancelled']);
            DB::table('bookings')->whereIn('booking_status', ['rejected'])->update(['booking_status' => 'declined']);
        }

        if (Schema::hasColumn('bookings', 'payment_status')) {
            DB::table('bookings')->whereNull('payment_status')->update(['payment_status' => 'unpaid']);
            DB::table('bookings')->whereIn('payment_status', ['submitted', 'review', 'for review', 'under_review', 'under review', 'awaiting_review', 'awaiting review'])->update(['payment_status' => 'for_review']);
            DB::table('bookings')->whereIn('payment_status', ['partially_paid', 'partially paid', 'downpayment_paid', 'down_payment_paid'])->update(['payment_status' => 'partial']);
            DB::table('bookings')->whereIn('payment_status', ['confirmed', 'verified', 'approved', 'completed', 'settled'])->update(['payment_status' => 'paid']);
            DB::table('bookings')->whereIn('payment_status', ['cancelled', 'canceled'])->update(['payment_status' => 'declined']);
        }
    }

    private function normalizePaymentRows(): void
    {
        if (! Schema::hasColumn('booking_payments', 'status')) {
            return;
        }

        DB::table('booking_payments')->whereNull('status')->update(['status' => 'pending']);
        DB::table('booking_payments')->whereIn('status', ['review', 'for review', 'under_review', 'under review', 'awaiting_review', 'awaiting review'])->update(['status' => 'for_review']);
        DB::table('booking_payments')->whereIn('status', ['success', 'successful', 'complete'])->update(['status' => 'approved']);
        DB::table('booking_payments')->whereIn('status', ['canceled'])->update(['status' => 'cancelled']);
        DB::table('booking_payments')->whereIn('status', ['reject'])->update(['status' => 'rejected']);
    }

    private function normalizeBookingRowsForLegacyEnum(): void
    {
        if (Schema::hasColumn('bookings', 'booking_status')) {
            DB::table('bookings')->whereIn('booking_status', ['pencil_booked', 'for_review', 'approved', 'expired'])->update(['booking_status' => 'pending']);
            DB::table('bookings')->whereIn('booking_status', ['archived'])->update(['booking_status' => 'cancelled']);
            DB::table('bookings')->whereIn('booking_status', ['rejected'])->update(['booking_status' => 'declined']);
        }

        if (Schema::hasColumn('bookings', 'payment_status')) {
            DB::table('bookings')->whereIn('payment_status', ['pending', 'for_review', 'rejected', 'declined', 'failed', 'expired', 'refunded', 'unpriced'])->update(['payment_status' => 'unpaid']);
            DB::table('bookings')->whereIn('payment_status', ['overpaid', 'confirmed', 'verified', 'approved', 'completed', 'settled'])->update(['payment_status' => 'paid']);
            DB::table('bookings')->whereIn('payment_status', ['partially_paid', 'downpayment_paid', 'down_payment_paid'])->update(['payment_status' => 'partial']);
        }
    }

    private function normalizePaymentRowsForLegacyEnum(): void
    {
        if (! Schema::hasColumn('booking_payments', 'status')) {
            return;
        }

        DB::table('booking_payments')->whereIn('status', ['for_review', 'submitted'])->update(['status' => 'pending']);
        DB::table('booking_payments')->whereIn('status', ['approved', 'verified', 'paid', 'completed', 'settled', 'success', 'successful'])->update(['status' => 'confirmed']);
        DB::table('booking_payments')->whereIn('status', ['rejected', 'cancelled', 'canceled', 'void'])->update(['status' => 'declined']);
    }

    private function driver(): string
    {
        return DB::connection()->getDriverName();
    }
};
