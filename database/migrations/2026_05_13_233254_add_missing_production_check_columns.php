<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'role_name')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('role_name')->nullable()->after('google_id')->index();
            });
        }

        if (Schema::hasTable('bookings') && ! Schema::hasColumn('bookings', 'archived_at')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->timestamp('archived_at')->nullable()->after('expired_at')->index();
            });
        }

        if (Schema::hasTable('booking_payments')) {
            Schema::table('booking_payments', function (Blueprint $table): void {
                if (! Schema::hasColumn('booking_payments', 'proof_file_name')) {
                    $table->string('proof_file_name')->nullable()->after('proof_image_path');
                }

                if (! Schema::hasColumn('booking_payments', 'proof_mime_type')) {
                    $table->string('proof_mime_type')->nullable()->after('proof_file_name');
                }

                if (! Schema::hasColumn('booking_payments', 'proof_file_size')) {
                    $table->unsignedBigInteger('proof_file_size')->nullable()->after('proof_mime_type');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('booking_payments')) {
            Schema::table('booking_payments', function (Blueprint $table): void {
                $dropColumns = array_values(array_filter([
                    Schema::hasColumn('booking_payments', 'proof_file_size') ? 'proof_file_size' : null,
                    Schema::hasColumn('booking_payments', 'proof_mime_type') ? 'proof_mime_type' : null,
                    Schema::hasColumn('booking_payments', 'proof_file_name') ? 'proof_file_name' : null,
                ]));

                if ($dropColumns !== []) {
                    $table->dropColumn($dropColumns);
                }
            });
        }

        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'archived_at')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->dropIndex(['archived_at']);
                $table->dropColumn('archived_at');
            });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'role_name')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropIndex(['role_name']);
                $table->dropColumn('role_name');
            });
        }
    }
};
