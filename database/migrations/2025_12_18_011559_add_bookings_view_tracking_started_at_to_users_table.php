<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Only bookings created AFTER this timestamp will be treated as "NEW" for the user.
            // This prevents ALL old bookings from being highlighted the first time we deploy.
            $table->timestamp('bookings_view_tracking_started_at')
                ->nullable()
                ->useCurrent()
                ->after('remember_token');
        });

        // Ensure existing users start tracking "now".
        DB::table('users')
            ->whereNull('bookings_view_tracking_started_at')
            ->update(['bookings_view_tracking_started_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('bookings_view_tracking_started_at');
        });
    }
};
