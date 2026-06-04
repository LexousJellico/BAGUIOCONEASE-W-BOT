<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table) {
                if (! Schema::hasColumn('bookings', 'base_subtotal')) {
                    $table->decimal('base_subtotal', 12, 2)->nullable();
                }

                if (! Schema::hasColumn('bookings', 'discount_total')) {
                    $table->decimal('discount_total', 12, 2)->nullable();
                }

                if (! Schema::hasColumn('bookings', 'finalized_total')) {
                    $table->decimal('finalized_total', 12, 2)->nullable();
                }

                if (! Schema::hasColumn('bookings', 'required_down_payment_amount')) {
                    $table->decimal('required_down_payment_amount', 12, 2)->nullable();
                }

                if (! Schema::hasColumn('bookings', 'required_bond_amount')) {
                    $table->decimal('required_bond_amount', 12, 2)->nullable();
                }

                if (! Schema::hasColumn('bookings', 'bond_status')) {
                    $table->string('bond_status', 40)->default('pending');
                }

                if (! Schema::hasColumn('bookings', 'bond_paid_at')) {
                    $table->timestamp('bond_paid_at')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'bond_waived_at')) {
                    $table->timestamp('bond_waived_at')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'bond_waiver_reason')) {
                    $table->text('bond_waiver_reason')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'down_payment_due_at')) {
                    $table->timestamp('down_payment_due_at')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'balance_due_at')) {
                    $table->timestamp('balance_due_at')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'confirmed_at')) {
                    $table->timestamp('confirmed_at')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'confirmed_by_user_id')) {
                    $table->foreignId('confirmed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                }

                if (! Schema::hasColumn('bookings', 'declined_at')) {
                    $table->timestamp('declined_at')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'declined_by_user_id')) {
                    $table->foreignId('declined_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                }

                if (! Schema::hasColumn('bookings', 'cancelled_at')) {
                    $table->timestamp('cancelled_at')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'cancelled_by_user_id')) {
                    $table->foreignId('cancelled_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                }

                if (! Schema::hasColumn('bookings', 'completed_at')) {
                    $table->timestamp('completed_at')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'completed_by_user_id')) {
                    $table->foreignId('completed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                }

                if (! Schema::hasColumn('bookings', 'final_computation_meta')) {
                    $table->json('final_computation_meta')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'final_computation_locked_at')) {
                    $table->timestamp('final_computation_locked_at')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'final_computation_locked_by_user_id')) {
                    $table->foreignId('final_computation_locked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                }

                if (! Schema::hasColumn('bookings', 'billing_notes')) {
                    $table->text('billing_notes')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'cancellation_penalty_rate')) {
                    $table->decimal('cancellation_penalty_rate', 5, 4)->nullable();
                }

                if (! Schema::hasColumn('bookings', 'cancellation_penalty_amount')) {
                    $table->decimal('cancellation_penalty_amount', 12, 2)->nullable();
                }
            });
        }

        if (! Schema::hasTable('booking_post_event_charges')) {
            Schema::create('booking_post_event_charges', function (Blueprint $table) {
                $table->id();
                $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
                $table->string('category', 80)->default('post_event');
                $table->string('label');
                $table->decimal('amount', 12, 2)->default(0);
                $table->string('status', 40)->default('assessed');
                $table->text('notes')->nullable();
                $table->timestamp('assessed_at')->nullable();
                $table->foreignId('assessed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('settled_at')->nullable();
                $table->timestamps();

                $table->index(['booking_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_post_event_charges');

        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            foreach ([
                'base_subtotal',
                'discount_total',
                'finalized_total',
                'required_down_payment_amount',
                'required_bond_amount',
                'bond_status',
                'bond_paid_at',
                'bond_waived_at',
                'bond_waiver_reason',
                'down_payment_due_at',
                'balance_due_at',
                'confirmed_at',
                'confirmed_by_user_id',
                'declined_at',
                'declined_by_user_id',
                'cancelled_at',
                'cancelled_by_user_id',
                'completed_at',
                'completed_by_user_id',
                'final_computation_meta',
                'final_computation_locked_at',
                'final_computation_locked_by_user_id',
                'billing_notes',
                'cancellation_penalty_rate',
                'cancellation_penalty_amount',
            ] as $column) {
                if (Schema::hasColumn('bookings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
