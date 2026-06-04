<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mice_records', function (Blueprint $table): void {
            if (! Schema::hasColumn('mice_records', 'event_scope')) {
                $table->string('event_scope', 40)->default('public')->after('year_recorded')->index();
            }

            if (! Schema::hasColumn('mice_records', 'draft_expires_at')) {
                $table->timestamp('draft_expires_at')->nullable()->after('status')->index();
            }

            if (! Schema::hasColumn('mice_records', 'finalized_at')) {
                $table->timestamp('finalized_at')->nullable()->after('draft_expires_at')->index();
            }

            if (! Schema::hasColumn('mice_records', 'decline_cleanup_at')) {
                $table->timestamp('decline_cleanup_at')->nullable()->after('finalized_at')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('mice_records', function (Blueprint $table): void {
            foreach (['decline_cleanup_at', 'finalized_at', 'draft_expires_at', 'event_scope'] as $column) {
                if (Schema::hasColumn('mice_records', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
