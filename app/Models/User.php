<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory;
    use Notifiable;
    use TwoFactorAuthenticatable;
    use HasRoles;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'middle_name',
        'last_name',
        'email',
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
        'password',
        'google_id',
        'google_avatar',
        'last_login_at',
        'email_verified_at',
    ];

    /**
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'bookings_view_tracking_started_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(UserNotification::class, 'user_id');
    }


    public function loginDevices(): HasMany
    {
        return $this->hasMany(UserLoginDevice::class);
    }

    public function bookingsCreated(): HasMany
    {
        return $this->hasMany(Booking::class, 'created_by_user_id');
    }

    public function bookings(): HasMany
    {
        return $this->bookingsCreated();
    }

    public function latestBookingCreated(): HasOne
    {
        return $this->hasOne(Booking::class, 'created_by_user_id')->latestOfMany();
    }

    public function bookingViews(): HasMany
    {
        return $this->hasMany(BookingView::class, 'user_id');
    }

    public function bookingDrafts(): HasMany
    {
        return $this->hasMany(BookingDraft::class, 'user_id');
    }

    public function getDisplayNameAttribute(): string
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ], fn ($value) => filled($value));

        return trim(count($parts) > 0 ? implode(' ', $parts) : (string) $this->name);
    }
}
