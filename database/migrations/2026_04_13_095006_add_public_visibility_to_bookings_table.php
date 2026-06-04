<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (! Schema::hasColumn('bookings', 'is_public_calendar_visible')) {
                $table->boolean('is_public_calendar_visible')->default(false)->after('payment_status');
            }

            if (! Schema::hasColumn('bookings', 'public_calendar_title')) {
                $table->string('public_calendar_title')->nullable()->after('is_public_calendar_visible');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'public_calendar_title')) {
                $table->dropColumn('public_calendar_title');
            }

            if (Schema::hasColumn('bookings', 'is_public_calendar_visible')) {
                $table->dropColumn('is_public_calendar_visible');
            }
        });
    }
};
