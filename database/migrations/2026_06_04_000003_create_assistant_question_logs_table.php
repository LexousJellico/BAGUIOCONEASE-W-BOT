<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assistant_question_logs', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('surface', 24)->default('public')->index();
            $table->string('page')->nullable();
            $table->string('context_label')->nullable();
            $table->text('question');
            $table->text('normalized_question')->nullable();
            $table->longText('answer')->nullable();
            $table->string('mode', 40)->default('local')->index();
            $table->unsignedTinyInteger('confidence')->default(0)->index();
            $table->unsignedSmallInteger('source_count')->default(0);
            $table->json('sources')->nullable();
            $table->boolean('unresolved')->default(false)->index();
            $table->boolean('helpful')->nullable()->index();
            $table->longText('corrected_answer')->nullable();
            $table->string('ip_hash', 96)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();

            $table->index(['surface', 'unresolved', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistant_question_logs');
    }
};
