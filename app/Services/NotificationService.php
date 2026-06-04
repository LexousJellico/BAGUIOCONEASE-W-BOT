<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\CalendarBlock;
use App\Models\Inquiry;
use App\Models\MiceRecord;
use App\Models\Service;
use App\Models\ServiceType;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

class NotificationService
{
    protected function recipientsByRoles(array $roles, ?User $exclude = null): Collection
    {
        $rolesLower = collect($roles)
            ->filter(fn ($role) => is_string($role) && trim($role) !== '')
            ->map(fn ($role) => mb_strtolower(trim($role)))
            ->values()
            ->all();

        if (empty($rolesLower)) {
            return collect();
        }

        $query = User::query()->whereHas('roles', function ($query) use ($rolesLower): void {
            $query->whereIn(DB::raw('LOWER(name)'), $rolesLower);
        });

        if ($exclude) {
            $query->whereKeyNot($exclude->id);
        }

        return $query->get()->unique('id')->values();
    }

    protected function adminRecipients(?User $exclude = null): Collection
    {
        return $this->recipientsByRoles(['admin'], $exclude);
    }

    protected function managerRecipients(?User $exclude = null): Collection
    {
        return $this->recipientsByRoles(['manager'], $exclude);
    }

    protected function staffRecipients(?User $exclude = null): Collection
    {
        return $this->recipientsByRoles(['staff'], $exclude);
    }

    /**
     * Admin has monitoring visibility across the system. Do not hide actions
     * from admin actors; seeing their own audit actions is intentional.
     */
    protected function adminAuditRecipients(?User $actor = null): Collection
    {
        $admins = $this->adminRecipients(null);

        if ($admins->isEmpty() && $actor && $this->userHasAnyRole($actor, ['admin'])) {
            return collect([$actor]);
        }

        return $admins;
    }

    protected function operationsRecipients(?User $actor = null): Collection
    {
        return $this->adminAuditRecipients($actor)
            ->merge($this->managerRecipients(null))
            ->unique('id')
            ->values();
    }

    protected function userHasAnyRole(User $user, array $roles): bool
    {
        $rolesLower = array_map(fn ($role) => mb_strtolower((string) $role), $roles);

        try {
            return $user->roles()
                ->whereIn(DB::raw('LOWER(name)'), $rolesLower)
                ->exists();
        } catch (\Throwable) {
            return false;
        }
    }

    protected function actorRole(?User $actor): string
    {
        if (! $actor) {
            return 'guest';
        }

        if ($this->userHasAnyRole($actor, ['admin'])) {
            return 'admin';
        }

        if ($this->userHasAnyRole($actor, ['manager'])) {
            return 'manager';
        }

        if ($this->userHasAnyRole($actor, ['staff'])) {
            return 'staff';
        }

        return 'client';
    }

    protected function safeRouteAny(array $names, string $fallback = '/', array $params = []): string
    {
        try {
            foreach ($names as $name) {
                if (is_string($name) && $name !== '' && Route::has($name)) {
                    return route($name, $params);
                }
            }
        } catch (\Throwable) {
            // Keep notifications from blocking business actions.
        }

        return $fallback;
    }

    protected function bookingLink(Booking $booking, ?string $fragment = null): string
    {
        $link = $this->safeRouteAny(
            ['bookings.show', 'user.bookings.show'],
            '/bookings/' . $booking->id,
            ['booking' => $booking->id]
        );

        return $fragment ? $link . $fragment : $link;
    }

    protected function bookingOwner(Booking $booking): ?User
    {
        if (isset($booking->user_id) && $booking->user_id) {
            $user = User::find($booking->user_id);
            if ($user) {
                return $user;
            }
        }

        if (isset($booking->created_by_user_id) && $booking->created_by_user_id) {
            $user = User::find($booking->created_by_user_id);
            if ($user && ! $this->userHasAnyRole($user, ['admin', 'manager', 'staff'])) {
                return $user;
            }
        }

        $email = strtolower(trim((string) ($booking->client_email ?? '')));

        return $email !== '' ? User::whereRaw('LOWER(email) = ?', [$email])->first() : null;
    }

    protected function bookingLabel(Booking $booking): string
    {
        return trim((string) ($booking->company_name ?: $booking->client_name ?: $booking->client_email ?: ('Booking #' . $booking->id)));
    }

    protected function actorLabel(?User $actor): string
    {
        if (! $actor) {
            return 'System';
        }

        $role = $this->actorRole($actor);
        $roleLabel = $role === 'client' ? 'Client/User' : ucfirst($role);

        return trim(sprintf('%s %s (%s)', $roleLabel, $actor->name ?: 'User', $actor->email ?: 'no email'));
    }

    protected function meta(?User $actor): string
    {
        return sprintf('By %s • %s.', $this->actorLabel($actor), now()->format('M d, Y h:ia'));
    }

    protected function humanField(string $field): string
    {
        return ucwords(str_replace('_', ' ', $field));
    }

    protected function stringify(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '—';
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('M d, Y h:ia');
        }

        if (is_array($value) || is_object($value)) {
            return 'Updated';
        }

        $string = trim((string) $value);

        return mb_strlen($string) > 90 ? mb_substr($string, 0, 87) . '...' : $string;
    }

    protected function summarizeChanges(array $changes): string
    {
        $parts = [];

        foreach ($changes as $field => $pair) {
            if ($field === 'updated_at') {
                continue;
            }

            if (is_array($pair) && count($pair) === 2) {
                [$old, $new] = array_values($pair);
                $parts[] = sprintf('%s: %s → %s.', $this->humanField((string) $field), $this->stringify($old), $this->stringify($new));
            } elseif (is_string($field)) {
                $parts[] = $this->humanField($field) . ' updated.';
            }
        }

        return trim(implode(' ', array_slice($parts, 0, 8)));
    }

    protected function subject(Model $model): array
    {
        return [
            'subject_type' => $model::class,
            'subject_id' => $model->getKey(),
        ];
    }

    protected function notifyMany(iterable $recipients, string $type, string $title, ?string $message = null, ?string $link = null, array $options = []): void
    {
        collect($recipients)
            ->filter(fn ($recipient) => $recipient instanceof User)
            ->unique('id')
            ->each(fn (User $recipient) => $this->createNotification($recipient, $type, $title, $message, $link, $options));
    }

    protected function createNotification(User $recipient, string $type, string $title, ?string $message = null, ?string $link = null, array $options = [])
    {
        $actionKey = (string) ($options['action_key'] ?? $type);
        $subjectType = $options['subject_type'] ?? null;
        $subjectId = $options['subject_id'] ?? null;

        $recent = $recipient->notifications()
            ->where('type', $type)
            ->where('title', $title)
            ->when($link, fn ($query) => $query->where('link', $link), fn ($query) => $query->whereNull('link'))
            ->when($subjectType && Schema::hasColumn('user_notifications', 'subject_type'), fn ($query) => $query->where('subject_type', $subjectType))
            ->when($subjectId && Schema::hasColumn('user_notifications', 'subject_id'), fn ($query) => $query->where('subject_id', $subjectId))
            ->where('created_at', '>=', now()->subSeconds(3))
            ->exists();

        if ($recent) {
            return null;
        }

        $payload = [
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'link' => $link,
        ];

        $optional = [
            'actor_user_id' => $options['actor_user_id'] ?? null,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'action_key' => $actionKey,
            'severity' => $options['severity'] ?? 'info',
            'audience' => $options['audience'] ?? 'user',
            'privacy_scope' => $options['privacy_scope'] ?? 'private',
            'data' => $options['data'] ?? null,
        ];

        foreach ($optional as $column => $value) {
            if (Schema::hasColumn('user_notifications', $column)) {
                $payload[$column] = $value;
            }
        }

        return $recipient->notifications()->create($payload);
    }

    protected function clientOptions(?User $actor, Model $subject, string $actionKey, string $severity = 'info', array $data = []): array
    {
        return [
            ...$this->subject($subject),
            'actor_user_id' => $actor?->id,
            'action_key' => $actionKey,
            'severity' => $severity,
            'audience' => 'client',
            'privacy_scope' => 'private',
            'data' => $data,
        ];
    }

    protected function adminOptions(?User $actor, Model $subject, string $actionKey, string $severity = 'info', array $data = []): array
    {
        return [
            ...$this->subject($subject),
            'actor_user_id' => $actor?->id,
            'action_key' => $actionKey,
            'severity' => $severity,
            'audience' => 'admin',
            'privacy_scope' => 'monitoring',
            'data' => $data,
        ];
    }

    /* -----------------------------------------------------------------
     | Booking lifecycle notifications
     * ----------------------------------------------------------------- */

    public function bookingCreated(Booking $booking, ?User $actor = null): void
    {
        $booking->loadMissing(['createdBy']);
        $link = $this->bookingLink($booking);
        $label = $this->bookingLabel($booking);
        $event = $booking->type_of_event ?: 'event';
        $owner = $this->bookingOwner($booking);

        if ($owner) {
            $this->createNotification(
                $owner,
                'booking_created',
                'Your booking request was received',
                sprintf('System received your reservation for %s. Open the booking details to review your schedule, payment deadline, and next steps.', $event),
                $link,
                $this->clientOptions($actor, $booking, 'booking.created.client', 'success', ['booking_id' => $booking->id])
            );
        }

        $this->notifyMany(
            $this->operationsRecipients($actor),
            'booking_created',
            'Booking created',
            sprintf('%s Booking #%d for %s was created. Event: %s. Status: %s.', $this->meta($actor), $booking->id, $label, $event, (string) ($booking->booking_status ?? 'pending')),
            $link,
            $this->adminOptions($actor, $booking, 'booking.created.admin', 'success', ['booking_id' => $booking->id])
        );
    }

    protected function clientStatusNotice(Booking $booking, ?string $oldStatus, ?string $newStatus): array
    {
        $status = strtolower(trim((string) $newStatus));
        $event = $booking->type_of_event ?: 'your event';

        return match ($status) {
            'for_review' => [
                'type' => 'booking_under_review',
                'title' => 'Your reservation is under review',
                'message' => sprintf('Your reservation for %s is now being reviewed by the BCCC team. You will be notified again when a decision or payment instruction is ready.', $event),
                'severity' => 'info',
            ],
            'confirmed' => [
                'type' => 'booking_confirmed_payment_next',
                'title' => 'Your reservation was confirmed for payment',
                'message' => sprintf('Your reservation for %s was confirmed. Please proceed with the required payment step and monitor your booking details for the payment deadline.', $event),
                'severity' => 'success',
            ],
            'approved', 'accepted', 'active' => [
                'type' => 'booking_approved',
                'title' => 'Your booking has been approved',
                'message' => sprintf('Your reservation for %s has been approved and synced to the calendar. Please open your booking details for final schedule instructions.', $event),
                'severity' => 'success',
            ],
            'pencil_booked' => [
                'type' => 'booking_pencil_booked',
                'title' => 'Your booking is pencil-booked',
                'message' => sprintf('Your reservation for %s is pencil-booked while payment and document requirements are reviewed.', $event),
                'severity' => 'info',
            ],
            'declined', 'cancelled', 'expired' => [
                'type' => 'booking_not_approved',
                'title' => 'Your booking was not approved',
                'message' => sprintf('Your reservation for %s was marked as %s. Open the booking details for the full notice.', $event, str_replace('_', ' ', $status)),
                'severity' => 'danger',
            ],
            'completed' => [
                'type' => 'booking_completed',
                'title' => 'Your booking is completed',
                'message' => sprintf('Your reservation for %s has been marked completed.', $event),
                'severity' => 'success',
            ],
            default => [
                'type' => 'booking_status_changed',
                'title' => 'Your booking status was updated',
                'message' => sprintf('Your reservation for %s is now %s.', $event, str_replace('_', ' ', $status ?: 'updated')),
                'severity' => 'info',
            ],
        };
    }

    public function bookingUpdated(Booking $booking, ?User $actor, array $changes): void
    {
        unset($changes['updated_at']);
        if (empty($changes)) {
            return;
        }

        $link = $this->bookingLink($booking);
        $owner = $this->bookingOwner($booking);
        $summary = $this->summarizeChanges($changes);
        $label = $this->bookingLabel($booking);

        if (isset($changes['booking_status'])) {
            $old = is_array($changes['booking_status']) ? ($changes['booking_status'][0] ?? null) : null;
            $new = is_array($changes['booking_status']) ? ($changes['booking_status'][1] ?? null) : (string) ($booking->booking_status ?? 'updated');
            $notice = $this->clientStatusNotice($booking, $old, $new);

            if ($owner && (! $actor || (int) $owner->id !== (int) $actor->id || $this->actorRole($actor) !== 'client')) {
                $this->createNotification(
                    $owner,
                    $notice['type'],
                    $notice['title'],
                    $notice['message'],
                    $link,
                    $this->clientOptions($actor, $booking, 'booking.status.client', $notice['severity'], ['old_status' => $old, 'new_status' => $new])
                );
            }
        } elseif ($owner && (! $actor || (int) $owner->id !== (int) $actor->id || $this->actorRole($actor) !== 'client')) {
            $this->createNotification(
                $owner,
                'booking_updated',
                'Your booking was updated',
                'System updated your booking details. ' . ($summary ?: 'Open the booking page to review the latest information.'),
                $link,
                $this->clientOptions($actor, $booking, 'booking.updated.client', 'info', ['changes' => array_keys($changes)])
            );
        }

        $this->notifyMany(
            $this->operationsRecipients($actor),
            isset($changes['booking_status']) ? 'booking_status_changed' : 'booking_updated',
            isset($changes['booking_status']) ? 'Booking status changed' : 'Booking updated',
            sprintf('%s Booking #%d for %s was updated. %s', $this->meta($actor), $booking->id, $label, $summary ?: 'Details updated.'),
            $link,
            $this->adminOptions($actor, $booking, isset($changes['booking_status']) ? 'booking.status.admin' : 'booking.updated.admin', 'info', ['changes' => $changes])
        );
    }

    public function bookingDeleted(Booking $booking, ?User $actor = null): void
    {
        $link = $this->safeRouteAny(['bookings.index'], '/bookings');
        $label = $this->bookingLabel($booking);
        $owner = $this->bookingOwner($booking);

        if ($owner && (! $actor || (int) $owner->id !== (int) $actor->id)) {
            $this->createNotification(
                $owner,
                'booking_deleted',
                'Your booking was deleted',
                sprintf('Your reservation record for %s was deleted by BCCC staff. Contact BCCC if you need assistance.', $booking->type_of_event ?: 'your event'),
                $link,
                $this->clientOptions($actor, $booking, 'booking.deleted.client', 'danger')
            );
        }

        $this->notifyMany(
            $this->operationsRecipients($actor),
            'booking_deleted',
            'Booking deleted',
            sprintf('%s Booking #%d for %s was deleted.', $this->meta($actor), $booking->id, $label),
            $link,
            $this->adminOptions($actor, $booking, 'booking.deleted.admin', 'warning')
        );
    }

    public function bookingAutoDeclinedByDeadline(Booking $booking, string $deadlineType = 'payment', ?string $reason = null): void
    {
        $booking->refresh();
        $link = $this->bookingLink($booking);
        $owner = $this->bookingOwner($booking);
        $label = $this->bookingLabel($booking);
        $deadlineLabel = $deadlineType === 'balance' ? 'balance payment deadline' : 'payment deadline';
        $message = $reason ?: 'The 10-working-day '.$deadlineLabel.' expired without settlement.';

        if ($owner) {
            $this->createNotification(
                $owner,
                'booking_auto_declined',
                'Your booking was automatically declined',
                'Your reservation was automatically declined because '.$message.' Open your booking details for the full notice.',
                $link,
                $this->clientOptions(null, $booking, 'booking.deadline.auto_declined.client', 'danger', [
                    'deadline_type' => $deadlineType,
                    'deadline_policy' => '10 working days',
                ])
            );
        }

        $this->notifyMany(
            $this->operationsRecipients(null),
            'booking_auto_declined',
            'Booking automatically declined',
            sprintf('System auto-declined Booking #%d for %s. %s', $booking->id, $label, $message),
            $link,
            $this->adminOptions(null, $booking, 'booking.deadline.auto_declined.admin', 'danger', [
                'deadline_type' => $deadlineType,
                'deadline_policy' => '10 working days',
            ])
        );
    }

    /* -----------------------------------------------------------------
     | Payment notifications
     * ----------------------------------------------------------------- */

    public function paymentCreated(BookingPayment $payment, Booking $booking, ?User $actor = null): void
    {
        $link = $this->bookingLink($booking, '#payments');
        $owner = $this->bookingOwner($booking);
        $amount = number_format((float) ($payment->amount ?? 0), 2);
        $method = trim((string) ($payment->payment_method ?? $payment->payment_gateway ?? 'payment')) ?: 'payment';

        if ($owner && (! $actor || (int) $owner->id !== (int) $actor->id || $this->actorRole($actor) !== 'client')) {
            $this->createNotification(
                $owner,
                'payment_created',
                'Payment recorded on your booking',
                sprintf('A payment entry of ₱%s via %s was recorded on your booking.', $amount, $method),
                $link,
                $this->clientOptions($actor, $booking, 'payment.created.client', 'info', ['payment_id' => $payment->id])
            );
        }

        $this->notifyMany(
            $this->operationsRecipients($actor),
            'payment_created',
            'Payment submitted for review',
            sprintf('%s Payment of ₱%s was submitted on booking #%d by %s.', $this->meta($actor), $amount, $booking->id, $this->bookingLabel($booking)),
            $link,
            $this->adminOptions($actor, $booking, 'payment.created.admin', 'warning', ['payment_id' => $payment->id])
        );
    }

    public function paymentUpdated(BookingPayment $payment, Booking $booking, ?User $actor, array $changes): void
    {
        unset($changes['updated_at']);
        if (empty($changes)) {
            return;
        }

        $summary = $this->summarizeChanges($changes);
        $link = $this->bookingLink($booking, '#payments');
        $owner = $this->bookingOwner($booking);

        if ($owner && (! $actor || (int) $owner->id !== (int) $actor->id || $this->actorRole($actor) !== 'client')) {
            $this->createNotification(
                $owner,
                'payment_updated',
                'Payment on your booking was updated',
                $summary ?: 'A payment entry on your booking was updated.',
                $link,
                $this->clientOptions($actor, $booking, 'payment.updated.client', 'info', ['payment_id' => $payment->id])
            );
        }

        $this->notifyMany(
            $this->operationsRecipients($actor),
            'payment_updated',
            'Payment updated',
            sprintf('%s Payment #%d on booking #%d was updated. %s', $this->meta($actor), $payment->id, $booking->id, $summary ?: 'Details updated.'),
            $link,
            $this->adminOptions($actor, $booking, 'payment.updated.admin', 'info', ['payment_id' => $payment->id, 'changes' => $changes])
        );
    }

    public function paymentReviewed(BookingPayment $payment, Booking $booking, ?User $actor, string $decision, ?string $remarks = null): void
    {
        $decision = strtolower(trim($decision));
        $approved = $decision === 'approved';
        $link = $this->bookingLink($booking, '#payments');
        $owner = $this->bookingOwner($booking);

        if ($owner) {
            $this->createNotification(
                $owner,
                $approved ? 'payment_approved' : 'payment_rejected',
                $approved ? 'Your payment proof was approved' : 'Your payment proof was rejected',
                $approved
                    ? 'BCCC approved your payment proof. Open your booking details to review your updated balance/status.'
                    : ('BCCC rejected your payment proof.' . ($remarks ? ' Remarks: ' . $remarks : ' Please open your booking details for next steps.')),
                $link,
                $this->clientOptions($actor, $booking, $approved ? 'payment.approved.client' : 'payment.rejected.client', $approved ? 'success' : 'danger', ['payment_id' => $payment->id, 'remarks' => $remarks])
            );
        }

        $this->notifyMany(
            $this->operationsRecipients($actor),
            $approved ? 'payment_approved' : 'payment_rejected',
            $approved ? 'Payment proof approved' : 'Payment proof rejected',
            sprintf('%s Payment #%d for booking #%d was %s.%s', $this->meta($actor), $payment->id, $booking->id, $approved ? 'approved' : 'rejected', $remarks ? ' Remarks: ' . $remarks : ''),
            $link,
            $this->adminOptions($actor, $booking, $approved ? 'payment.approved.admin' : 'payment.rejected.admin', $approved ? 'success' : 'warning', ['payment_id' => $payment->id, 'remarks' => $remarks])
        );
    }

    /* -----------------------------------------------------------------
     | Calendar, service, venue/rental notifications
     * ----------------------------------------------------------------- */

    public function serviceCreated(Service $service, User $actor): void
    {
        $this->notifyMany($this->adminAuditRecipients($actor), 'service_created', 'Rental option created', sprintf('%s Rental option "%s" was created.', $this->meta($actor), $service->name), $this->safeRouteAny(['services.index'], '/services'), $this->adminOptions($actor, $service, 'service.created.admin', 'success'));
    }

    public function serviceUpdated(Service $service, User $actor, array $changes): void
    {
        if (empty($changes)) return;
        $this->notifyMany($this->adminAuditRecipients($actor), 'service_updated', 'Rental option updated', sprintf('%s Rental option "%s" was updated. %s', $this->meta($actor), $service->name, $this->summarizeChanges($changes)), $this->safeRouteAny(['services.index'], '/services'), $this->adminOptions($actor, $service, 'service.updated.admin', 'info', ['changes' => $changes]));
    }

    public function serviceDeleted(Service $service, User $actor): void
    {
        $this->notifyMany($this->adminAuditRecipients($actor), 'service_deleted', 'Rental option deleted', sprintf('%s Rental option "%s" was deleted.', $this->meta($actor), $service->name), $this->safeRouteAny(['services.index'], '/services'), $this->adminOptions($actor, $service, 'service.deleted.admin', 'warning'));
    }

    public function serviceTypeCreated(ServiceType $serviceType, User $actor): void
    {
        $this->notifyMany($this->adminAuditRecipients($actor), 'service_type_created', 'Venue area created', sprintf('%s Venue area "%s" was created.', $this->meta($actor), $serviceType->name), $this->safeRouteAny(['service-types.index', 'service_types.index'], '/service-types'), $this->adminOptions($actor, $serviceType, 'service_type.created.admin', 'success'));
    }

    public function serviceTypeUpdated(ServiceType $serviceType, User $actor, array $changes): void
    {
        if (empty($changes)) return;
        $this->notifyMany($this->adminAuditRecipients($actor), 'service_type_updated', 'Venue area updated', sprintf('%s Venue area "%s" was updated. %s', $this->meta($actor), $serviceType->name, $this->summarizeChanges($changes)), $this->safeRouteAny(['service-types.index', 'service_types.index'], '/service-types'), $this->adminOptions($actor, $serviceType, 'service_type.updated.admin', 'info', ['changes' => $changes]));
    }

    public function serviceTypeDeleted(ServiceType $serviceType, User $actor): void
    {
        $this->notifyMany($this->adminAuditRecipients($actor), 'service_type_deleted', 'Venue area deleted', sprintf('%s Venue area "%s" was deleted.', $this->meta($actor), $serviceType->name), $this->safeRouteAny(['service-types.index', 'service_types.index'], '/service-types'), $this->adminOptions($actor, $serviceType, 'service_type.deleted.admin', 'warning'));
    }

    public function calendarBlockCreated(CalendarBlock $block, User $actor): void
    {
        $this->notifyMany($this->adminAuditRecipients($actor), 'calendar_block_created', 'Calendar block created', sprintf('%s Calendar block "%s" was created for %s to %s (%s).', $this->meta($actor), $block->title, optional($block->date_from)->format('M d, Y'), optional($block->date_to)->format('M d, Y'), strtoupper((string) $block->block)), $this->safeRouteAny(['dashboard'], '/dashboard'), $this->adminOptions($actor, $block, 'calendar_block.created.admin', 'warning'));
    }

    public function calendarBlocksBulkCreated(Collection $blocks, User $actor): void
    {
        if ($blocks->isEmpty()) return;
        $first = $blocks->first();
        if (! $first instanceof CalendarBlock) return;
        $this->notifyMany($this->adminAuditRecipients($actor), 'calendar_block_bulk_created', 'Bulk calendar blocks created', sprintf('%s Bulk calendar blocking created %d block%s. First block: "%s".', $this->meta($actor), $blocks->count(), $blocks->count() === 1 ? '' : 's', $first->title), $this->safeRouteAny(['dashboard'], '/dashboard'), $this->adminOptions($actor, $first, 'calendar_block.bulk_created.admin', 'warning', ['created_count' => $blocks->count()]));
    }

    public function calendarBlockUpdated(CalendarBlock $block, User $actor, array $changes = []): void
    {
        $this->notifyMany($this->adminAuditRecipients($actor), 'calendar_block_updated', 'Calendar block updated', sprintf('%s Calendar block "%s" was updated. %s', $this->meta($actor), $block->title, $this->summarizeChanges($changes) ?: 'Details updated.'), $this->safeRouteAny(['dashboard'], '/dashboard'), $this->adminOptions($actor, $block, 'calendar_block.updated.admin', 'info', ['changes' => $changes]));
    }

    public function calendarBlockDeleted(CalendarBlock $block, User $actor): void
    {
        $this->notifyMany($this->adminAuditRecipients($actor), 'calendar_block_deleted', 'Calendar block deleted', sprintf('%s Calendar block "%s" was deleted.', $this->meta($actor), $block->title), $this->safeRouteAny(['dashboard'], '/dashboard'), $this->adminOptions($actor, $block, 'calendar_block.deleted.admin', 'warning'));
    }

    /* -----------------------------------------------------------------
     | Inquiry, MICE, content and account notifications
     * ----------------------------------------------------------------- */

    public function publicInquiryCreated(Inquiry $inquiry): void
    {
        $this->notifyMany($this->adminAuditRecipients(null), 'public_inquiry_created', 'New public inquiry submitted', sprintf('A public inquiry was submitted by %s (%s). Subject: %s.', $inquiry->name, $inquiry->email, $inquiry->subject), $this->safeRouteAny(['inquiries.index'], '/inquiries'), $this->adminOptions(null, $inquiry, 'inquiry.created.admin', 'warning'));
    }

    public function publicInquiryUpdated(Inquiry $inquiry, User $actor, array $changes = []): void
    {
        $this->notifyMany($this->adminAuditRecipients($actor), 'public_inquiry_updated', 'Public inquiry updated', sprintf('%s Inquiry from %s was updated. %s', $this->meta($actor), $inquiry->name, $this->summarizeChanges($changes) ?: 'Status/details updated.'), $this->safeRouteAny(['inquiries.index'], '/inquiries'), $this->adminOptions($actor, $inquiry, 'inquiry.updated.admin', 'info', ['changes' => $changes]));
    }

    public function publicInquiryDeleted(Inquiry $inquiry, User $actor): void
    {
        $this->notifyMany($this->adminAuditRecipients($actor), 'public_inquiry_deleted', 'Public inquiry deleted', sprintf('%s Inquiry from %s (%s) was deleted.', $this->meta($actor), $inquiry->name, $inquiry->email), $this->safeRouteAny(['inquiries.index'], '/inquiries'), $this->adminOptions($actor, $inquiry, 'inquiry.deleted.admin', 'warning'));
    }

    public function miceRecordSaved(MiceRecord $record, ?User $actor = null, bool $created = false): void
    {
        $title = $created ? 'MICE registry entry created' : 'MICE registry entry updated';
        $this->notifyMany($this->adminAuditRecipients($actor), $created ? 'mice_record_created' : 'mice_record_updated', $title, sprintf('%s %s for "%s".', $this->meta($actor), $title, $record->event_name ?: ('Record #' . $record->id)), $this->safeRouteAny(['reports.mice-registry'], '/reports/mice-registry'), $this->adminOptions($actor, $record, $created ? 'mice.created.admin' : 'mice.updated.admin', $created ? 'success' : 'info'));
    }

    public function miceRecordDeleted(MiceRecord $record, ?User $actor = null): void
    {
        $this->notifyMany($this->adminAuditRecipients($actor), 'mice_record_deleted', 'MICE registry entry deleted', sprintf('%s MICE record "%s" was deleted.', $this->meta($actor), $record->event_name ?: ('Record #' . $record->id)), $this->safeRouteAny(['reports.mice-registry'], '/reports/mice-registry'), $this->adminOptions($actor, $record, 'mice.deleted.admin', 'warning'));
    }

    public function contentUpdated(string $section, ?User $actor = null, array $data = []): void
    {
        $dummy = new class extends Model {
            protected $table = 'user_notifications';
        };
        $dummy->id = null;

        $this->notifyMany($this->adminAuditRecipients($actor), 'content_updated', 'Public content updated', sprintf('%s Public content section "%s" was updated.', $this->meta($actor), $section), $this->safeRouteAny(['content', 'content.index'], '/content'), [
            'actor_user_id' => $actor?->id,
            'action_key' => 'content.updated.admin',
            'severity' => 'info',
            'audience' => 'admin',
            'privacy_scope' => 'monitoring',
            'subject_type' => 'content',
            'subject_id' => null,
            'data' => $data,
        ]);
    }

    public function userSelfRegistered(User $user): void
    {
        $this->notifyMany(
            $this->adminAuditRecipients(null),
            'user_registered',
            'New client account created',
            sprintf('A new client account was created: %s (%s).', $user->name ?: 'Client', $user->email ?: 'no email'),
            $this->safeRouteAny(['users.index', 'admin.users.index'], '/users'),
            $this->adminOptions(null, $user, 'user.registered.admin', 'success')
        );

        $this->createNotification(
            $user,
            'account_created',
            'Welcome to BCCC EASE',
            'Your account was created successfully. System messages about your booking, payment, and account updates will appear here privately.',
            $this->safeRouteAny(['dashboard'], '/dashboard'),
            $this->clientOptions(null, $user, 'account.created.client', 'success')
        );
    }


    public function userEmailVerified(User $user): void
    {
        $this->notifyMany(
            $this->adminAuditRecipients(null),
            'user_email_verified',
            'Client account verified',
            sprintf('Client account email was verified: %s (%s).', $user->name ?: 'Client', $user->email ?: 'no email'),
            $this->safeRouteAny(['users.index', 'admin.users.index'], '/users'),
            $this->adminOptions(null, $user, 'user.email_verified.admin', 'success')
        );

        $this->createNotification(
            $user,
            'account_verified',
            'Your account has been verified',
            'Your BCCC EASE account email has been verified. You can now receive private booking, payment, and account updates here.',
            $this->safeRouteAny(['dashboard'], '/dashboard'),
            $this->clientOptions(null, $user, 'account.verified.client', 'success')
        );
    }

    public function bookingOpenedForReview(Booking $booking, User $actor): void
    {
        if (! $this->userHasAnyRole($actor, ['admin', 'manager', 'staff'])) {
            return;
        }

        $owner = $this->bookingOwner($booking);

        if (! $owner || (int) $owner->id === (int) $actor->id) {
            return;
        }

        $role = strtoupper($this->actorRole($actor));
        $event = $booking->type_of_event ?: 'your event';

        $this->createNotification(
            $owner,
            'booking_under_review',
            'Your reservation is under review',
            sprintf('Your reservation for %s is now under review by %s. You will be notified when the review is completed or when payment instructions are ready.', $event, $role),
            $this->bookingLink($booking),
            $this->clientOptions($actor, $booking, 'booking.review_opened.client', 'info', [
                'booking_id' => $booking->id,
                'reviewed_by_role' => $role,
            ])
        );
    }

    public function bookingApprovedAfterPayment(Booking $booking, ?User $actor = null): void
    {
        $owner = $this->bookingOwner($booking);

        if (! $owner) {
            return;
        }

        $event = $booking->type_of_event ?: 'your event';

        $this->createNotification(
            $owner,
            'booking_payment_completed_approved',
            'Your reservation is approved',
            sprintf('Your payment was approved and your reservation for %s is now approved. The approved schedule is now available in your calendar.', $event),
            $this->bookingLink($booking),
            $this->clientOptions($actor, $booking, 'booking.payment_completed.approved.client', 'success', [
                'booking_id' => $booking->id,
                'payment_status' => $booking->payment_status,
                'booking_status' => $booking->booking_status,
            ])
        );
    }

    public function bookingEventReminder(Booking $booking, int $daysBefore): void
    {
        $owner = $this->bookingOwner($booking);

        if (! $owner) {
            return;
        }

        $event = $booking->type_of_event ?: 'your approved event';
        $date = $booking->booking_date_from ? $booking->booking_date_from->format('M d, Y h:ia') : 'your reserved date';
        $label = $daysBefore === 1 ? 'tomorrow' : $daysBefore . ' days from now';

        $this->createNotification(
            $owner,
            'booking_event_reminder_' . $daysBefore . 'd',
            $daysBefore === 1 ? 'Your event is tomorrow' : 'Your event is approaching',
            sprintf('Reminder: %s is scheduled on %s (%s). Please review your booking details and final instructions.', $event, $date, $label),
            $this->bookingLink($booking),
            $this->clientOptions(null, $booking, 'booking.event_reminder.' . $daysBefore . 'd.client', 'warning', [
                'booking_id' => $booking->id,
                'days_before' => $daysBefore,
            ])
        );
    }

    public function bookingPaymentDueReminder(Booking $booking, string $deadlineType = 'payment'): void
    {
        $owner = $this->bookingOwner($booking);

        if (! $owner) {
            return;
        }

        $event = $booking->type_of_event ?: 'your reservation';
        $deadline = $deadlineType === 'balance'
            ? $booking->payment_balance_due_at
            : ($booking->expired_at ?: $booking->payment_balance_due_at);
        $deadlineText = $deadline ? $deadline->format('M d, Y h:ia') : 'the payment deadline';
        $title = $deadlineType === 'balance' ? 'Balance payment deadline reminder' : 'Payment deadline reminder';

        $this->createNotification(
            $owner,
            $deadlineType === 'balance' ? 'booking_balance_due_reminder' : 'booking_payment_due_reminder',
            $title,
            sprintf('Reminder: %s still has a pending %s. Please settle it on or before %s to avoid cancellation.', $event, $deadlineType === 'balance' ? 'balance payment' : 'payment requirement', $deadlineText),
            $this->bookingLink($booking, '#payments'),
            $this->clientOptions(null, $booking, 'booking.payment_due_reminder.' . $deadlineType . '.client', 'warning', [
                'booking_id' => $booking->id,
                'deadline_type' => $deadlineType,
                'deadline_at' => optional($deadline)->toIso8601String(),
            ])
        );
    }

    protected function userRoleNames(User $user, ?array $assignedRoles = null): array
    {
        if (is_array($assignedRoles)) {
            return collect($assignedRoles)->map(fn ($role) => is_object($role) && isset($role->name) ? (string) $role->name : (string) $role)->filter()->values()->all();
        }

        try {
            return $user->roles()->pluck('name')->map(fn ($role) => (string) $role)->values()->all();
        } catch (\Throwable) {
            return [];
        }
    }

    public function userCreated(User $user, ?User $actor = null, ?array $assignedRoles = null): void
    {
        $roles = $this->userRoleNames($user, $assignedRoles);
        $rolesText = $roles ? implode(', ', $roles) : '—';
        $link = $this->safeRouteAny(['users.index', 'admin.users.index'], '/users');

        $this->notifyMany($this->adminAuditRecipients($actor), 'user_created', 'User created', sprintf('%s Created user %s (%s). Roles: %s.', $this->meta($actor), $user->name, $user->email, $rolesText), $link, $this->adminOptions($actor, $user, 'user.created.admin', 'success', ['roles' => $roles]));

        if (! $actor || (int) $actor->id !== (int) $user->id) {
            $this->createNotification($user, 'account_created', 'Your account was created', 'Your BCCC EASE account was created. Roles: ' . $rolesText . '.', $this->safeRouteAny(['dashboard'], '/dashboard'), $this->clientOptions($actor, $user, 'account.created.by_admin.client', 'success', ['roles' => $roles]));
        }
    }

    public function userUpdated(User $user, ?User $actor = null, array $changes = []): void
    {
        unset($changes['updated_at'], $changes['remember_token'], $changes['password']);
        if (empty($changes)) return;

        $summary = $this->summarizeChanges($changes);
        $link = $this->safeRouteAny(['users.index', 'admin.users.index'], '/users');

        $this->notifyMany($this->adminAuditRecipients($actor), 'user_updated', 'User account updated', sprintf('%s Updated user %s (%s). %s', $this->meta($actor), $user->name, $user->email, $summary ?: 'Details updated.'), $link, $this->adminOptions($actor, $user, 'user.updated.admin', 'info', ['changes' => $changes]));

        if (! $actor || (int) $actor->id !== (int) $user->id || ! $this->userHasAnyRole($actor, ['admin', 'manager', 'staff'])) {
            $this->createNotification($user, 'account_updated', 'Your account was updated', $summary ?: 'Your account details were updated.', $this->safeRouteAny(['profile.edit', 'dashboard'], '/dashboard'), $this->clientOptions($actor, $user, 'account.updated.client', 'info', ['changes' => array_keys($changes)]));
        }
    }

    public function userDeleted(User $user, ?User $actor = null): void
    {
        $this->notifyMany($this->adminAuditRecipients($actor), 'user_deleted', 'User deleted', sprintf('%s Deleted user %s (%s).', $this->meta($actor), $user->name, $user->email), $this->safeRouteAny(['users.index', 'admin.users.index'], '/users'), $this->adminOptions($actor, $user, 'user.deleted.admin', 'warning'));
    }

    public function userRolesUpdated(User $target, ?User $actor = null, array $oldRoles = [], array $newRoles = []): void
    {
        $oldText = implode(', ', array_filter(array_map('strval', $oldRoles))) ?: '—';
        $newText = implode(', ', array_filter(array_map('strval', $newRoles))) ?: '—';
        $link = $this->safeRouteAny(['users.roles.index', 'admin.users.roles.index', 'users.index', 'admin.users.index'], '/users');

        $this->notifyMany($this->adminAuditRecipients($actor), 'user_roles_updated', 'User roles updated', sprintf('%s Updated roles for %s (%s): [%s] → [%s].', $this->meta($actor), $target->name, $target->email, $oldText, $newText), $link, $this->adminOptions($actor, $target, 'user.roles_updated.admin', 'info', ['old_roles' => $oldRoles, 'new_roles' => $newRoles]));

        if (! $actor || (int) $target->id !== (int) $actor->id) {
            $this->createNotification($target, 'account_roles_updated', 'Your account role was updated', sprintf('Your account roles were updated: [%s] → [%s].', $oldText, $newText), $this->safeRouteAny(['dashboard'], '/dashboard'), $this->clientOptions($actor, $target, 'account.roles_updated.client', 'info', ['old_roles' => $oldRoles, 'new_roles' => $newRoles]));
        }
    }

    public function bookingLifecycleMaintenanceReport(array $summary): void
    {
        $changed = (int) ($summary['changed_count'] ?? 0);
        $deleted = (int) ($summary['deleted_count'] ?? 0);

        if ($changed < 1 && $deleted < 1) {
            return;
        }

        $parts = [];
        if ($changed > 0) {
            $parts[] = $changed . ' booking' . ($changed === 1 ? '' : 's') . ' had automatic status updates.';
        }
        if ($deleted > 0) {
            $parts[] = $deleted . ' declined/cancelled booking' . ($deleted === 1 ? '' : 's') . ' were automatically deleted after the cleanup window.';
        }

        $this->notifyMany($this->operationsRecipients(null), 'booking_lifecycle_maintenance', 'Booking lifecycle maintenance completed', implode(' ', $parts), $this->safeRouteAny(['bookings.index', 'dashboard'], '/dashboard'), [
            'action_key' => 'booking.lifecycle_maintenance.admin',
            'severity' => 'warning',
            'audience' => 'admin',
            'privacy_scope' => 'monitoring',
            'subject_type' => 'booking_lifecycle',
            'subject_id' => null,
            'data' => $summary,
        ]);
    }
}
