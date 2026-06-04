<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('id');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->nullable()->after('middle_name');

            $table->string('phone_number', 20)->nullable()->unique()->after('email');
            $table->string('organization_name')->nullable()->after('phone_number');
            $table->string('organization_type')->nullable()->after('organization_name');
            $table->string('position_title')->nullable()->after('organization_type');

            $table->string('address_line1')->nullable()->after('position_title');
            $table->string('barangay')->nullable()->after('address_line1');
            $table->string('city_municipality')->nullable()->after('barangay');
            $table->string('province')->nullable()->after('city_municipality');
            $table->string('postal_code', 20)->nullable()->after('province');
            $table->string('country')->nullable()->after('postal_code');

            $table->string('google_id')->nullable()->unique()->after('remember_token');
            $table->string('google_avatar')->nullable()->after('google_id');
            $table->timestamp('last_login_at')->nullable()->after('google_avatar');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'middle_name',
                'last_name',
                'phone_number',
                'organization_name',
                'organization_type',
                'position_title',
                'address_line1',
                'barangay',
                'city_municipality',
                'province',
                'postal_code',
                'country',
                'google_id',
                'google_avatar',
                'last_login_at',
            ]);
        });
    }
};
