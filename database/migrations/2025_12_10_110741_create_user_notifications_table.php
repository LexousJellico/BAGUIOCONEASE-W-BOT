<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // booking_created, booking_updated, payment_created, payment_updated, etc.
            $table->string('type', 50);

            // Short label shown in list
            $table->string('title');

            // Longer text (optional)
            $table->text('message')->nullable();

            // Optional link (e.g. /bookings/123)
            $table->string('link')->nullable();

            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
