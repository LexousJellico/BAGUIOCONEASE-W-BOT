<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_payments', function (Blueprint $table) {
            if (! Schema::hasColumn('booking_payments', 'proof_image_path')) {
                $table->string('proof_image_path')->nullable()->after('card_last_four');
            }

            if (! Schema::hasColumn('booking_payments', 'proof_image_name')) {
                $table->string('proof_image_name')->nullable()->after('proof_image_path');
            }

            if (! Schema::hasColumn('booking_payments', 'proof_image_mime')) {
                $table->string('proof_image_mime')->nullable()->after('proof_image_name');
            }

            if (! Schema::hasColumn('booking_payments', 'payment_meta')) {
                $table->json('payment_meta')->nullable()->after('proof_image_mime');
            }

            if (! Schema::hasColumn('booking_payments', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('payment_meta');
            }

            if (! Schema::hasColumn('booking_payments', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('paid_at');
            }

            if (! Schema::hasColumn('booking_payments', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('verified_at');
            }

            if (! Schema::hasColumn('booking_payments', 'declined_at')) {
                $table->timestamp('declined_at')->nullable()->after('approved_at');
            }

            if (! Schema::hasColumn('booking_payments', 'failed_at')) {
                $table->timestamp('failed_at')->nullable()->after('declined_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('booking_payments', function (Blueprint $table) {
            foreach ([
                'failed_at',
                'declined_at',
                'approved_at',
                'verified_at',
                'paid_at',
                'payment_meta',
                'proof_image_mime',
                'proof_image_name',
                'proof_image_path',
            ] as $column) {
                if (Schema::hasColumn('booking_payments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
