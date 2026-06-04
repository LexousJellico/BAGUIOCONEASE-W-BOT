<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('public_events', function (Blueprint $table) {
            $table->id();
            $table->string('scope', 20)->default('bccc');
            $table->string('title');
            $table->string('venue');
            $table->date('event_date');
            $table->string('event_time', 10)->nullable();
            $table->text('description');
            $table->text('note')->nullable();
            $table->boolean('is_highlighted')->default(false);
            $table->boolean('is_public')->default(true);
            $table->json('images')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('feature_packages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->json('images')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('venue_spaces', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category');
            $table->string('capacity')->nullable();
            $table->text('short_description');
            $table->text('summary')->nullable();
            $table->json('details')->nullable();
            $table->string('light_image')->nullable();
            $table->string('dark_image')->nullable();
            $table->boolean('homepage_visible')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('homepage_stats', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('value');
            $table->string('suffix', 50)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->text('map_embed_url')->nullable();
            $table->text('open_map_url')->nullable();
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('footer_description')->nullable();
            $table->string('footer_copyright')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
        Schema::dropIfExists('homepage_stats');
        Schema::dropIfExists('venue_spaces');
        Schema::dropIfExists('feature_packages');
        Schema::dropIfExists('public_events');
    }
};