<?php

namespace App\Observers;

use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\CalendarBlock;
use App\Models\Inquiry;
use App\Models\MiceRecord;
use App\Models\Service;
use App\Models\ServiceType;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class SystemAuditObserver
{
    public function created(Model $model): void
    {
        $this->safely(function () use ($model): void {
            $notifications = app(NotificationService::class);
            $actor = Auth::user();

            match (true) {
                $model instanceof Booking => $notifications->bookingCreated($model, $actor),
                $model instanceof BookingPayment && $model->booking => $notifications->paymentCreated($model, $model->booking, $actor),
                $model instanceof CalendarBlock && $actor instanceof User => $notifications->calendarBlockCreated($model, $actor),
                $model instanceof Inquiry => $notifications->publicInquiryCreated($model),
                $model instanceof MiceRecord => $notifications->miceRecordSaved($model, $actor instanceof User ? $actor : null, true),
                $model instanceof Service && $actor instanceof User => $notifications->serviceCreated($model, $actor),
                $model instanceof ServiceType && $actor instanceof User => $notifications->serviceTypeCreated($model, $actor),
                $model instanceof User => $notifications->userCreated($model, $actor instanceof User ? $actor : null),
                default => null,
            };
        });
    }

    public function updated(Model $model): void
    {
        $changes = $this->changesFor($model);

        if ($changes === []) {
            return;
        }

        $this->safely(function () use ($model, $changes): void {
            $notifications = app(NotificationService::class);
            $actor = Auth::user();

            match (true) {
                $model instanceof Booking => $notifications->bookingUpdated($model, $actor instanceof User ? $actor : null, $changes),
                $model instanceof BookingPayment && $model->booking => $notifications->paymentUpdated($model, $model->booking, $actor instanceof User ? $actor : null, $changes),
                $model instanceof CalendarBlock && $actor instanceof User => $notifications->calendarBlockUpdated($model, $actor, $changes),
                $model instanceof Inquiry && $actor instanceof User => $notifications->publicInquiryUpdated($model, $actor, $changes),
                $model instanceof MiceRecord => $notifications->miceRecordSaved($model, $actor instanceof User ? $actor : null, false),
                $model instanceof Service && $actor instanceof User => $notifications->serviceUpdated($model, $actor, $changes),
                $model instanceof ServiceType && $actor instanceof User => $notifications->serviceTypeUpdated($model, $actor, $changes),
                $model instanceof User => $notifications->userUpdated($model, $actor instanceof User ? $actor : null, $changes),
                default => null,
            };
        });
    }

    public function deleted(Model $model): void
    {
        $this->safely(function () use ($model): void {
            $notifications = app(NotificationService::class);
            $actor = Auth::user();

            match (true) {
                $model instanceof Booking => $notifications->bookingDeleted($model, $actor instanceof User ? $actor : null),
                $model instanceof CalendarBlock && $actor instanceof User => $notifications->calendarBlockDeleted($model, $actor),
                $model instanceof Inquiry && $actor instanceof User => $notifications->publicInquiryDeleted($model, $actor),
                $model instanceof MiceRecord => $notifications->miceRecordDeleted($model, $actor instanceof User ? $actor : null),
                $model instanceof Service && $actor instanceof User => $notifications->serviceDeleted($model, $actor),
                $model instanceof ServiceType && $actor instanceof User => $notifications->serviceTypeDeleted($model, $actor),
                default => null,
            };
        });
    }

    /**
     * @return array<string, array{0:mixed, 1:mixed}>
     */
    private function changesFor(Model $model): array
    {
        $changes = [];

        foreach ($model->getChanges() as $field => $newValue) {
            if (in_array($field, ['updated_at', 'created_at', 'last_login_at', 'remember_token', 'password'], true)) {
                continue;
            }

            $changes[$field] = [$model->getOriginal($field), $newValue];
        }

        return $changes;
    }

    private function safely(callable $callback): void
    {
        try {
            $callback();
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
