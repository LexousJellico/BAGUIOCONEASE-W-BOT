<?php

use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Carbon;

it('persists payments and exposes them via booking resource', function () {
    // Arrange: authenticated user
    $user = User::factory()->create();
    test()->actingAs($user);
    test()->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

    // Arrange: a service and a booking
    $service = Service::factory()->create([
        'price' => 100,
    ]);

    $booking = Booking::create([
        'service_id' => $service->id,
        'company_name' => 'Acme Co',
        'client_name' => 'John Doe',
        'client_contact_number' => '123456789',
        'client_email' => 'john@example.com',
        'client_address' => '123 Street',
        'type_of_event' => 'Party',
        'booking_date_from' => now(),
        'booking_date_to' => now()->addDay(),
        'number_of_guests' => 10,
        'booking_status' => 'pending',
        'payment_status' => 'unpaid',
    ]);

    // Act: add a payment
    test()->withSession(['_token' => 'test-token']);
    $response = test()->post(route('bookings.payments.store', $booking), [
        '_token' => 'test-token',
        'status' => 'confirmed',
        'payment_method' => 'cash',
        'amount' => 150.50,
        'transaction_reference' => 'TEST-REF-'.uniqid(),
        'payment_gateway' => null,
        'remarks' => 'Deposit',
    ]);

    // Assert redirect back
    $response->assertStatus(302);

    // Assert DB row persisted
    test()->assertDatabaseHas('booking_payments', [
        'booking_id' => $booking->id,
        'payment_method' => 'cash',
        'status' => 'confirmed',
        // Note: decimals are stored as string in many drivers
        'amount' => 150.50,
    ]);

    // Assert resource includes payments and totals
    $fresh = $booking->fresh()->load(['payments', 'bookingServices', 'service']);
    $asArray = (new BookingResource($fresh))->resolve(request());

    expect($asArray['payments'])
        ->toBeArray()
        ->and(count($asArray['payments']))->toBeGreaterThanOrEqual(1);

    // Find our payment in resource
    $found = collect($asArray['payments'])->firstWhere('status', 'confirmed');
    expect($found)->not->toBeNull();

    // Totals include payments_total >= amount we just added
    expect(is_numeric($asArray['totals']['payments_total']))->toBeTrue();
    expect((float) $asArray['totals']['payments_total'])->toBeGreaterThanOrEqual(150.50);
});

it('updates a payment and reflects changes in resource', function () {
    // Arrange: authenticated user
    $user = \App\Models\User::factory()->create();
    test()->actingAs($user);
    test()->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

    // Arrange: a service and a booking
    $service = \App\Models\Service::factory()->create([
        'price' => 200,
    ]);

    $booking = \App\Models\Booking::create([
        'service_id' => $service->id,
        'company_name' => 'Widgets Inc',
        'client_name' => 'Jane Roe',
        'client_contact_number' => '987654321',
        'client_email' => 'jane@example.com',
        'client_address' => '456 Avenue',
        'type_of_event' => 'Conference',
        'booking_date_from' => now(),
        'booking_date_to' => now()->addDay(),
        'number_of_guests' => 50,
        'booking_status' => 'pending',
        'payment_status' => 'unpaid',
    ]);

    // Create a payment directly associated to booking
    $payment = $booking->payments()->create([
        'status' => 'pending',
        'payment_method' => 'cash',
        'amount' => 100.00,
        'transaction_reference' => 'ORIG-REF-'.uniqid(),
        'remarks' => 'Initial',
    ]);

    // Act: update the payment via route
    test()->withSession(['_token' => 'test-token']);
    $response = test()->put(route('bookings.payments.update', [$booking, $payment]), [
        '_token' => 'test-token',
        'status' => 'confirmed',
        'payment_method' => 'gcash',
        'amount' => 250.75,
        'transaction_reference' => 'EDIT-REF-'.uniqid(),
        'remarks' => 'Updated',
    ]);

    // Assert redirect back
    $response->assertStatus(302);

    // Assert DB updated
    test()->assertDatabaseHas('booking_payments', [
        'id' => $payment->id,
        'booking_id' => $booking->id,
        'payment_method' => 'gcash',
        'status' => 'confirmed',
        'amount' => 250.75,
        // can't assert exact reference due to uniqid; just ensure updated status/method/amount
    ]);

    // Assert resource reflects updated values
    $fresh = $booking->fresh()->load(['payments', 'bookingServices', 'service']);
    $asArray = (new \App\Http\Resources\BookingResource($fresh))->resolve(request());

    $found = collect($asArray['payments'])->firstWhere('id', $payment->id);
    expect($found)->not->toBeNull();
    expect($found['payment_method'])->toBe('gcash');
    expect($found['status'])->toBe('confirmed');
    expect((float) $found['amount'])->toBe(250.75);
    expect(isset($found['transaction_reference']))->toBeTrue();
});
