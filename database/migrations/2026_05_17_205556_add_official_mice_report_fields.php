<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mice_records')) {
            return;
        }

        Schema::table('mice_records', function (Blueprint $table): void {
            if (! Schema::hasColumn('mice_records', 'event_center_name')) {
                $table->string('event_center_name')->nullable()->index();
            }

            if (! Schema::hasColumn('mice_records', 'function_halls_count')) {
                $table->unsignedInteger('function_halls_count')->nullable();
            }

            if (! Schema::hasColumn('mice_records', 'function_hall_capacity')) {
                $table->unsignedInteger('function_hall_capacity')->nullable();
            }

            if (! Schema::hasColumn('mice_records', 'covered_month')) {
                $table->string('covered_month', 40)->nullable()->index();
            }

            if (! Schema::hasColumn('mice_records', 'event_started_at')) {
                $table->date('event_started_at')->nullable()->index();
            }

            if (! Schema::hasColumn('mice_records', 'event_finished_at')) {
                $table->date('event_finished_at')->nullable()->index();
            }

            if (! Schema::hasColumn('mice_records', 'number_of_hours')) {
                $table->decimal('number_of_hours', 8, 2)->nullable();
            }

            if (! Schema::hasColumn('mice_records', 'classification_of_event')) {
                $table->string('classification_of_event', 120)->nullable()->index();
            }

            if (! Schema::hasColumn('mice_records', 'mice_type_of_event')) {
                $table->string('mice_type_of_event', 120)->nullable()->index();
            }

            if (! Schema::hasColumn('mice_records', 'foreign_attendees')) {
                $table->unsignedInteger('foreign_attendees')->default(0);
            }

            if (! Schema::hasColumn('mice_records', 'domestic_attendees')) {
                $table->unsignedInteger('domestic_attendees')->default(0);
            }

            if (! Schema::hasColumn('mice_records', 'total_number_of_countries')) {
                $table->unsignedInteger('total_number_of_countries')->default(1);
            }

            if (! Schema::hasColumn('mice_records', 'countries_breakdown')) {
                $table->json('countries_breakdown')->nullable();
            }

            if (! Schema::hasColumn('mice_records', 'countries_breakdown_text')) {
                $table->text('countries_breakdown_text')->nullable();
            }

            if (! Schema::hasColumn('mice_records', 'has_exhibitions')) {
                $table->boolean('has_exhibitions')->default(false)->index();
            }

            if (! Schema::hasColumn('mice_records', 'exhibitors_count')) {
                $table->unsignedInteger('exhibitors_count')->default(0);
            }

            if (! Schema::hasColumn('mice_records', 'visitors_count')) {
                $table->unsignedInteger('visitors_count')->default(0);
            }

            if (! Schema::hasColumn('mice_records', 'organizer_organization_name')) {
                $table->string('organizer_organization_name')->nullable();
            }

            if (! Schema::hasColumn('mice_records', 'organizer_address')) {
                $table->text('organizer_address')->nullable();
            }

            if (! Schema::hasColumn('mice_records', 'organizer_contact_person')) {
                $table->string('organizer_contact_person')->nullable();
            }

            if (! Schema::hasColumn('mice_records', 'organizer_contact_number')) {
                $table->string('organizer_contact_number', 80)->nullable();
            }

            if (! Schema::hasColumn('mice_records', 'comments_feedback')) {
                $table->text('comments_feedback')->nullable();
            }

            if (! Schema::hasColumn('mice_records', 'source')) {
                $table->string('source', 80)->nullable()->index();
            }

            if (! Schema::hasColumn('mice_records', 'source_response_timestamp')) {
                $table->timestamp('source_response_timestamp')->nullable()->index();
            }

            if (! Schema::hasColumn('mice_records', 'source_username')) {
                $table->string('source_username')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('mice_records')) {
            return;
        }

        Schema::table('mice_records', function (Blueprint $table): void {
            $columns = array_values(array_filter([
                Schema::hasColumn('mice_records', 'source_username') ? 'source_username' : null,
                Schema::hasColumn('mice_records', 'source_response_timestamp') ? 'source_response_timestamp' : null,
                Schema::hasColumn('mice_records', 'source') ? 'source' : null,
                Schema::hasColumn('mice_records', 'comments_feedback') ? 'comments_feedback' : null,
                Schema::hasColumn('mice_records', 'organizer_contact_number') ? 'organizer_contact_number' : null,
                Schema::hasColumn('mice_records', 'organizer_contact_person') ? 'organizer_contact_person' : null,
                Schema::hasColumn('mice_records', 'organizer_address') ? 'organizer_address' : null,
                Schema::hasColumn('mice_records', 'organizer_organization_name') ? 'organizer_organization_name' : null,
                Schema::hasColumn('mice_records', 'visitors_count') ? 'visitors_count' : null,
                Schema::hasColumn('mice_records', 'exhibitors_count') ? 'exhibitors_count' : null,
                Schema::hasColumn('mice_records', 'has_exhibitions') ? 'has_exhibitions' : null,
                Schema::hasColumn('mice_records', 'countries_breakdown_text') ? 'countries_breakdown_text' : null,
                Schema::hasColumn('mice_records', 'countries_breakdown') ? 'countries_breakdown' : null,
                Schema::hasColumn('mice_records', 'total_number_of_countries') ? 'total_number_of_countries' : null,
                Schema::hasColumn('mice_records', 'domestic_attendees') ? 'domestic_attendees' : null,
                Schema::hasColumn('mice_records', 'foreign_attendees') ? 'foreign_attendees' : null,
                Schema::hasColumn('mice_records', 'mice_type_of_event') ? 'mice_type_of_event' : null,
                Schema::hasColumn('mice_records', 'classification_of_event') ? 'classification_of_event' : null,
                Schema::hasColumn('mice_records', 'number_of_hours') ? 'number_of_hours' : null,
                Schema::hasColumn('mice_records', 'event_finished_at') ? 'event_finished_at' : null,
                Schema::hasColumn('mice_records', 'event_started_at') ? 'event_started_at' : null,
                Schema::hasColumn('mice_records', 'covered_month') ? 'covered_month' : null,
                Schema::hasColumn('mice_records', 'function_hall_capacity') ? 'function_hall_capacity' : null,
                Schema::hasColumn('mice_records', 'function_halls_count') ? 'function_halls_count' : null,
                Schema::hasColumn('mice_records', 'event_center_name') ? 'event_center_name' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
