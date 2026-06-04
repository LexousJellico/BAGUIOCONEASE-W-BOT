<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table): void {
                if (! Schema::hasColumn('bookings', 'selected_package_code')) {
                    $table->string('selected_package_code', 80)->nullable()->index();
                }

                if (! Schema::hasColumn('bookings', 'selected_area_keys')) {
                    $table->json('selected_area_keys')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'dressing_room_selection')) {
                    $table->string('dressing_room_selection', 80)->nullable();
                }

                if (! Schema::hasColumn('bookings', 'dressing_room_charge')) {
                    $table->decimal('dressing_room_charge', 10, 2)->default(0);
                }

                if (! Schema::hasColumn('bookings', 'mice_required')) {
                    $table->boolean('mice_required')->default(true)->index();
                }

                if (! Schema::hasColumn('bookings', 'mice_exemption_reason')) {
                    $table->string('mice_exemption_reason')->nullable();
                }

                if (! Schema::hasColumn('bookings', 'private_event_type')) {
                    $table->string('private_event_type', 120)->nullable()->index();
                }

                if (! Schema::hasColumn('bookings', 'schedule_version')) {
                    $table->string('schedule_version', 40)->default('legacy')->index();
                }

                if (! Schema::hasColumn('bookings', 'schedule_meta')) {
                    $table->json('schedule_meta')->nullable();
                }
            });
        }

        if (! Schema::hasTable('venue_package_templates')) {
            Schema::create('venue_package_templates', function (Blueprint $table): void {
                $table->id();
                $table->string('code', 80)->unique();
                $table->string('name');
                $table->string('subtitle')->nullable();
                $table->text('description')->nullable();
                $table->json('area_keys');
                $table->string('image_path')->nullable();
                $table->boolean('is_public')->default(true)->index();
                $table->boolean('is_featured')->default(false)->index();
                $table->unsignedInteger('sort_order')->default(0)->index();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('site_page_views')) {
            Schema::create('site_page_views', function (Blueprint $table): void {
                $table->id();
                $table->string('page_key', 80)->default('home')->index();
                $table->string('visitor_hash', 128)->nullable()->index();
                $table->string('session_key', 128)->nullable()->index();
                $table->string('user_agent_hash', 128)->nullable();
                $table->ipAddress('ip_address')->nullable();
                $table->timestamp('viewed_at')->nullable()->index();
                $table->timestamps();

                $table->index(['page_key', 'viewed_at']);
            });
        }

        if (! Schema::hasTable('booking_schedule_segments')) {
            Schema::create('booking_schedule_segments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
                $table->date('date')->index();
                $table->string('segment_role', 40)->default('event')->index();
                $table->string('base_block', 40)->default('whole_day')->index();
                $table->dateTime('starts_at')->index();
                $table->dateTime('ends_at')->index();
                $table->boolean('has_additional_hours')->default(false);
                $table->unsignedTinyInteger('additional_hours')->default(0);
                $table->dateTime('additional_starts_at')->nullable();
                $table->dateTime('additional_ends_at')->nullable();
                $table->json('area_keys')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['booking_id', 'date']);
                $table->index(['starts_at', 'ends_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_schedule_segments');
        Schema::dropIfExists('site_page_views');
        Schema::dropIfExists('venue_package_templates');

        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $columns = array_values(array_filter([
                    Schema::hasColumn('bookings', 'schedule_meta') ? 'schedule_meta' : null,
                    Schema::hasColumn('bookings', 'schedule_version') ? 'schedule_version' : null,
                    Schema::hasColumn('bookings', 'private_event_type') ? 'private_event_type' : null,
                    Schema::hasColumn('bookings', 'mice_exemption_reason') ? 'mice_exemption_reason' : null,
                    Schema::hasColumn('bookings', 'mice_required') ? 'mice_required' : null,
                    Schema::hasColumn('bookings', 'dressing_room_charge') ? 'dressing_room_charge' : null,
                    Schema::hasColumn('bookings', 'dressing_room_selection') ? 'dressing_room_selection' : null,
                    Schema::hasColumn('bookings', 'selected_area_keys') ? 'selected_area_keys' : null,
                    Schema::hasColumn('bookings', 'selected_package_code') ? 'selected_package_code' : null,
                ]));

                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
