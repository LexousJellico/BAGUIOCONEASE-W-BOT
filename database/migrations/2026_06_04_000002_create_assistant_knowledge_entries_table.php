<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assistant_knowledge_entries', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->text('question')->nullable();
            $table->longText('answer');
            $table->string('category', 80)->default('general')->index();
            $table->json('keywords')->nullable();
            $table->string('visibility', 24)->default('public')->index(); // public, client, backend, private
            $table->string('source_type', 40)->default('manual')->index(); // manual, seeded, system, admin_reviewed, user_suggested
            $table->string('source_reference')->nullable();
            $table->unsignedTinyInteger('confidence')->default(80)->index();
            $table->unsignedInteger('hits')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'visibility', 'category']);
        });

        $now = now();
        DB::table('assistant_knowledge_entries')->insert([
            [
                'title' => 'Complete client booking flow',
                'question' => 'How do clients book an event in BCCC EASE?',
                'answer' => 'Open Book Event, select the event date range and time blocks, check calendar availability, choose venue areas/rentals/packages/add-ons, fill in contact and organization details, fill event details, review the service computation, confirm public calendar title visibility, submit the booking request, then monitor My Bookings and Notifications for review, approval, payment, MICE, deadline, and final computation updates.',
                'category' => 'booking_flow',
                'keywords' => json_encode(['book', 'booking', 'event', 'reserve', 'calendar', 'submit', 'client', 'flow']),
                'visibility' => 'public',
                'source_type' => 'seeded',
                'source_reference' => 'BCCC EASE system workflow',
                'confidence' => 92,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Availability truth rule',
                'question' => 'Can the bot confirm if a date is available?',
                'answer' => 'The assistant may explain availability only from the calendar/availability facts returned by BCCC EASE. It must not invent available dates. If the date can proceed, the client may continue the form, but final approval still depends on BCCC staff review and the official booking record.',
                'category' => 'availability',
                'keywords' => json_encode(['availability', 'available', 'date', 'calendar', 'blocked', 'reserved', 'approved']),
                'visibility' => 'public',
                'source_type' => 'seeded',
                'source_reference' => 'Assistant safety rule',
                'confidence' => 95,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Payment, bond, and final computation guidance',
                'question' => 'What should clients know about payments, bonds, balance, and final computation?',
                'answer' => 'Clients should wait for the official payable amount or payment instruction in their booking record, upload clear payment proof under the matching booking, and monitor notices for down payment, full payment, remaining balance, bond, proof review, and due dates. Bond may be included in total payable computation. Payments and final computation are official only when reviewed/updated in BCCC EASE.',
                'category' => 'payments',
                'keywords' => json_encode(['payment', 'bond', 'balance', 'downpayment', 'down payment', 'paid', 'proof', 'final computation']),
                'visibility' => 'public',
                'source_type' => 'seeded',
                'source_reference' => 'BCCC EASE payment workflow',
                'confidence' => 90,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Client notification center guide',
                'question' => 'What are BCCC EASE notifications for?',
                'answer' => 'Notifications tell clients about booking submission, review, approval, rejection, cancellation, schedule updates, missing requirements, payment proof review, payment deadlines, MICE reminders, final computation, new login device alerts, and system announcements. Clients should open Notifications and My Bookings for official details.',
                'category' => 'notifications',
                'keywords' => json_encode(['notification', 'notice', 'alert', 'announcement', 'payment', 'approval', 'device', 'login']),
                'visibility' => 'client',
                'source_type' => 'seeded',
                'source_reference' => 'BCCC EASE notification workflow',
                'confidence' => 88,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Account security and device management',
                'question' => 'How do 2FA, remember me, and logged-in devices work?',
                'answer' => 'Two-Factor Authentication adds a fresh verification step during login. Remember Me keeps the user signed in after successful verification when allowed by the browser/session. Account Preferences shows logged-in devices with browser/platform, IP/location label, remembered status, and allows users to remove devices they do not recognize.',
                'category' => 'account_security',
                'keywords' => json_encode(['2fa', 'two factor', 'remember me', 'device', 'login', 'security', 'account']),
                'visibility' => 'client',
                'source_type' => 'seeded',
                'source_reference' => 'BCCC EASE account preferences',
                'confidence' => 90,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Backend booking workspace guide',
                'question' => 'What can admin, manager, and staff users do in backend booking pages?',
                'answer' => 'Authorized backend users can review bookings, check availability, manage approval statuses, review payments, handle operations, manage calendar blocks, export/print reports, process MICE records, manage venue/rental setup, and check analytics according to their role permissions. The assistant should give workflow guidance without exposing secrets or unrelated private data.',
                'category' => 'backend_workflow',
                'keywords' => json_encode(['admin', 'manager', 'staff', 'backend', 'booking', 'payment review', 'calendar', 'analytics', 'reports']),
                'visibility' => 'backend',
                'source_type' => 'seeded',
                'source_reference' => 'BCCC EASE backend workflow',
                'confidence' => 86,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

    }
    public function down(): void
    {
        Schema::dropIfExists('assistant_knowledge_entries');
    }
};
