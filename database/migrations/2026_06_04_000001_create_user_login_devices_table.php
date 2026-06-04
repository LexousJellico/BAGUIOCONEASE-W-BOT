<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_login_devices')) {
            return;
        }

        Schema::create('user_login_devices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('session_id', 120)->nullable()->index();
            $table->string('device_fingerprint', 128)->index();
            $table->string('device_name', 160)->nullable();
            $table->string('browser', 120)->nullable();
            $table->string('platform', 120)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('country', 120)->nullable();
            $table->string('region', 120)->nullable();
            $table->string('city', 120)->nullable();
            $table->string('location_label', 255)->nullable();
            $table->text('user_agent')->nullable();
            $table->boolean('is_current')->default(false)->index();
            $table->boolean('is_trusted')->default(false)->index();
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('last_notified_at')->nullable();
            $table->timestamp('revoked_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['user_id', 'device_fingerprint'], 'user_login_devices_user_fingerprint_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_login_devices');
    }
};
