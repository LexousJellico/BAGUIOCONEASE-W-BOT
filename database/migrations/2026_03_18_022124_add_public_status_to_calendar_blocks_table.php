<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('calendar_blocks', 'public_status')) {
            Schema::table('calendar_blocks', function (Blueprint $table) {
                $table->string('public_status', 20)->default('red')->after('block');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('calendar_blocks', 'public_status')) {
            Schema::table('calendar_blocks', function (Blueprint $table) {
                $table->dropColumn('public_status');
            });
        }
    }
};