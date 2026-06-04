<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('assistant_chat_sessions')) {
            return;
        }

        Schema::create('assistant_chat_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_key', 128)->index();
            $table->string('role', 40)->default('public');
            $table->string('surface', 40)->default('public');
            $table->string('page_context', 160)->nullable();
            $table->boolean('is_open')->default(false);
            $table->json('messages')->nullable();
            $table->json('suggestions')->nullable();
            $table->json('guide')->nullable();
            $table->json('spam_guard')->nullable();
            $table->timestamp('last_activity_at')->nullable()->index();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();

            $table->unique('session_key', 'assistant_chat_session_key_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistant_chat_sessions');
    }
};
