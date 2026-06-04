<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            if (! Schema::hasColumn('user_notifications', 'actor_user_id')) {
                $table->foreignId('actor_user_id')
                    ->nullable()
                    ->after('user_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('user_notifications', 'subject_type')) {
                $table->string('subject_type', 120)->nullable()->after('actor_user_id')->index();
            }

            if (! Schema::hasColumn('user_notifications', 'subject_id')) {
                $table->unsignedBigInteger('subject_id')->nullable()->after('subject_type')->index();
            }

            if (! Schema::hasColumn('user_notifications', 'action_key')) {
                $table->string('action_key', 120)->nullable()->after('type')->index();
            }

            if (! Schema::hasColumn('user_notifications', 'severity')) {
                $table->string('severity', 30)->default('info')->after('action_key')->index();
            }

            if (! Schema::hasColumn('user_notifications', 'audience')) {
                $table->string('audience', 30)->default('user')->after('severity')->index();
            }

            if (! Schema::hasColumn('user_notifications', 'privacy_scope')) {
                $table->string('privacy_scope', 30)->default('private')->after('audience')->index();
            }

            if (! Schema::hasColumn('user_notifications', 'data')) {
                $table->json('data')->nullable()->after('link');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            foreach (['data', 'privacy_scope', 'audience', 'severity', 'action_key', 'subject_id', 'subject_type'] as $column) {
                if (Schema::hasColumn('user_notifications', $column)) {
                    $table->dropColumn($column);
                }
            }

            if (Schema::hasColumn('user_notifications', 'actor_user_id')) {
                $table->dropConstrainedForeignId('actor_user_id');
            }
        });
    }
};
