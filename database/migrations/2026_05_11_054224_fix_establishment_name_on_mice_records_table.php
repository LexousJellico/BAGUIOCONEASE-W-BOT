<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mice_records')) {
            return;
        }

        if (Schema::hasColumn('mice_records', 'establishment_name')) {
            DB::statement("
                UPDATE mice_records
                SET establishment_name = COALESCE(NULLIF(establishment_name, ''), NULLIF(organization_name, ''), NULLIF(organizer_name, ''), 'Baguio Convention and Cultural Center')
                WHERE establishment_name IS NULL OR establishment_name = ''
            ");

            if ($this->driver() !== 'mysql') {
                return;
            }

            DB::statement("
                ALTER TABLE mice_records
                MODIFY establishment_name VARCHAR(255) NULL
            ");
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('mice_records')) {
            return;
        }

        if (Schema::hasColumn('mice_records', 'establishment_name')) {
            DB::statement("
                UPDATE mice_records
                SET establishment_name = COALESCE(NULLIF(establishment_name, ''), NULLIF(organization_name, ''), NULLIF(organizer_name, ''), 'Baguio Convention and Cultural Center')
                WHERE establishment_name IS NULL OR establishment_name = ''
            ");

            if ($this->driver() !== 'mysql') {
                return;
            }

            DB::statement("
                ALTER TABLE mice_records
                MODIFY establishment_name VARCHAR(255) NOT NULL
            ");
        }
    }

    private function driver(): string
    {
        return DB::connection()->getDriverName();
    }
};
