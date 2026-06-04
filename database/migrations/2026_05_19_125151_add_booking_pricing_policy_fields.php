<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table): void {
            if (! Schema::hasColumn('bookings', 'payment_meta')) {
                $table->json('payment_meta')->nullable()->after('payment_status');
            }

            if (! Schema::hasColumn('bookings', 'policy_acknowledged_at')) {
                $table->timestamp('policy_acknowledged_at')->nullable()->index()->after('payment_meta');
            }

            if (! Schema::hasColumn('bookings', 'final_computation_at')) {
                $table->timestamp('final_computation_at')->nullable()->index()->after('policy_acknowledged_at');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table): void {
            $columns = array_values(array_filter([
                Schema::hasColumn('bookings', 'final_computation_at') ? 'final_computation_at' : null,
                Schema::hasColumn('bookings', 'policy_acknowledged_at') ? 'policy_acknowledged_at' : null,
                Schema::hasColumn('bookings', 'payment_meta') ? 'payment_meta' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
