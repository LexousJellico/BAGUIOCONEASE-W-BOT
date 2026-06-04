<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('head_of_organization')->nullable()->after('client_address');
            $table->dateTime('flexible_date_from')->nullable()->after('booking_date_to');
            $table->dateTime('flexible_date_to')->nullable()->after('flexible_date_from');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('head_of_organization');
            $table->dropColumn('flexible_date_from');
            $table->dropColumn('flexible_date_to');
        });
    }
};
