<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('booking_payments', function (Blueprint $table) {
            if (! Schema::hasColumn('booking_payments', 'payment_type')) {
                $table->string('payment_type', 20)->nullable()->after('payment_gateway');
            }

            if (! Schema::hasColumn('booking_payments', 'proof_image_path')) {
                $table->string('proof_image_path')->nullable()->after('remarks');
            }

            if (! Schema::hasColumn('booking_payments', 'payer_name')) {
                $table->string('payer_name')->nullable()->after('proof_image_path');
            }

            if (! Schema::hasColumn('booking_payments', 'card_holder_name')) {
                $table->string('card_holder_name')->nullable()->after('payer_name');
            }

            if (! Schema::hasColumn('booking_payments', 'card_last_four')) {
                $table->string('card_last_four', 4)->nullable()->after('card_holder_name');
            }

            if (! Schema::hasColumn('booking_payments', 'card_expiration')) {
                $table->string('card_expiration', 10)->nullable()->after('card_last_four');
            }

            if (! Schema::hasColumn('booking_payments', 'marketing_consent')) {
                $table->boolean('marketing_consent')->default(false)->after('card_expiration');
            }

            if (! Schema::hasColumn('booking_payments', 'payment_meta')) {
                $table->json('payment_meta')->nullable()->after('marketing_consent');
            }

            if (! Schema::hasColumn('booking_payments', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('payment_meta');
            }
        });
    }

    public function down(): void
    {
        Schema::table('booking_payments', function (Blueprint $table) {
            foreach ([
                'payment_type',
                'proof_image_path',
                'payer_name',
                'card_holder_name',
                'card_last_four',
                'card_expiration',
                'marketing_consent',
                'payment_meta',
                'paid_at',
            ] as $column) {
                if (Schema::hasColumn('booking_payments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
