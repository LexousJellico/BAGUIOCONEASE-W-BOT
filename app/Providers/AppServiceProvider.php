<?php

namespace App\Providers;

use App\Models\User;
use App\Observers\SystemAuditObserver;
use App\Models\ServiceType;
use App\Models\Service;
use App\Models\MiceRecord;
use App\Models\Inquiry;
use App\Models\CalendarBlock;
use App\Models\BookingPayment;
use App\Models\Booking;
use App\Services\BookingService;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\Contracts\ServiceServiceInterface;
use App\Services\Contracts\ServiceTypeServiceInterface;
use App\Services\ServiceService;
use App\Services\ServiceTypeService;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(ServiceServiceInterface::class, ServiceService::class);
        $this->app->bind(ServiceTypeServiceInterface::class, ServiceTypeService::class);
        $this->app->bind(BookingServiceInterface::class, BookingService::class);

        // NotificationService is auto-resolved.
    }

    public function boot(): void
    {
        foreach ([Booking::class, BookingPayment::class, CalendarBlock::class, Inquiry::class, MiceRecord::class, Service::class, ServiceType::class, User::class] as $observedModel) {
            $observedModel::observe(SystemAuditObserver::class);
        }

        Event::listen(Login::class, function (Login $event): void {
            $user = $event->user;

            if (! $user instanceof User) {
                return;
            }

            if (! Schema::hasColumn($user->getTable(), 'last_login_at')) {
                return;
            }

            $user->forceFill([
                'last_login_at' => now(),
            ])->saveQuietly();
        });
    }
}
