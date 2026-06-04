<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tourism_members', function (Blueprint $table) {
            if (! Schema::hasColumn('tourism_members', 'office_section')) {
                $table->string('office_section')->nullable()->after('designation');
            }

            if (! Schema::hasColumn('tourism_members', 'team_label')) {
                $table->string('team_label')->nullable()->after('unit_name');
            }

            if (! Schema::hasColumn('tourism_members', 'reports_to_name')) {
                $table->string('reports_to_name')->nullable()->after('team_label');
            }

            if (! Schema::hasColumn('tourism_members', 'tree_level')) {
                $table->unsignedTinyInteger('tree_level')->default(1)->after('reports_to_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tourism_members', function (Blueprint $table) {
            foreach (['office_section', 'team_label', 'reports_to_name', 'tree_level'] as $column) {
                if (Schema::hasColumn('tourism_members', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
