<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ✅ Survey proof storage (DISK-BASED)
 *
 * We do NOT store the uploaded image bytes in the database.
 * Instead, we store the file on disk (Laravel storage) and only keep the path.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Required in the app layer (nullable for existing rows)
            if (!Schema::hasColumn('bookings', 'survey_email')) {
                $table->string('survey_email')->nullable()->after('client_email');
            }

            // Stores ONLY the relative path to the image saved on disk.
            if (!Schema::hasColumn('bookings', 'survey_proof_image_path')) {
                $table->string('survey_proof_image_path')->nullable()->after('survey_email');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'survey_proof_image_path')) {
                $table->dropColumn('survey_proof_image_path');
            }

            if (Schema::hasColumn('bookings', 'survey_email')) {
                $table->dropColumn('survey_email');
            }
        });
    }
};
