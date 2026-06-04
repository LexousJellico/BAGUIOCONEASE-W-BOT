<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            if (! Schema::hasColumn('bookings', 'final_computation_status')) {
                $table->string('final_computation_status', 40)->nullable()->after('final_computation_locked_at');
            }

            if (! Schema::hasColumn('bookings', 'final_computation_finalized_at')) {
                $table->timestamp('final_computation_finalized_at')->nullable()->after('final_computation_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            if (Schema::hasColumn('bookings', 'final_computation_finalized_at')) {
                $table->dropColumn('final_computation_finalized_at');
            }

            if (Schema::hasColumn('bookings', 'final_computation_status')) {
                $table->dropColumn('final_computation_status');
            }
        });
    }
};
