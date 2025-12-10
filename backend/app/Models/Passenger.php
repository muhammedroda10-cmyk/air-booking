<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Passenger extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'name',
        'first_name',
        'last_name',
        'date_of_birth',
        'passport_number',
        'passport_expiry',
        'nationality',
        'passenger_type',
        'meal_preference',
        'special_requests',
        'seat_number',
        'ticket_number',
        'email',
        'phone_number',
        // Correction audit fields
        'original_data',
        'corrected_by',
        'corrected_at',
        'correction_reason',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'passport_expiry' => 'date',
        'original_data' => 'array',
        'corrected_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($passenger) {
            // Generate ticket number if not set
            if (!$passenger->ticket_number) {
                $passenger->ticket_number = strtoupper(Str::random(3)) . '-' . rand(100000, 999999);
            }

            // Split name into first/last if not set
            if (!$passenger->first_name && $passenger->name) {
                $parts = explode(' ', $passenger->name, 2);
                $passenger->first_name = $parts[0];
                $passenger->last_name = $parts[1] ?? '';
            }
        });
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function getFullNameAttribute(): string
    {
        if ($this->first_name || $this->last_name) {
            return trim($this->first_name . ' ' . $this->last_name);
        }
        return $this->name ?? '';
    }

    public function getAgeAttribute(): ?int
    {
        if ($this->date_of_birth) {
            return $this->date_of_birth->age;
        }
        return null;
    }

    public function isAdult(): bool
    {
        return $this->passenger_type === 'adult';
    }

    public function isChild(): bool
    {
        return $this->passenger_type === 'child';
    }

    public function isInfant(): bool
    {
        return $this->passenger_type === 'infant';
    }
}
