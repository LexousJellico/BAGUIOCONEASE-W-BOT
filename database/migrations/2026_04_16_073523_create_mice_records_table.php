<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mice_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->string('btc_group_code', 30)->nullable()->index();
            $table->unsignedInteger('record_no')->nullable()->index();
            $table->string('establishment_name')->index();
            $table->text('business_type')->nullable();
            $table->string('seats_unit', 120)->nullable();
            $table->unsignedInteger('total_employees')->default(0);
            $table->unsignedSmallInteger('year_recorded')->nullable()->index();
            $table->string('region', 120)->nullable()->index();
            $table->string('province_huc', 120)->nullable()->index();
            $table->string('city_municipality', 120)->nullable()->index();
            $table->string('month_added', 40)->nullable()->index();
            $table->unsignedInteger('female_employees')->default(0);
            $table->unsignedInteger('male_employees')->default(0);
            $table->string('classification', 160)->nullable()->index();
            $table->string('enterprise_group', 40)->nullable()->index();
            $table->boolean('permit_to_engage')->default(false)->index();
            $table->boolean('dot_accredited')->default(false)->index();
            $table->boolean('active_member')->default(false)->index();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mice_records');
    }
};
