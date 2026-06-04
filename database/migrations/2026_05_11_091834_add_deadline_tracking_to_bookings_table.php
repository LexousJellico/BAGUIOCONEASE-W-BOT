<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table): void {
            if (! Schema::hasColumn('bookings', 'expired_at')) {
                $table->timestamp('expired_at')->nullable()->after('booking_status');
            }

            if (! Schema::hasColumn('bookings', 'payment_balance_due_at')) {
                $table->timestamp('payment_balance_due_at')->nullable()->after('expired_at');
            }

            if (! Schema::hasColumn('bookings', 'auto_declined_at')) {
                $table->timestamp('auto_declined_at')->nullable()->after('payment_balance_due_at');
            }

            if (! Schema::hasColumn('bookings', 'auto_decline_reason')) {
                $table->text('auto_decline_reason')->nullable()->after('auto_declined_at');
            }
        });

        if (
            Schema::hasColumn('bookings', 'expired_at')
            && Schema::hasColumn('bookings', 'created_at')
            && Schema::hasColumn('bookings', 'booking_status')
        ) {
            DB::table('bookings')
                ->whereNull('expired_at')
                ->whereIn('booking_status', [
                    'pending',
                    'submitted',
                    'pencil_booked',
                    'pencil-booked',
                    'for_review',
                    'for review',
                ])
                ->update([
                    'expired_at' => $this->expirationExpression(),
                ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table): void {
            if (Schema::hasColumn('bookings', 'auto_decline_reason')) {
                $table->dropColumn('auto_decline_reason');
            }

            if (Schema::hasColumn('bookings', 'auto_declined_at')) {
                $table->dropColumn('auto_declined_at');
            }

            if (Schema::hasColumn('bookings', 'payment_balance_due_at')) {
                $table->dropColumn('payment_balance_due_at');
            }

            if (Schema::hasColumn('bookings', 'expired_at')) {
                $table->dropColumn('expired_at');
            }
        });
    }

    private function expirationExpression(): mixed
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => DB::raw("datetime(created_at, '+24 hours')"),
            default => DB::raw('DATE_ADD(created_at, INTERVAL 24 HOUR)'),
        };
    }
};
