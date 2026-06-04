<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_types', function (Blueprint $table): void {
            if (! Schema::hasColumn('service_types', 'description')) {
                $table->text('description')->nullable()->after('name');
            }

            if (! Schema::hasColumn('service_types', 'capacity')) {
                $table->string('capacity')->nullable()->after('description');
            }

            if (! Schema::hasColumn('service_types', 'min_capacity')) {
                $table->unsignedInteger('min_capacity')->nullable()->after('capacity');
            }

            if (! Schema::hasColumn('service_types', 'max_capacity')) {
                $table->unsignedInteger('max_capacity')->nullable()->after('min_capacity');
            }

            if (! Schema::hasColumn('service_types', 'options_note')) {
                $table->text('options_note')->nullable()->after('max_capacity');
            }

            if (! Schema::hasColumn('service_types', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('options_note');
            }

            if (! Schema::hasColumn('service_types', 'sort_order')) {
                $table->unsignedInteger('sort_order')->default(999)->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('service_types', function (Blueprint $table): void {
            foreach (['sort_order', 'is_active', 'options_note', 'max_capacity', 'min_capacity', 'capacity', 'description'] as $column) {
                if (Schema::hasColumn('service_types', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
