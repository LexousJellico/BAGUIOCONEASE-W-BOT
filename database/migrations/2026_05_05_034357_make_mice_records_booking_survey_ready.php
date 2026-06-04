<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mice_records')) {
            Schema::create('mice_records', function (Blueprint $table) {
                $table->id();
                $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();

                $table->unsignedInteger('record_no')->nullable();
                $table->unsignedInteger('year_recorded')->nullable();
                $table->string('status')->default('draft');

                $table->string('enterprise_group')->nullable();
                $table->string('btc_group_code')->nullable();

                $table->string('event_name')->nullable();
                $table->string('event_category')->nullable();
                $table->string('type_of_event')->nullable();
                $table->string('venue_area')->nullable();

                $table->date('event_date_from')->nullable();
                $table->date('event_date_to')->nullable();
                $table->unsignedInteger('event_days')->nullable();

                $table->string('organization_name')->nullable();
                $table->string('organizer_name')->nullable();
                $table->string('organizer_type')->nullable();
                $table->string('contact_person')->nullable();
                $table->string('contact_number')->nullable();
                $table->string('email')->nullable();
                $table->text('address')->nullable();

                $table->unsignedInteger('local_male_participants')->default(0);
                $table->unsignedInteger('local_female_participants')->default(0);
                $table->unsignedInteger('domestic_male_participants')->default(0);
                $table->unsignedInteger('domestic_female_participants')->default(0);
                $table->unsignedInteger('foreign_male_participants')->default(0);
                $table->unsignedInteger('foreign_female_participants')->default(0);
                $table->unsignedInteger('total_participants')->default(0);

                $table->string('main_origin_country')->nullable();
                $table->string('main_origin_province')->nullable();
                $table->string('main_origin_city')->nullable();

                $table->unsignedInteger('same_day_visitors')->default(0);
                $table->unsignedInteger('overnight_visitors')->default(0);
                $table->unsignedInteger('estimated_room_nights')->default(0);
                $table->decimal('estimated_tourism_receipts', 12, 2)->default(0);

                $table->unsignedInteger('total_employees')->nullable();
                $table->unsignedInteger('female_employees')->nullable();
                $table->unsignedInteger('male_employees')->nullable();

                $table->boolean('permit_to_engage')->default(false);
                $table->boolean('dot_accredited')->default(false);
                $table->boolean('active_member')->default(false);

                $table->text('remarks')->nullable();
                $table->timestamp('submitted_at')->nullable();

                $table->timestamps();

                $table->unique('booking_id');
                $table->index(['year_recorded', 'event_category']);
                $table->index(['status', 'submitted_at']);
            });

            return;
        }

        Schema::table('mice_records', function (Blueprint $table) {
            $columns = Schema::getColumnListing('mice_records');

            $add = function (string $column, callable $callback) use ($columns, $table) {
                if (! in_array($column, $columns, true)) {
                    $callback($table);
                }
            };

            $add('booking_id', fn (Blueprint $table) => $table->foreignId('booking_id')->nullable()->after('id')->constrained()->nullOnDelete());
            $add('submitted_by_user_id', fn (Blueprint $table) => $table->foreignId('submitted_by_user_id')->nullable()->after('booking_id')->constrained('users')->nullOnDelete());
            $add('updated_by_user_id', fn (Blueprint $table) => $table->foreignId('updated_by_user_id')->nullable()->after('submitted_by_user_id')->constrained('users')->nullOnDelete());

            $add('status', fn (Blueprint $table) => $table->string('status')->default('draft')->after('year_recorded'));
            $add('event_name', fn (Blueprint $table) => $table->string('event_name')->nullable());
            $add('event_category', fn (Blueprint $table) => $table->string('event_category')->nullable());
            $add('type_of_event', fn (Blueprint $table) => $table->string('type_of_event')->nullable());
            $add('venue_area', fn (Blueprint $table) => $table->string('venue_area')->nullable());

            $add('event_date_from', fn (Blueprint $table) => $table->date('event_date_from')->nullable());
            $add('event_date_to', fn (Blueprint $table) => $table->date('event_date_to')->nullable());
            $add('event_days', fn (Blueprint $table) => $table->unsignedInteger('event_days')->nullable());

            $add('organization_name', fn (Blueprint $table) => $table->string('organization_name')->nullable());
            $add('organizer_name', fn (Blueprint $table) => $table->string('organizer_name')->nullable());
            $add('organizer_type', fn (Blueprint $table) => $table->string('organizer_type')->nullable());
            $add('contact_person', fn (Blueprint $table) => $table->string('contact_person')->nullable());
            $add('contact_number', fn (Blueprint $table) => $table->string('contact_number')->nullable());
            $add('email', fn (Blueprint $table) => $table->string('email')->nullable());
            $add('address', fn (Blueprint $table) => $table->text('address')->nullable());

            $add('local_male_participants', fn (Blueprint $table) => $table->unsignedInteger('local_male_participants')->default(0));
            $add('local_female_participants', fn (Blueprint $table) => $table->unsignedInteger('local_female_participants')->default(0));
            $add('domestic_male_participants', fn (Blueprint $table) => $table->unsignedInteger('domestic_male_participants')->default(0));
            $add('domestic_female_participants', fn (Blueprint $table) => $table->unsignedInteger('domestic_female_participants')->default(0));
            $add('foreign_male_participants', fn (Blueprint $table) => $table->unsignedInteger('foreign_male_participants')->default(0));
            $add('foreign_female_participants', fn (Blueprint $table) => $table->unsignedInteger('foreign_female_participants')->default(0));
            $add('total_participants', fn (Blueprint $table) => $table->unsignedInteger('total_participants')->default(0));

            $add('main_origin_country', fn (Blueprint $table) => $table->string('main_origin_country')->nullable());
            $add('main_origin_province', fn (Blueprint $table) => $table->string('main_origin_province')->nullable());
            $add('main_origin_city', fn (Blueprint $table) => $table->string('main_origin_city')->nullable());

            $add('same_day_visitors', fn (Blueprint $table) => $table->unsignedInteger('same_day_visitors')->default(0));
            $add('overnight_visitors', fn (Blueprint $table) => $table->unsignedInteger('overnight_visitors')->default(0));
            $add('estimated_room_nights', fn (Blueprint $table) => $table->unsignedInteger('estimated_room_nights')->default(0));
            $add('estimated_tourism_receipts', fn (Blueprint $table) => $table->decimal('estimated_tourism_receipts', 12, 2)->default(0));

            $add('remarks', fn (Blueprint $table) => $table->text('remarks')->nullable());
            $add('submitted_at', fn (Blueprint $table) => $table->timestamp('submitted_at')->nullable());

            if (! in_array('booking_id', $columns, true)) {
                return;
            }
        });
    }

    public function down(): void
    {
        // Intentionally non-destructive. This migration supports existing report data.
    }
};
