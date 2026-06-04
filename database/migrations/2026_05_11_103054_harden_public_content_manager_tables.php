<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->hardenPublicEvents();
        $this->hardenVenueSpaces();
        $this->hardenFeaturePackages();
        $this->hardenHomepageStats();
        $this->hardenTourismMembers();
        $this->hardenSiteSettings();
    }

    public function down(): void
    {
        /*
         * Intentionally non-destructive.
         *
         * This migration is a compatibility hardening pass for existing
         * public-content records. Dropping columns on rollback could destroy
         * uploaded public-site content, so rollback is kept safe.
         */
    }

    private function hardenPublicEvents(): void
    {
        if (! Schema::hasTable('public_events')) {
            return;
        }

        Schema::table('public_events', function (Blueprint $table): void {
            if (! Schema::hasColumn('public_events', 'title')) {
                $table->string('title')->nullable();
            }

            if (! Schema::hasColumn('public_events', 'slug')) {
                $table->string('slug')->nullable()->index();
            }

            if (! Schema::hasColumn('public_events', 'category')) {
                $table->string('category')->nullable()->index();
            }

            if (! Schema::hasColumn('public_events', 'event_category')) {
                $table->string('event_category')->nullable()->index();
            }

            if (! Schema::hasColumn('public_events', 'starts_at')) {
                $table->timestamp('starts_at')->nullable()->index();
            }

            if (! Schema::hasColumn('public_events', 'event_date')) {
                $table->timestamp('event_date')->nullable()->index();
            }

            if (! Schema::hasColumn('public_events', 'description')) {
                $table->longText('description')->nullable();
            }

            if (! Schema::hasColumn('public_events', 'external_url')) {
                $table->text('external_url')->nullable();
            }

            if (! Schema::hasColumn('public_events', 'image')) {
                $table->string('image')->nullable();
            }

            if (! Schema::hasColumn('public_events', 'image_path')) {
                $table->string('image_path')->nullable();
            }

            if (! Schema::hasColumn('public_events', 'image_url')) {
                $table->text('image_url')->nullable();
            }

            if (! Schema::hasColumn('public_events', 'homepage_visible')) {
                $table->boolean('homepage_visible')->default(true)->index();
            }

            if (! Schema::hasColumn('public_events', 'is_active')) {
                $table->boolean('is_active')->default(true)->index();
            }

            if (! Schema::hasColumn('public_events', 'sort_order')) {
                $table->integer('sort_order')->nullable()->index();
            }
        });
    }

    private function hardenVenueSpaces(): void
    {
        if (! Schema::hasTable('venue_spaces')) {
            return;
        }

        Schema::table('venue_spaces', function (Blueprint $table): void {
            if (! Schema::hasColumn('venue_spaces', 'title')) {
                $table->string('title')->nullable();
            }

            if (! Schema::hasColumn('venue_spaces', 'name')) {
                $table->string('name')->nullable();
            }

            if (! Schema::hasColumn('venue_spaces', 'slug')) {
                $table->string('slug')->nullable()->index();
            }

            if (! Schema::hasColumn('venue_spaces', 'subtitle')) {
                $table->string('subtitle')->nullable();
            }

            if (! Schema::hasColumn('venue_spaces', 'capacity')) {
                $table->string('capacity')->nullable();
            }

            if (! Schema::hasColumn('venue_spaces', 'description')) {
                $table->longText('description')->nullable();
            }

            if (! Schema::hasColumn('venue_spaces', 'image')) {
                $table->string('image')->nullable();
            }

            if (! Schema::hasColumn('venue_spaces', 'image_path')) {
                $table->string('image_path')->nullable();
            }

            if (! Schema::hasColumn('venue_spaces', 'image_url')) {
                $table->text('image_url')->nullable();
            }

            if (! Schema::hasColumn('venue_spaces', 'homepage_visible')) {
                $table->boolean('homepage_visible')->default(true)->index();
            }

            if (! Schema::hasColumn('venue_spaces', 'is_active')) {
                $table->boolean('is_active')->default(true)->index();
            }

            if (! Schema::hasColumn('venue_spaces', 'sort_order')) {
                $table->integer('sort_order')->nullable()->index();
            }
        });
    }

    private function hardenFeaturePackages(): void
    {
        if (! Schema::hasTable('feature_packages')) {
            return;
        }

        Schema::table('feature_packages', function (Blueprint $table): void {
            if (! Schema::hasColumn('feature_packages', 'title')) {
                $table->string('title')->nullable();
            }

            if (! Schema::hasColumn('feature_packages', 'slug')) {
                $table->string('slug')->nullable()->index();
            }

            if (! Schema::hasColumn('feature_packages', 'subtitle')) {
                $table->string('subtitle')->nullable();
            }

            if (! Schema::hasColumn('feature_packages', 'price_label')) {
                $table->string('price_label')->nullable();
            }

            if (! Schema::hasColumn('feature_packages', 'description')) {
                $table->longText('description')->nullable();
            }

            if (! Schema::hasColumn('feature_packages', 'external_url')) {
                $table->text('external_url')->nullable();
            }

            if (! Schema::hasColumn('feature_packages', 'image')) {
                $table->string('image')->nullable();
            }

            if (! Schema::hasColumn('feature_packages', 'image_path')) {
                $table->string('image_path')->nullable();
            }

            if (! Schema::hasColumn('feature_packages', 'image_url')) {
                $table->text('image_url')->nullable();
            }

            if (! Schema::hasColumn('feature_packages', 'homepage_visible')) {
                $table->boolean('homepage_visible')->default(true)->index();
            }

            if (! Schema::hasColumn('feature_packages', 'is_active')) {
                $table->boolean('is_active')->default(true)->index();
            }

            if (! Schema::hasColumn('feature_packages', 'sort_order')) {
                $table->integer('sort_order')->nullable()->index();
            }
        });
    }

    private function hardenHomepageStats(): void
    {
        if (! Schema::hasTable('homepage_stats')) {
            return;
        }

        Schema::table('homepage_stats', function (Blueprint $table): void {
            if (! Schema::hasColumn('homepage_stats', 'label')) {
                $table->string('label')->nullable();
            }

            if (! Schema::hasColumn('homepage_stats', 'title')) {
                $table->string('title')->nullable();
            }

            if (! Schema::hasColumn('homepage_stats', 'value')) {
                $table->string('value')->nullable();
            }

            if (! Schema::hasColumn('homepage_stats', 'description')) {
                $table->text('description')->nullable();
            }

            if (! Schema::hasColumn('homepage_stats', 'homepage_visible')) {
                $table->boolean('homepage_visible')->default(true)->index();
            }

            if (! Schema::hasColumn('homepage_stats', 'is_active')) {
                $table->boolean('is_active')->default(true)->index();
            }

            if (! Schema::hasColumn('homepage_stats', 'sort_order')) {
                $table->integer('sort_order')->nullable()->index();
            }
        });
    }

    private function hardenTourismMembers(): void
    {
        if (! Schema::hasTable('tourism_members')) {
            return;
        }

        Schema::table('tourism_members', function (Blueprint $table): void {
            if (! Schema::hasColumn('tourism_members', 'name')) {
                $table->string('name')->nullable();
            }

            if (! Schema::hasColumn('tourism_members', 'title')) {
                $table->string('title')->nullable();
            }

            if (! Schema::hasColumn('tourism_members', 'position')) {
                $table->string('position')->nullable();
            }

            if (! Schema::hasColumn('tourism_members', 'role')) {
                $table->string('role')->nullable();
            }

            if (! Schema::hasColumn('tourism_members', 'email')) {
                $table->string('email')->nullable();
            }

            if (! Schema::hasColumn('tourism_members', 'phone')) {
                $table->string('phone')->nullable();
            }

            if (! Schema::hasColumn('tourism_members', 'bio')) {
                $table->longText('bio')->nullable();
            }

            if (! Schema::hasColumn('tourism_members', 'description')) {
                $table->longText('description')->nullable();
            }

            if (! Schema::hasColumn('tourism_members', 'image')) {
                $table->string('image')->nullable();
            }

            if (! Schema::hasColumn('tourism_members', 'image_path')) {
                $table->string('image_path')->nullable();
            }

            if (! Schema::hasColumn('tourism_members', 'image_url')) {
                $table->text('image_url')->nullable();
            }

            if (! Schema::hasColumn('tourism_members', 'homepage_visible')) {
                $table->boolean('homepage_visible')->default(true)->index();
            }

            if (! Schema::hasColumn('tourism_members', 'is_active')) {
                $table->boolean('is_active')->default(true)->index();
            }

            if (! Schema::hasColumn('tourism_members', 'sort_order')) {
                $table->integer('sort_order')->nullable()->index();
            }
        });
    }

    private function hardenSiteSettings(): void
    {
        if (! Schema::hasTable('site_settings')) {
            return;
        }

        Schema::table('site_settings', function (Blueprint $table): void {
            if (! Schema::hasColumn('site_settings', 'email')) {
                $table->string('email')->nullable();
            }

            if (! Schema::hasColumn('site_settings', 'phone')) {
                $table->string('phone')->nullable();
            }

            if (! Schema::hasColumn('site_settings', 'address')) {
                $table->text('address')->nullable();
            }

            if (! Schema::hasColumn('site_settings', 'visita_url')) {
                $table->text('visita_url')->nullable();
            }

            if (! Schema::hasColumn('site_settings', 'creative_baguio_url')) {
                $table->text('creative_baguio_url')->nullable();
            }

            if (! Schema::hasColumn('site_settings', 'arts_url')) {
                $table->text('arts_url')->nullable();
            }

            if (! Schema::hasColumn('site_settings', 'footer_description')) {
                $table->longText('footer_description')->nullable();
            }

            if (! Schema::hasColumn('site_settings', 'footer_copyright')) {
                $table->string('footer_copyright')->nullable();
            }

            if (! Schema::hasColumn('site_settings', 'map_embed_url')) {
                $table->longText('map_embed_url')->nullable();
            }

            if (! Schema::hasColumn('site_settings', 'open_map_url')) {
                $table->longText('open_map_url')->nullable();
            }
        });
    }
};
