<?php

use App\Http\Controllers\AdminGuidelinesContactController;
use App\Http\Controllers\AdminInquiryController;
use App\Http\Controllers\AdminPublicContentController;
use App\Http\Controllers\AdminSortController;
use App\Http\Controllers\BookingAnalyticsController;
use App\Http\Controllers\BookingApprovalController;
use App\Http\Controllers\BookingAuditController;
use App\Http\Controllers\BookingAvailabilityController;
use App\Http\Controllers\BookingBillingController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\BookingDraftController;
use App\Http\Controllers\BookingOperationsController;
use App\Http\Controllers\BookingPrintableController;
use App\Http\Controllers\ClientAssistantController;
use App\Http\Controllers\CalendarAnalyticsController;
use App\Http\Controllers\CalendarBlockController;
use App\Http\Controllers\CalendarManagementController;
use App\Http\Controllers\MiceRegistryController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentReviewController;
use App\Http\Controllers\PublicAvailabilityController;
use App\Http\Controllers\PublicInquiryController;
use App\Http\Controllers\PublicSiteController;
use App\Http\Controllers\PublicSiteMetricController;
use App\Http\Controllers\RoleRedirectController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceTypeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\WorkspaceCalendarController;
use App\Http\Controllers\WorkspaceHomeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Marketing Routes
|--------------------------------------------------------------------------
*/

Route::post('/public/availability-check', [PublicAvailabilityController::class, 'check'])
    ->middleware('throttle:30,1')
    ->name('public.availability.check');

Route::get('/public/calendar-month', [PublicAvailabilityController::class, 'month'])
    ->name('public.calendar.month');

Route::get('/bookings/availability', BookingAvailabilityController::class)
    ->middleware('throttle:60,1')
    ->name('public.bookings.availability');

Route::post('/inquiries', [PublicInquiryController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('public.inquiries.store');

Route::post('/public/site-views', [PublicSiteMetricController::class, 'store'])
    ->middleware('throttle:20,1')
    ->name('public.site-views.store');

Route::get('/system-assistant/state', [ClientAssistantController::class, 'state'])
    ->middleware('throttle:60,1')
    ->name('system-assistant.state');

Route::put('/system-assistant/state', [ClientAssistantController::class, 'saveState'])
    ->middleware('throttle:60,1')
    ->name('system-assistant.state.save');

Route::delete('/system-assistant/state', [ClientAssistantController::class, 'clearState'])
    ->middleware('throttle:20,1')
    ->name('system-assistant.state.clear');

Route::post('/system-assistant/ask', [ClientAssistantController::class, 'ask'])
    ->middleware('throttle:30,1')
    ->name('system-assistant.ask');

Route::post('/client-assistant/ask', [ClientAssistantController::class, 'ask'])
    ->middleware('throttle:30,1')
    ->name('client-assistant.ask');

Route::post('/system-assistant/booking-draft', [ClientAssistantController::class, 'bookingDraft'])
    ->middleware('throttle:12,1')
    ->name('system-assistant.booking-draft');

Route::post('/system-assistant/feedback', [ClientAssistantController::class, 'feedback'])
    ->middleware('throttle:20,1')
    ->name('system-assistant.feedback');

Route::get('/', [PublicSiteController::class, 'home'])
    ->name('home');

Route::get('/facilities', [PublicSiteController::class, 'facilities'])
    ->name('public.facilities');

Route::get('/facilities/{slug}', [PublicSiteController::class, 'facilityShow'])
    ->where('slug', '[A-Za-z0-9\-]+')
    ->name('public.facilities.show');

Route::get('/events', [PublicSiteController::class, 'events'])
    ->name('public.events');

Route::get('/calendar', [PublicSiteController::class, 'calendar'])
    ->name('public.calendar');

Route::get('/virtual-tour', [PublicSiteController::class, 'virtualTour'])
    ->name('public.virtual-tour');

Route::get('/convention-layout', [PublicSiteController::class, 'conventionLayout'])
    ->name('public.convention-layout');

Route::get('/tourism-office', [PublicSiteController::class, 'tourismOffice'])
    ->name('public.tourism-office');

Route::get('/contact', [PublicSiteController::class, 'contact'])
    ->name('public.contact');

Route::get('/guidelines', [PublicSiteController::class, 'guidelines'])
    ->name('guidelines');

Route::get('/faqs', [PublicSiteController::class, 'faqs'])
    ->name('public.faqs');

/*
|--------------------------------------------------------------------------
| Dedicated Role Entries
|--------------------------------------------------------------------------
*/

Route::get('/admin', function (Request $request) {
    if ($request->user()) {
        return redirect()->route('role.home');
    }

    return Inertia::render('admin/login');
})->name('admin.login');

Route::get('/manager', function (Request $request) {
    if ($request->user()) {
        return redirect()->route('role.home');
    }

    return redirect()->route('login', ['redirect_to' => '/manager/dashboard']);
})->name('manager.login');

Route::get('/staff', function (Request $request) {
    if ($request->user()) {
        return redirect()->route('role.home');
    }

    return redirect()->route('login', ['redirect_to' => '/staff/dashboard']);
})->name('staff.login');

/*
|--------------------------------------------------------------------------
| Authenticated Role Redirects
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/home', RoleRedirectController::class)
        ->name('role.home');

    Route::get('/dashboard', RoleRedirectController::class)
        ->name('dashboard');

    Route::get('/booking-drafts/latest', [BookingDraftController::class, 'latest'])
        ->name('booking-drafts.latest');

    Route::post('/booking-drafts', [BookingDraftController::class, 'store'])
        ->middleware('throttle:60,1')
        ->name('booking-drafts.store');

    Route::delete('/booking-drafts', [BookingDraftController::class, 'destroyCurrent'])
        ->name('booking-drafts.destroy-current');

    Route::get('/booking-drafts/{bookingDraft}', [BookingDraftController::class, 'show'])
        ->whereNumber('bookingDraft')
        ->name('booking-drafts.show');

    Route::delete('/booking-drafts/{bookingDraft}', [BookingDraftController::class, 'destroy'])
        ->whereNumber('bookingDraft')
        ->name('booking-drafts.destroy');
});

/*
|--------------------------------------------------------------------------
| Admin Workspace
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [WorkspaceHomeController::class, 'index'])
            ->name('dashboard');

        Route::redirect('/analytics', '/admin/bookings/analytics')
            ->name('analytics');

        Route::get('/content', [AdminPublicContentController::class, 'index'])
            ->name('content');

        Route::get('/content/data', [AdminPublicContentController::class, 'contentData'])
            ->name('content.data');

        Route::redirect('/home', '/admin/content')
            ->name('home');

        Route::get('/calendar', WorkspaceCalendarController::class)
            ->name('calendar');

        Route::get('/calendar/manage', [CalendarManagementController::class, 'index'])
            ->name('calendar.manage');

        Route::get('/calendar/analytics', [CalendarAnalyticsController::class, 'index'])
            ->name('calendar.analytics');

        Route::get('/calendar/analytics/export', [CalendarAnalyticsController::class, 'export'])
            ->name('calendar.analytics.export');

        Route::get('/calendar/analytics/print', [CalendarAnalyticsController::class, 'print'])
            ->name('calendar.analytics.print');

        Route::post('/calendar-blocks', [CalendarBlockController::class, 'store'])
            ->name('calendar-blocks.store');

        Route::post('/calendar-blocks/bulk', [CalendarBlockController::class, 'bulkStore'])
            ->name('calendar-blocks.bulk-store');

        Route::put('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'update'])
            ->whereNumber('calendarBlock')
            ->name('calendar-blocks.update');

        Route::delete('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'destroy'])
            ->whereNumber('calendarBlock')
            ->name('calendar-blocks.destroy');

        Route::get('/bookings/availability', [BookingController::class, 'availability'])
            ->name('bookings.availability');

        Route::get('/bookings/analytics', [BookingAnalyticsController::class, 'index'])
            ->name('bookings.analytics');

        Route::get('/bookings/analytics/export', [BookingAnalyticsController::class, 'export'])
            ->name('bookings.analytics.export');

        Route::get('/bookings/analytics/print', [BookingAnalyticsController::class, 'print'])
            ->name('bookings.analytics.print');

        Route::get('/bookings/operations', [BookingOperationsController::class, 'index'])
            ->name('bookings.operations');

        Route::post('/bookings/operations/payments/{payment}/approve', [BookingOperationsController::class, 'approvePayment'])
            ->whereNumber('payment')
            ->name('bookings.operations.payments.approve');

        Route::post('/bookings/operations/payments/{payment}/decline', [BookingOperationsController::class, 'declinePayment'])
            ->whereNumber('payment')
            ->name('bookings.operations.payments.decline');

        Route::post('/bookings/operations/payments/{payment}/fail', [BookingOperationsController::class, 'failPayment'])
            ->whereNumber('payment')
            ->name('bookings.operations.payments.fail');

        Route::prefix('/bookings/audit')
            ->name('bookings.audit.')
            ->group(function () {
                Route::get('/', [BookingAuditController::class, 'index'])
                    ->name('index');

                Route::get('/export', [BookingAuditController::class, 'export'])
                    ->name('export');

                Route::get('/print', [BookingAuditController::class, 'printReport'])
                    ->name('print');
            });

        Route::post('/bookings/{booking}/approval/for-review', [BookingApprovalController::class, 'forReview'])
            ->whereNumber('booking')
            ->name('bookings.approval.for-review');

        Route::post('/bookings/{booking}/approval/pencil-book', [BookingApprovalController::class, 'pencilBook'])
            ->whereNumber('booking')
            ->name('bookings.approval.pencil-book');

        Route::post('/bookings/{booking}/approval/confirm', [BookingApprovalController::class, 'confirm'])
            ->whereNumber('booking')
            ->name('bookings.approval.confirm');

        Route::post('/bookings/{booking}/approval/decline', [BookingApprovalController::class, 'decline'])
            ->whereNumber('booking')
            ->name('bookings.approval.decline');

        Route::post('/bookings/{booking}/approval/cancel', [BookingApprovalController::class, 'cancel'])
            ->whereNumber('booking')
            ->name('bookings.approval.cancel');

        Route::post('/bookings/{booking}/approval/complete', [BookingApprovalController::class, 'complete'])
            ->whereNumber('booking')
            ->name('bookings.approval.complete');

        Route::put('/bookings/{booking}/billing', [BookingBillingController::class, 'update'])
            ->whereNumber('booking')
            ->name('bookings.billing.update');

        Route::post('/bookings/{booking}/post-event-charges', [BookingBillingController::class, 'storePostEventCharge'])
            ->whereNumber('booking')
            ->name('bookings.post-event-charges.store');

        Route::put('/bookings/{booking}/post-event-charges/{bookingPostEventCharge}', [BookingBillingController::class, 'updatePostEventCharge'])
            ->whereNumber(['booking', 'bookingPostEventCharge'])
            ->name('bookings.post-event-charges.update');

        Route::delete('/bookings/{booking}/post-event-charges/{bookingPostEventCharge}', [BookingBillingController::class, 'destroyPostEventCharge'])
            ->whereNumber(['booking', 'bookingPostEventCharge'])
            ->name('bookings.post-event-charges.destroy');

        Route::get('/bookings/{booking}/print/reservation', [BookingPrintableController::class, 'reservation'])
            ->whereNumber('booking')
            ->name('bookings.print.reservation');

        Route::get('/bookings/{booking}/print/final-bill', [BookingPrintableController::class, 'finalBill'])
            ->whereNumber('booking')
            ->name('bookings.print.final-bill');

        Route::get('/bookings/{booking}/print/cancellation', [BookingPrintableController::class, 'cancellation'])
            ->whereNumber('booking')
            ->name('bookings.print.cancellation');

        Route::get('/bookings/{booking}/print/mice-summary', [BookingPrintableController::class, 'miceSummary'])
            ->whereNumber('booking')
            ->name('bookings.print.mice-summary');

        Route::get('/bookings/{booking}/export/{document}', [BookingPrintableController::class, 'export'])
            ->whereNumber('booking')
            ->where('document', 'reservation|reservation-summary|final-bill|cancellation|mice-summary')
            ->name('bookings.export');

        Route::get('/bookings/{booking}/survey', [BookingController::class, 'survey'])
            ->whereNumber('booking')
            ->name('bookings.survey');

        Route::post('/bookings/{booking}/survey', [BookingController::class, 'storeSurvey'])
            ->whereNumber('booking')
            ->name('bookings.survey.store');

        Route::get('/bookings/{booking}/survey-proof-image', [BookingController::class, 'surveyProofImage'])
            ->whereNumber('booking')
            ->name('bookings.survey-proof-image');

        Route::post('/bookings/{booking}/payments', [BookingController::class, 'storePayment'])
            ->whereNumber('booking')
            ->name('bookings.payments.store');

        Route::put('/bookings/{booking}/payments/{payment}', [BookingController::class, 'updatePayment'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.update');

        Route::get('/bookings/{booking}/payments/{payment}/proof', [BookingController::class, 'paymentProofImage'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.proof');

        Route::resource('/bookings', BookingController::class)
            ->where(['booking' => '[0-9]+']);

        /*
        |--------------------------------------------------------------------------
        | Admin Payment Review
        |--------------------------------------------------------------------------
        */

        Route::get('/payments/review', [PaymentReviewController::class, 'index'])
            ->name('payments.review');

        Route::put('/payments/review/{payment}', [PaymentReviewController::class, 'update'])
            ->whereNumber('payment')
            ->name('payments.review.update');

        Route::post('/payments/review/{payment}/approve', [PaymentReviewController::class, 'approve'])
            ->whereNumber('payment')
            ->name('payments.review.approve');

        Route::post('/payments/review/{payment}/reject', [PaymentReviewController::class, 'reject'])
            ->whereNumber('payment')
            ->name('payments.review.reject');

        /*
        |--------------------------------------------------------------------------
        | Admin MICE Registry
        |--------------------------------------------------------------------------
        */

        Route::get('/reports/mice-registry', [MiceRegistryController::class, 'index'])
            ->name('reports.mice-registry');

        Route::get('/reports/mice-registry/create', [MiceRegistryController::class, 'create'])
            ->name('reports.mice-registry.create');

        Route::post('/reports/mice-registry', [MiceRegistryController::class, 'store'])
            ->name('reports.mice-registry.store');

        Route::get('/reports/mice-registry/print', [MiceRegistryController::class, 'print'])
            ->name('reports.mice-registry.print');

        Route::get('/reports/mice-registry/export', [MiceRegistryController::class, 'export'])
            ->name('reports.mice-registry.export');

        Route::get('/reports/mice-registry/{miceRecord}/edit', [MiceRegistryController::class, 'edit'])
            ->whereNumber('miceRecord')
            ->name('reports.mice-registry.edit');

        Route::put('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'update'])
            ->whereNumber('miceRecord')
            ->name('reports.mice-registry.update');

        Route::delete('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'destroy'])
            ->whereNumber('miceRecord')
            ->name('reports.mice-registry.destroy');

        /*
        |--------------------------------------------------------------------------
        | Admin Setup Resources
        |--------------------------------------------------------------------------
        */

        Route::resource('/venue-areas', ServiceTypeController::class)
            ->parameters(['venue-areas' => 'serviceType'])
            ->where(['serviceType' => '[0-9]+']);

        Route::resource('/rental-options', ServiceController::class)
            ->parameters(['rental-options' => 'service'])
            ->where(['service' => '[0-9]+']);

        Route::get('/users/roles', [UserRoleController::class, 'index'])
            ->name('users.roles');

        Route::put('/users/{user}/roles', [UserRoleController::class, 'update'])
            ->whereNumber('user')
            ->name('users.roles.update');

        Route::post('/users/{user}/verify-email', [UserController::class, 'verifyEmail'])
            ->whereNumber('user')
            ->name('users.verify-email');

        Route::resource('/users', UserController::class)
            ->where(['user' => '[0-9]+']);

        /*
        |--------------------------------------------------------------------------
        | Admin Inquiries + Guidelines
        |--------------------------------------------------------------------------
        */

        Route::get('/inquiries', [AdminInquiryController::class, 'index'])
            ->name('inquiries.index');

        Route::put('/inquiries/{inquiry}', [AdminInquiryController::class, 'update'])
            ->whereNumber('inquiry')
            ->name('inquiries.update');

        Route::delete('/inquiries/{inquiry}', [AdminInquiryController::class, 'destroy'])
            ->whereNumber('inquiry')
            ->name('inquiries.destroy');

        Route::get('/guidelines-contacts', [AdminGuidelinesContactController::class, 'index'])
            ->name('guidelines-contacts');

        Route::post('/guidelines-contacts', [AdminGuidelinesContactController::class, 'update'])
            ->name('guidelines-contacts.update');

        /*
        |--------------------------------------------------------------------------
        | Admin Public Content Sorting + CRUD
        |--------------------------------------------------------------------------
        */

        Route::prefix('sort')
            ->name('sort.')
            ->group(function () {
                Route::post('/events', [AdminSortController::class, 'events'])
                    ->name('events');

                Route::post('/packages', [AdminSortController::class, 'packages'])
                    ->name('packages');

                Route::post('/spaces', [AdminSortController::class, 'spaces'])
                    ->name('spaces');

                Route::post('/stats', [AdminSortController::class, 'stats'])
                    ->name('stats');
            });

        Route::post('/tourism-members', [AdminPublicContentController::class, 'storeTourismMember'])
            ->name('tourism-members.store');

        Route::put('/tourism-members/{tourismMember}', [AdminPublicContentController::class, 'updateTourismMember'])
            ->whereNumber('tourismMember')
            ->name('tourism-members.update');

        Route::delete('/tourism-members/{tourismMember}', [AdminPublicContentController::class, 'destroyTourismMember'])
            ->whereNumber('tourismMember')
            ->name('tourism-members.destroy');

        Route::post('/events', [AdminPublicContentController::class, 'storeEvent'])
            ->name('events.store');

        Route::put('/events/{publicEvent}', [AdminPublicContentController::class, 'updateEvent'])
            ->whereNumber('publicEvent')
            ->name('events.update');

        Route::delete('/events/{publicEvent}', [AdminPublicContentController::class, 'destroyEvent'])
            ->whereNumber('publicEvent')
            ->name('events.destroy');

        Route::post('/packages', [AdminPublicContentController::class, 'storePackage'])
            ->name('packages.store');

        Route::put('/packages/{featurePackage}', [AdminPublicContentController::class, 'updatePackage'])
            ->whereNumber('featurePackage')
            ->name('packages.update');

        Route::delete('/packages/{featurePackage}', [AdminPublicContentController::class, 'destroyPackage'])
            ->whereNumber('featurePackage')
            ->name('packages.destroy');

        Route::post('/spaces', [AdminPublicContentController::class, 'storeSpace'])
            ->name('spaces.store');

        Route::put('/spaces/{venueSpace}', [AdminPublicContentController::class, 'updateSpace'])
            ->whereNumber('venueSpace')
            ->name('spaces.update');

        Route::delete('/spaces/{venueSpace}', [AdminPublicContentController::class, 'destroySpace'])
            ->whereNumber('venueSpace')
            ->name('spaces.destroy');

        Route::post('/stats', [AdminPublicContentController::class, 'storeStat'])
            ->name('stats.store');

        Route::put('/stats/{homepageStat}', [AdminPublicContentController::class, 'updateStat'])
            ->whereNumber('homepageStat')
            ->name('stats.update');

        Route::delete('/stats/{homepageStat}', [AdminPublicContentController::class, 'destroyStat'])
            ->whereNumber('homepageStat')
            ->name('stats.destroy');

        Route::put('/site-settings', [AdminPublicContentController::class, 'updateSiteSettings'])
            ->name('site-settings.update');
    });

/*
|--------------------------------------------------------------------------
| Manager Workspace
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:manager'])
    ->prefix('manager')
    ->name('manager.')
    ->group(function () {
        Route::get('/dashboard', [WorkspaceHomeController::class, 'index'])
            ->name('dashboard');

        Route::get('/calendar', WorkspaceCalendarController::class)
            ->name('calendar');

        Route::get('/content', [AdminPublicContentController::class, 'index'])
            ->name('content');

        Route::get('/content/data', [AdminPublicContentController::class, 'contentData'])
            ->name('content.data');

        Route::get('/calendar/manage', [CalendarManagementController::class, 'index'])
            ->name('calendar.manage');

        Route::post('/calendar-blocks', [CalendarBlockController::class, 'store'])
            ->name('calendar-blocks.store');

        Route::post('/calendar-blocks/bulk', [CalendarBlockController::class, 'bulkStore'])
            ->name('calendar-blocks.bulk-store');

        Route::put('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'update'])
            ->whereNumber('calendarBlock')
            ->name('calendar-blocks.update');

        Route::delete('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'destroy'])
            ->whereNumber('calendarBlock')
            ->name('calendar-blocks.destroy');

        Route::get('/calendar/analytics', [CalendarAnalyticsController::class, 'index'])
            ->name('calendar.analytics');

        Route::get('/calendar/analytics/export', [CalendarAnalyticsController::class, 'export'])
            ->name('calendar.analytics.export');

        Route::get('/calendar/analytics/print', [CalendarAnalyticsController::class, 'print'])
            ->name('calendar.analytics.print');

        Route::get('/bookings/availability', [BookingController::class, 'availability'])
            ->name('bookings.availability');

        Route::get('/bookings/analytics', [BookingAnalyticsController::class, 'index'])
            ->name('bookings.analytics');

        Route::get('/bookings/analytics/export', [BookingAnalyticsController::class, 'export'])
            ->name('bookings.analytics.export');

        Route::get('/bookings/analytics/print', [BookingAnalyticsController::class, 'print'])
            ->name('bookings.analytics.print');

        Route::get('/bookings/operations', [BookingOperationsController::class, 'index'])
            ->name('bookings.operations');

        Route::prefix('/bookings/audit')
            ->name('bookings.audit.')
            ->group(function () {
                Route::get('/', [BookingAuditController::class, 'index'])
                    ->name('index');

                Route::get('/export', [BookingAuditController::class, 'export'])
                    ->name('export');

                Route::get('/print', [BookingAuditController::class, 'printReport'])
                    ->name('print');
            });

        Route::post('/bookings/{booking}/approval/for-review', [BookingApprovalController::class, 'forReview'])
            ->whereNumber('booking')
            ->name('bookings.approval.for-review');

        Route::post('/bookings/{booking}/approval/pencil-book', [BookingApprovalController::class, 'pencilBook'])
            ->whereNumber('booking')
            ->name('bookings.approval.pencil-book');

        Route::post('/bookings/{booking}/approval/confirm', [BookingApprovalController::class, 'confirm'])
            ->whereNumber('booking')
            ->name('bookings.approval.confirm');

        Route::post('/bookings/{booking}/approval/decline', [BookingApprovalController::class, 'decline'])
            ->whereNumber('booking')
            ->name('bookings.approval.decline');

        Route::post('/bookings/{booking}/approval/cancel', [BookingApprovalController::class, 'cancel'])
            ->whereNumber('booking')
            ->name('bookings.approval.cancel');

        Route::post('/bookings/{booking}/approval/complete', [BookingApprovalController::class, 'complete'])
            ->whereNumber('booking')
            ->name('bookings.approval.complete');

        Route::put('/bookings/{booking}/billing', [BookingBillingController::class, 'update'])
            ->whereNumber('booking')
            ->name('bookings.billing.update');

        Route::post('/bookings/{booking}/post-event-charges', [BookingBillingController::class, 'storePostEventCharge'])
            ->whereNumber('booking')
            ->name('bookings.post-event-charges.store');

        Route::put('/bookings/{booking}/post-event-charges/{bookingPostEventCharge}', [BookingBillingController::class, 'updatePostEventCharge'])
            ->whereNumber(['booking', 'bookingPostEventCharge'])
            ->name('bookings.post-event-charges.update');

        Route::delete('/bookings/{booking}/post-event-charges/{bookingPostEventCharge}', [BookingBillingController::class, 'destroyPostEventCharge'])
            ->whereNumber(['booking', 'bookingPostEventCharge'])
            ->name('bookings.post-event-charges.destroy');

        Route::get('/bookings/{booking}/print/reservation', [BookingPrintableController::class, 'reservation'])
            ->whereNumber('booking')
            ->name('bookings.print.reservation');

        Route::get('/bookings/{booking}/print/final-bill', [BookingPrintableController::class, 'finalBill'])
            ->whereNumber('booking')
            ->name('bookings.print.final-bill');

        Route::get('/bookings/{booking}/print/cancellation', [BookingPrintableController::class, 'cancellation'])
            ->whereNumber('booking')
            ->name('bookings.print.cancellation');

        Route::get('/bookings/{booking}/print/mice-summary', [BookingPrintableController::class, 'miceSummary'])
            ->whereNumber('booking')
            ->name('bookings.print.mice-summary');

        Route::get('/bookings/{booking}/export/{document}', [BookingPrintableController::class, 'export'])
            ->whereNumber('booking')
            ->where('document', 'reservation|reservation-summary|final-bill|cancellation|mice-summary')
            ->name('bookings.export');

        Route::get('/bookings/{booking}/survey', [BookingController::class, 'survey'])
            ->whereNumber('booking')
            ->name('bookings.survey');

        Route::post('/bookings/{booking}/survey', [BookingController::class, 'storeSurvey'])
            ->whereNumber('booking')
            ->name('bookings.survey.store');

        Route::get('/bookings/{booking}/survey-proof-image', [BookingController::class, 'surveyProofImage'])
            ->whereNumber('booking')
            ->name('bookings.survey-proof-image');

        Route::post('/bookings/{booking}/payments', [BookingController::class, 'storePayment'])
            ->whereNumber('booking')
            ->name('bookings.payments.store');

        Route::put('/bookings/{booking}/payments/{payment}', [BookingController::class, 'updatePayment'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.update');

        Route::get('/bookings/{booking}/payments/{payment}/proof', [BookingController::class, 'paymentProofImage'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.proof');

        Route::resource('/bookings', BookingController::class)
            ->only(['index', 'show', 'edit', 'update'])
            ->where(['booking' => '[0-9]+']);

        /*
        |--------------------------------------------------------------------------
        | Manager Payment Review
        |--------------------------------------------------------------------------
        */

        Route::get('/payments/review', [PaymentReviewController::class, 'index'])
            ->name('payments.review');

        Route::put('/payments/review/{payment}', [PaymentReviewController::class, 'update'])
            ->whereNumber('payment')
            ->name('payments.review.update');

        Route::post('/payments/review/{payment}/approve', [PaymentReviewController::class, 'approve'])
            ->whereNumber('payment')
            ->name('payments.review.approve');

        Route::post('/payments/review/{payment}/reject', [PaymentReviewController::class, 'reject'])
            ->whereNumber('payment')
            ->name('payments.review.reject');

        Route::get('/reports/mice-registry', [MiceRegistryController::class, 'index'])
            ->name('reports.mice-registry');

        Route::get('/reports/mice-registry/create', [MiceRegistryController::class, 'create'])
            ->name('reports.mice-registry.create');

        Route::post('/reports/mice-registry', [MiceRegistryController::class, 'store'])
            ->name('reports.mice-registry.store');

        Route::get('/reports/mice-registry/print', [MiceRegistryController::class, 'print'])
            ->name('reports.mice-registry.print');

        Route::get('/reports/mice-registry/export', [MiceRegistryController::class, 'export'])
            ->name('reports.mice-registry.export');

        Route::get('/reports/mice-registry/{miceRecord}/edit', [MiceRegistryController::class, 'edit'])
            ->whereNumber('miceRecord')
            ->name('reports.mice-registry.edit');

        Route::put('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'update'])
            ->whereNumber('miceRecord')
            ->name('reports.mice-registry.update');

        Route::delete('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'destroy'])
            ->whereNumber('miceRecord')
            ->name('reports.mice-registry.destroy');

        Route::get('/inquiries', [AdminInquiryController::class, 'index'])
            ->name('inquiries.index');

        Route::put('/inquiries/{inquiry}', [AdminInquiryController::class, 'update'])
            ->whereNumber('inquiry')
            ->name('inquiries.update');

        Route::delete('/inquiries/{inquiry}', [AdminInquiryController::class, 'destroy'])
            ->whereNumber('inquiry')
            ->name('inquiries.destroy');

        Route::get('/guidelines-contacts', [AdminGuidelinesContactController::class, 'index'])
            ->name('guidelines-contacts');

        Route::post('/guidelines-contacts', [AdminGuidelinesContactController::class, 'update'])
            ->name('guidelines-contacts.update');

        Route::post('/tourism-members', [AdminPublicContentController::class, 'storeTourismMember'])
            ->name('tourism-members.store');
        Route::put('/tourism-members/{tourismMember}', [AdminPublicContentController::class, 'updateTourismMember'])
            ->whereNumber('tourismMember')
            ->name('tourism-members.update');
        Route::delete('/tourism-members/{tourismMember}', [AdminPublicContentController::class, 'destroyTourismMember'])
            ->whereNumber('tourismMember')
            ->name('tourism-members.destroy');
        Route::post('/events', [AdminPublicContentController::class, 'storeEvent'])
            ->name('events.store');
        Route::put('/events/{publicEvent}', [AdminPublicContentController::class, 'updateEvent'])
            ->whereNumber('publicEvent')
            ->name('events.update');
        Route::delete('/events/{publicEvent}', [AdminPublicContentController::class, 'destroyEvent'])
            ->whereNumber('publicEvent')
            ->name('events.destroy');
        Route::post('/spaces', [AdminPublicContentController::class, 'storeSpace'])
            ->name('spaces.store');
        Route::put('/spaces/{venueSpace}', [AdminPublicContentController::class, 'updateSpace'])
            ->whereNumber('venueSpace')
            ->name('spaces.update');
        Route::delete('/spaces/{venueSpace}', [AdminPublicContentController::class, 'destroySpace'])
            ->whereNumber('venueSpace')
            ->name('spaces.destroy');
        Route::post('/stats', [AdminPublicContentController::class, 'storeStat'])
            ->name('stats.store');
        Route::put('/stats/{homepageStat}', [AdminPublicContentController::class, 'updateStat'])
            ->whereNumber('homepageStat')
            ->name('stats.update');
        Route::delete('/stats/{homepageStat}', [AdminPublicContentController::class, 'destroyStat'])
            ->whereNumber('homepageStat')
            ->name('stats.destroy');
        Route::put('/site-settings', [AdminPublicContentController::class, 'updateSiteSettings'])
            ->name('site-settings.update');
    });

/*
|--------------------------------------------------------------------------
| Staff Workspace
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:staff'])
    ->prefix('staff')
    ->name('staff.')
    ->group(function () {
        Route::get('/dashboard', [WorkspaceHomeController::class, 'index'])
            ->name('dashboard');

        Route::get('/calendar', WorkspaceCalendarController::class)
            ->name('calendar');

        Route::get('/bookings/availability', [BookingController::class, 'availability'])
            ->name('bookings.availability');

        Route::get('/bookings/{booking}/print/reservation', [BookingPrintableController::class, 'reservation'])
            ->whereNumber('booking')
            ->name('bookings.print.reservation');

        Route::get('/bookings/{booking}/print/final-bill', [BookingPrintableController::class, 'finalBill'])
            ->whereNumber('booking')
            ->name('bookings.print.final-bill');

        Route::get('/bookings/{booking}/print/cancellation', [BookingPrintableController::class, 'cancellation'])
            ->whereNumber('booking')
            ->name('bookings.print.cancellation');

        Route::get('/bookings/{booking}/print/mice-summary', [BookingPrintableController::class, 'miceSummary'])
            ->whereNumber('booking')
            ->name('bookings.print.mice-summary');

        Route::get('/bookings/{booking}/export/{document}', [BookingPrintableController::class, 'export'])
            ->whereNumber('booking')
            ->where('document', 'reservation|reservation-summary|final-bill|cancellation|mice-summary')
            ->name('bookings.export');

        Route::get('/bookings/{booking}/survey', [BookingController::class, 'survey'])
            ->whereNumber('booking')
            ->name('bookings.survey');

        Route::post('/bookings/{booking}/survey', [BookingController::class, 'storeSurvey'])
            ->whereNumber('booking')
            ->name('bookings.survey.store');

        Route::get('/bookings/{booking}/survey-proof-image', [BookingController::class, 'surveyProofImage'])
            ->whereNumber('booking')
            ->name('bookings.survey-proof-image');

        Route::post('/bookings/{booking}/payments', [BookingController::class, 'storePayment'])
            ->whereNumber('booking')
            ->name('bookings.payments.store');

        Route::put('/bookings/{booking}/payments/{payment}', [BookingController::class, 'updatePayment'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.update');

        Route::get('/bookings/{booking}/payments/{payment}/proof', [BookingController::class, 'paymentProofImage'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.proof');

        Route::resource('/bookings', BookingController::class)
            ->only(['index', 'create', 'store', 'show', 'edit', 'update'])
            ->where(['booking' => '[0-9]+']);

        Route::get('/inquiries', [AdminInquiryController::class, 'index'])
            ->name('inquiries.index');

        Route::put('/inquiries/{inquiry}', [AdminInquiryController::class, 'update'])
            ->whereNumber('inquiry')
            ->name('inquiries.update');

        Route::delete('/inquiries/{inquiry}', [AdminInquiryController::class, 'destroy'])
            ->whereNumber('inquiry')
            ->name('inquiries.destroy');

        Route::get('/guidelines-contacts', [AdminGuidelinesContactController::class, 'index'])
            ->name('guidelines-contacts');
    });

/*
|--------------------------------------------------------------------------
| Public User / Client Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/my-dashboard', [WorkspaceHomeController::class, 'index'])
        ->name('user.dashboard');

    Route::get('/my-calendar', WorkspaceCalendarController::class)
        ->name('user.calendar');

    Route::get('/book', [BookingController::class, 'create'])
        ->name('user.bookings.create');

    Route::post('/book', [BookingController::class, 'store'])
        ->name('user.bookings.store');

    Route::get('/my-bookings', [BookingController::class, 'index'])
        ->name('user.bookings.index');

    Route::get('/my-bookings/{booking}', [BookingController::class, 'show'])
        ->whereNumber('booking')
        ->name('user.bookings.show');

    Route::get('/my-bookings/{booking}/print/reservation', [BookingPrintableController::class, 'reservation'])
        ->whereNumber('booking')
        ->name('user.bookings.print.reservation');

    Route::get('/my-bookings/{booking}/print/final-bill', [BookingPrintableController::class, 'finalBill'])
        ->whereNumber('booking')
        ->name('user.bookings.print.final-bill');

    Route::get('/my-bookings/{booking}/print/cancellation', [BookingPrintableController::class, 'cancellation'])
        ->whereNumber('booking')
        ->name('user.bookings.print.cancellation');

    Route::get('/my-bookings/{booking}/print/mice-summary', [BookingPrintableController::class, 'miceSummary'])
        ->whereNumber('booking')
        ->name('user.bookings.print.mice-summary');

    Route::get('/my-bookings/{booking}/export/{document}', [BookingPrintableController::class, 'export'])
        ->whereNumber('booking')
        ->where('document', 'reservation|reservation-summary|final-bill|cancellation|mice-summary')
        ->name('user.bookings.export');

    Route::get('/my-bookings/{booking}/survey', [BookingController::class, 'survey'])
        ->whereNumber('booking')
        ->name('user.bookings.survey');

    Route::post('/my-bookings/{booking}/survey', [BookingController::class, 'storeSurvey'])
        ->whereNumber('booking')
        ->name('user.bookings.survey.store');

    Route::get('/my-bookings/{booking}/edit', [BookingController::class, 'edit'])
        ->whereNumber('booking')
        ->name('user.bookings.edit');

    Route::put('/my-bookings/{booking}', [BookingController::class, 'update'])
        ->whereNumber('booking')
        ->name('user.bookings.update');

    Route::get('/my-bookings/{booking}/survey-proof-image', [BookingController::class, 'surveyProofImage'])
        ->whereNumber('booking')
        ->name('user.bookings.survey-proof-image');

    Route::post('/my-bookings/{booking}/payments', [BookingController::class, 'storePayment'])
        ->whereNumber('booking')
        ->name('user.bookings.payments.store');

    Route::get('/my-bookings/{booking}/payments/{payment}/proof', [BookingController::class, 'paymentProofImage'])
        ->whereNumber(['booking', 'payment'])
        ->name('user.bookings.payments.proof');
});

/*
|--------------------------------------------------------------------------
| Notifications
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');

    Route::get('/notifications/summary', [NotificationController::class, 'summary'])
        ->name('notifications.summary');

    Route::get('/notifications/{notification}/open', [NotificationController::class, 'open'])
        ->whereNumber('notification')
        ->name('notifications.open');

    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('notifications.read-all');

    Route::delete('/notifications', [NotificationController::class, 'destroyMany'])
        ->name('notifications.destroy-many');

    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])
        ->whereNumber('notification')
        ->name('notifications.destroy');
});

/*
|--------------------------------------------------------------------------
| Legacy Compatibility Routes
|--------------------------------------------------------------------------
| Keep these only while older buttons/imports are still being cleaned.
| IMPORTANT: Do not create a legacy /calendar redirect here because /calendar
| belongs to the public website.
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/calendar/manage', [CalendarManagementController::class, 'index'])
        ->middleware('role:admin|manager')
        ->name('calendar.manage');

    Route::get('/calendar/analytics', [CalendarAnalyticsController::class, 'index'])
        ->middleware('role:admin|manager')
        ->name('calendar.analytics');

    Route::get('/calendar/analytics/export', [CalendarAnalyticsController::class, 'export'])
        ->middleware('role:admin|manager')
        ->name('calendar.analytics.export');

    Route::get('/calendar/analytics/print', [CalendarAnalyticsController::class, 'print'])
        ->middleware('role:admin|manager')
        ->name('calendar.analytics.print');

    Route::post('/calendar-blocks', [CalendarBlockController::class, 'store'])
        ->middleware('role:admin|manager')
        ->name('calendar-blocks.store');

    Route::post('/calendar-blocks/bulk', [CalendarBlockController::class, 'bulkStore'])
        ->middleware('role:admin|manager')
        ->name('calendar-blocks.bulk-store');

    Route::put('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'update'])
        ->middleware('role:admin|manager')
        ->whereNumber('calendarBlock')
        ->name('calendar-blocks.update');

    Route::delete('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'destroy'])
        ->middleware('role:admin|manager')
        ->whereNumber('calendarBlock')
        ->name('calendar-blocks.destroy');

    Route::get('/bookings/availability', [BookingController::class, 'availability'])
        ->middleware('permission:bookings.view')
        ->name('bookings.availability');

    Route::get('/bookings/analytics', [BookingAnalyticsController::class, 'index'])
        ->middleware('permission:bookings.view')
        ->name('bookings.analytics');

    Route::get('/bookings/analytics/export', [BookingAnalyticsController::class, 'export'])
        ->middleware('permission:bookings.view')
        ->name('bookings.analytics.export');

    Route::get('/bookings/analytics/print', [BookingAnalyticsController::class, 'print'])
        ->middleware('permission:bookings.view')
        ->name('bookings.analytics.print');

    Route::get('/bookings/operations', [BookingOperationsController::class, 'index'])
        ->middleware('permission:bookings.view')
        ->name('bookings.operations');

    Route::post('/bookings/operations/payments/{payment}/approve', [BookingOperationsController::class, 'approvePayment'])
        ->middleware('permission:payments.manage')
        ->whereNumber('payment')
        ->name('bookings.operations.payments.approve');

    Route::post('/bookings/operations/payments/{payment}/decline', [BookingOperationsController::class, 'declinePayment'])
        ->middleware('permission:payments.manage')
        ->whereNumber('payment')
        ->name('bookings.operations.payments.decline');

    Route::post('/bookings/operations/payments/{payment}/fail', [BookingOperationsController::class, 'failPayment'])
        ->middleware('permission:payments.manage')
        ->whereNumber('payment')
        ->name('bookings.operations.payments.fail');

    Route::prefix('/bookings/audit')
        ->middleware('role:admin|manager')
        ->name('bookings.audit.')
        ->group(function () {
            Route::get('/', [BookingAuditController::class, 'index'])
                ->name('index');

            Route::get('/export', [BookingAuditController::class, 'export'])
                ->name('export');

            Route::get('/print', [BookingAuditController::class, 'printReport'])
                ->name('print');
        });

    Route::post('/bookings/{booking}/approval/for-review', [BookingApprovalController::class, 'forReview'])
        ->middleware('role:admin|manager')
        ->whereNumber('booking')
        ->name('bookings.approval.for-review');

    Route::post('/bookings/{booking}/approval/pencil-book', [BookingApprovalController::class, 'pencilBook'])
        ->middleware('role:admin|manager')
        ->whereNumber('booking')
        ->name('bookings.approval.pencil-book');

    Route::post('/bookings/{booking}/approval/confirm', [BookingApprovalController::class, 'confirm'])
        ->middleware('role:admin|manager')
        ->whereNumber('booking')
        ->name('bookings.approval.confirm');

    Route::post('/bookings/{booking}/approval/decline', [BookingApprovalController::class, 'decline'])
        ->middleware('role:admin|manager')
        ->whereNumber('booking')
        ->name('bookings.approval.decline');

    Route::post('/bookings/{booking}/approval/cancel', [BookingApprovalController::class, 'cancel'])
        ->middleware('role:admin|manager')
        ->whereNumber('booking')
        ->name('bookings.approval.cancel');

    Route::post('/bookings/{booking}/approval/complete', [BookingApprovalController::class, 'complete'])
        ->middleware('role:admin|manager')
        ->whereNumber('booking')
        ->name('bookings.approval.complete');

    Route::put('/bookings/{booking}/billing', [BookingBillingController::class, 'update'])
        ->middleware('role:admin|manager')
        ->whereNumber('booking')
        ->name('bookings.billing.update');

    Route::post('/bookings/{booking}/post-event-charges', [BookingBillingController::class, 'storePostEventCharge'])
        ->middleware('role:admin|manager')
        ->whereNumber('booking')
        ->name('bookings.post-event-charges.store');

    Route::put('/bookings/{booking}/post-event-charges/{bookingPostEventCharge}', [BookingBillingController::class, 'updatePostEventCharge'])
        ->middleware('role:admin|manager')
        ->whereNumber(['booking', 'bookingPostEventCharge'])
        ->name('bookings.post-event-charges.update');

    Route::delete('/bookings/{booking}/post-event-charges/{bookingPostEventCharge}', [BookingBillingController::class, 'destroyPostEventCharge'])
        ->middleware('role:admin|manager')
        ->whereNumber(['booking', 'bookingPostEventCharge'])
        ->name('bookings.post-event-charges.destroy');

    Route::get('/bookings/{booking}/print/reservation', [BookingPrintableController::class, 'reservation'])
        ->whereNumber('booking')
        ->name('bookings.print.reservation');

    Route::get('/bookings/{booking}/print/final-bill', [BookingPrintableController::class, 'finalBill'])
        ->whereNumber('booking')
        ->name('bookings.print.final-bill');

    Route::get('/bookings/{booking}/print/cancellation', [BookingPrintableController::class, 'cancellation'])
        ->whereNumber('booking')
        ->name('bookings.print.cancellation');

    Route::get('/bookings/{booking}/print/mice-summary', [BookingPrintableController::class, 'miceSummary'])
        ->whereNumber('booking')
        ->name('bookings.print.mice-summary');

    Route::get('/bookings/{booking}/survey', [BookingController::class, 'survey'])
        ->middleware('permission:bookings.create')
        ->whereNumber('booking')
        ->name('bookings.survey');

    Route::post('/bookings/{booking}/survey', [BookingController::class, 'storeSurvey'])
        ->middleware('permission:bookings.create')
        ->whereNumber('booking')
        ->name('bookings.survey.store');

    Route::get('/bookings/{booking}/survey-proof-image', [BookingController::class, 'surveyProofImage'])
        ->middleware('permission:bookings.view')
        ->whereNumber('booking')
        ->name('bookings.survey-proof-image');

    Route::post('/bookings/{booking}/payments', [BookingController::class, 'storePayment'])
        ->middleware('permission:bookings.view')
        ->whereNumber('booking')
        ->name('bookings.payments.store');

    Route::put('/bookings/{booking}/payments/{payment}', [BookingController::class, 'updatePayment'])
        ->middleware('permission:payments.manage')
        ->whereNumber(['booking', 'payment'])
        ->name('bookings.payments.update');

    Route::get('/bookings/{booking}/payments/{payment}/proof', [BookingController::class, 'paymentProofImage'])
        ->middleware('permission:bookings.view')
        ->whereNumber(['booking', 'payment'])
        ->name('bookings.payments.proof');

    Route::get('/bookings', [BookingController::class, 'index'])
        ->middleware('permission:bookings.view')
        ->name('bookings.index');

    Route::get('/bookings/create', [BookingController::class, 'create'])
        ->middleware('permission:bookings.create')
        ->name('bookings.create');

    Route::post('/bookings', [BookingController::class, 'store'])
        ->middleware('permission:bookings.create')
        ->name('bookings.store');

    Route::get('/bookings/{booking}', [BookingController::class, 'show'])
        ->middleware('permission:bookings.view')
        ->whereNumber('booking')
        ->name('bookings.show');

    Route::get('/bookings/{booking}/edit', [BookingController::class, 'edit'])
        ->middleware('permission:bookings.update')
        ->whereNumber('booking')
        ->name('bookings.edit');

    Route::put('/bookings/{booking}', [BookingController::class, 'update'])
        ->middleware('permission:bookings.update')
        ->whereNumber('booking')
        ->name('bookings.update');

    Route::delete('/bookings/{booking}', [BookingController::class, 'destroy'])
        ->middleware('permission:bookings.delete')
        ->whereNumber('booking')
        ->name('bookings.destroy');

    /*
    |--------------------------------------------------------------------------
    | Legacy Payment Review Compatibility
    |--------------------------------------------------------------------------
    */

    Route::get('/payments/review', [PaymentReviewController::class, 'index'])
        ->middleware('permission:payments.manage')
        ->name('payments.review');

    Route::put('/payments/review/{payment}', [PaymentReviewController::class, 'update'])
        ->middleware('permission:payments.manage')
        ->whereNumber('payment')
        ->name('payments.review.update');

    Route::post('/payments/review/{payment}/approve', [PaymentReviewController::class, 'approve'])
        ->middleware('permission:payments.manage')
        ->whereNumber('payment')
        ->name('payments.review.approve');

    Route::post('/payments/review/{payment}/reject', [PaymentReviewController::class, 'reject'])
        ->middleware('permission:payments.manage')
        ->whereNumber('payment')
        ->name('payments.review.reject');

    Route::get('/reports/mice-registry', [MiceRegistryController::class, 'index'])
        ->middleware('permission:bookings.view')
        ->name('reports.mice-registry');

    Route::get('/reports/mice-registry/create', [MiceRegistryController::class, 'create'])
        ->middleware('role:admin|manager')
        ->name('reports.mice-registry.create');

    Route::post('/reports/mice-registry', [MiceRegistryController::class, 'store'])
        ->middleware('role:admin|manager')
        ->name('reports.mice-registry.store');

    Route::get('/reports/mice-registry/print', [MiceRegistryController::class, 'print'])
        ->middleware('permission:bookings.view')
        ->name('reports.mice-registry.print');

    Route::get('/reports/mice-registry/export', [MiceRegistryController::class, 'export'])
        ->middleware('permission:bookings.view')
        ->name('reports.mice-registry.export');

    Route::get('/reports/mice-registry/{miceRecord}/edit', [MiceRegistryController::class, 'edit'])
        ->middleware('role:admin|manager')
        ->whereNumber('miceRecord')
        ->name('reports.mice-registry.edit');

    Route::put('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'update'])
        ->middleware('role:admin|manager')
        ->whereNumber('miceRecord')
        ->name('reports.mice-registry.update');

    Route::delete('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'destroy'])
        ->middleware('role:admin|manager')
        ->whereNumber('miceRecord')
        ->name('reports.mice-registry.destroy');

    Route::resource('services', ServiceController::class)
        ->middleware('permission:services.manage');

    Route::resource('service-types', ServiceTypeController::class)
        ->middleware('permission:service_types.manage');

    Route::get('/users/roles', [UserRoleController::class, 'index'])
        ->middleware('permission:users.manage')
        ->name('users.roles');

    Route::put('/users/{user}/roles', [UserRoleController::class, 'update'])
        ->middleware('permission:users.manage')
        ->whereNumber('user')
        ->name('users.roles.update');

    Route::post('/users/{user}/verify-email', [UserController::class, 'verifyEmail'])
        ->middleware('permission:users.manage')
        ->whereNumber('user')
        ->name('users.verify-email');

    Route::resource('users', UserController::class)
        ->middleware('permission:users.manage')
        ->where(['user' => '[0-9]+']);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
