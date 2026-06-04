<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('booking_drafts')) {
            return;
        }

        Schema::create('booking_drafts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->string('draft_key', 120);
            $table->string('status', 30)->default('auto')->index();
            $table->string('workspace_role', 40)->nullable()->index();
            $table->unsignedTinyInteger('current_step')->default(0);
            $table->json('payload');
            $table->timestamp('last_touched_at')->nullable()->index();
            $table->timestamp('submitted_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['user_id', 'draft_key']);
            $table->index(['user_id', 'status', 'last_touched_at'], 'booking_drafts_user_status_touched_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_drafts');
    }
};
