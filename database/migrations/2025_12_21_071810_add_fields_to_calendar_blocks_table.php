<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('calendar_blocks', function (Blueprint $table) {
            if (!Schema::hasColumn('calendar_blocks', 'title')) {
                $table->string('title')->after('id');
            }

            if (!Schema::hasColumn('calendar_blocks', 'area')) {
                $table->string('area')->nullable()->after('title');
            }

            if (!Schema::hasColumn('calendar_blocks', 'notes')) {
                $table->text('notes')->nullable()->after('area');
            }

            if (!Schema::hasColumn('calendar_blocks', 'block')) {
                $table->enum('block', ['AM', 'PM', 'EVE', 'DAY'])->default('DAY')->after('notes');
            }

            if (!Schema::hasColumn('calendar_blocks', 'date_from')) {
                $table->date('date_from')->after('block');
            }

            if (!Schema::hasColumn('calendar_blocks', 'date_to')) {
                $table->date('date_to')->after('date_from');
            }

            if (!Schema::hasColumn('calendar_blocks', 'created_by_user_id')) {
                $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete()->after('date_to');
            }

            $table->index(['date_from', 'date_to']);
            $table->index(['block']);
        });
    }

    public function down(): void
    {
        Schema::table('calendar_blocks', function (Blueprint $table) {
            if (Schema::hasColumn('calendar_blocks', 'created_by_user_id')) {
                $table->dropConstrainedForeignId('created_by_user_id');
            }

            if (Schema::hasColumn('calendar_blocks', 'date_to')) {
                $table->dropColumn('date_to');
            }

            if (Schema::hasColumn('calendar_blocks', 'date_from')) {
                $table->dropColumn('date_from');
            }

            if (Schema::hasColumn('calendar_blocks', 'block')) {
                $table->dropColumn('block');
            }

            if (Schema::hasColumn('calendar_blocks', 'notes')) {
                $table->dropColumn('notes');
            }

            if (Schema::hasColumn('calendar_blocks', 'area')) {
                $table->dropColumn('area');
            }

            if (Schema::hasColumn('calendar_blocks', 'title')) {
                $table->dropColumn('title');
            }
        });
    }
};
