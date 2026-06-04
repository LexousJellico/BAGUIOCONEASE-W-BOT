<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->unsignedInteger('min_guests')->nullable()->after('quantity');
            $table->unsignedInteger('max_guests')->nullable()->after('min_guests');
            $table->string('capacity_note', 500)->nullable()->after('max_guests');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['min_guests', 'max_guests', 'capacity_note']);
        });
    }
};
