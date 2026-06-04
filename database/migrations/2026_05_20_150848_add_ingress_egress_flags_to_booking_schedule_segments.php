<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('booking_schedule_segments')) {
            return;
        }

        Schema::table('booking_schedule_segments', function (Blueprint $table): void {
            if (! Schema::hasColumn('booking_schedule_segments', 'has_ingress_label')) {
                $table->boolean('has_ingress_label')->default(false)->after('segment_role');
            }

            if (! Schema::hasColumn('booking_schedule_segments', 'has_egress_label')) {
                $table->boolean('has_egress_label')->default(false)->after('has_ingress_label');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('booking_schedule_segments')) {
            return;
        }

        Schema::table('booking_schedule_segments', function (Blueprint $table): void {
            if (Schema::hasColumn('booking_schedule_segments', 'has_egress_label')) {
                $table->dropColumn('has_egress_label');
            }

            if (Schema::hasColumn('booking_schedule_segments', 'has_ingress_label')) {
                $table->dropColumn('has_ingress_label');
            }
        });
    }
};
