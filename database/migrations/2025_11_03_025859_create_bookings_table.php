<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->string('company_name')->nullable();
            $table->string('client_name');
            $table->string('client_contact_number');
            $table->string('client_email');
            $table->string('client_address');
            $table->string('type_of_event');
            $table->datetime('booking_date_from');
            $table->datetime('booking_date_to');
            $table->integer('number_of_guests')->default(0);
            $table->string('booking_status', 50)->default('pencil_booked')->index();
            $table->string('payment_status', 50)->default('unpaid')->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
