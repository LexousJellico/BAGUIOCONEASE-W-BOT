<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('public_events', 'event_date_to')) {
            Schema::table('public_events', function (Blueprint $table) {
                $table->date('event_date_to')->nullable()->after('event_date');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('public_events', 'event_date_to')) {
            Schema::table('public_events', function (Blueprint $table) {
                $table->dropColumn('event_date_to');
            });
        }
    }
};
