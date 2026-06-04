<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_lifecycle_events', function (Blueprint $table) {
            $table->id();
            // Intentionally no FK constraint on booking_id so audit rows can survive auto-deletion.
            $table->unsignedBigInteger('booking_id')->nullable()->index();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_key', 100)->index();
            $table->string('title');
            $table->string('from_status', 50)->nullable();
            $table->string('to_status', 50)->nullable();
            $table->string('from_payment_status', 50)->nullable();
            $table->string('to_payment_status', 50)->nullable();
            $table->text('reason')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('event_at')->nullable()->index();
            $table->timestamps();

            $table->index(['booking_id', 'event_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_lifecycle_events');
    }
};
