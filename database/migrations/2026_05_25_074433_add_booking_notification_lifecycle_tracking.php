<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table): void {
            if (! Schema::hasColumn('bookings', 'review_notified_at')) {
                $table->timestamp('review_notified_at')->nullable()->after('updated_at');
            }

            if (! Schema::hasColumn('bookings', 'review_notified_by_user_id')) {
                $table->foreignId('review_notified_by_user_id')
                    ->nullable()
                    ->after('review_notified_at')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('bookings', 'event_reminder_10d_sent_at')) {
                $table->timestamp('event_reminder_10d_sent_at')->nullable()->after('review_notified_by_user_id');
            }

            if (! Schema::hasColumn('bookings', 'event_reminder_3d_sent_at')) {
                $table->timestamp('event_reminder_3d_sent_at')->nullable()->after('event_reminder_10d_sent_at');
            }

            if (! Schema::hasColumn('bookings', 'event_reminder_1d_sent_at')) {
                $table->timestamp('event_reminder_1d_sent_at')->nullable()->after('event_reminder_3d_sent_at');
            }

            if (! Schema::hasColumn('bookings', 'payment_due_reminder_sent_at')) {
                $table->timestamp('payment_due_reminder_sent_at')->nullable()->after('event_reminder_1d_sent_at');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table): void {
            if (Schema::hasColumn('bookings', 'review_notified_by_user_id')) {
                $table->dropConstrainedForeignId('review_notified_by_user_id');
            }

            foreach ([
                'payment_due_reminder_sent_at',
                'event_reminder_1d_sent_at',
                'event_reminder_3d_sent_at',
                'event_reminder_10d_sent_at',
                'review_notified_at',
            ] as $column) {
                if (Schema::hasColumn('bookings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
