<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'flight_id',
        'external_offer_id',
        'external_order_id',
        'supplier_code',
        'external_booking_data',
        'total_price',
        'currency',
        'status',
        'payment_status',
        'pnr',
        'source',
        'cancelled_at',
        'cancellation_reason',
        'refund_amount',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'cancelled_at' => 'datetime',
        'external_booking_data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function flight(): BelongsTo
    {
        return $this->belongsTo(Flight::class);
    }

    /**
     * Get the flight details (either local or external).
     */
    public function getFlightDetailsAttribute()
    {
        if ($this->flight_id && $this->flight) {
            return $this->flight->load('airline', 'originAirport', 'destinationAirport');
        }

        // For external flights, return the stored snapshot
        return $this->external_booking_data['flight'] ?? null;
    }

    /**
     * Check if this is an external booking.
     */
    public function isExternal(): bool
    {
        return empty($this->flight_id) && !empty($this->supplier_code);
    }

    public function passengers(): HasMany
    {
        return $this->hasMany(Passenger::class);
    }

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function promoCodeUsage(): HasOne
    {
        return $this->hasOne(PromoCodeUsage::class);
    }

    public function addons(): HasMany
    {
        return $this->hasMany(BookingAddon::class);
    }

    // Calculate refund based on airline cancellation policy
    public function calculateRefund(): array
    {
        // For external bookings, return basic refund info
        if ($this->isExternal()) {
            return [
                'refund_percentage' => 0,
                'refund_amount' => 0,
                'cancellation_fee' => $this->total_price,
                'message' => 'External bookings must be cancelled through the airline directly.',
            ];
        }

        $flight = $this->flight()->with('airline')->first();
        if (!$flight || !$flight->airline) {
            return [
                'refund_percentage' => 0,
                'refund_amount' => 0,
                'cancellation_fee' => $this->total_price,
                'message' => 'Unable to calculate refund.',
            ];
        }
        $airline = $flight->airline;

        $hoursUntilDeparture = now()->diffInHours($flight->departure_time, false);

        if ($hoursUntilDeparture < 0) {
            // Flight already departed
            return [
                'refund_percentage' => 0,
                'refund_amount' => 0,
                'cancellation_fee' => $this->total_price,
                'message' => 'Cannot cancel a flight that has already departed.',
            ];
        }

        $refundPercentage = 0;
        $message = '';

        if ($hoursUntilDeparture >= $airline->cancel_full_refund_hours) {
            $refundPercentage = 100;
            $message = 'Full refund available (more than ' . ($airline->cancel_full_refund_hours / 24) . ' days before departure).';
        } elseif ($hoursUntilDeparture >= $airline->cancel_75_refund_hours) {
            $refundPercentage = 75;
            $message = '75% refund available (' . ($airline->cancel_75_refund_hours / 24) . '-' . ($airline->cancel_full_refund_hours / 24) . ' days before departure).';
        } elseif ($hoursUntilDeparture >= $airline->cancel_50_refund_hours) {
            $refundPercentage = 50;
            $message = '50% refund available (' . ($airline->cancel_50_refund_hours / 24) . '-' . ($airline->cancel_75_refund_hours / 24) . ' days before departure).';
        } else {
            $refundPercentage = 0;
            $message = 'No refund available (less than ' . ($airline->cancel_50_refund_hours / 24) . ' day before departure).';
        }

        $refundAmount = ($this->total_price * $refundPercentage / 100) - $airline->cancellation_fee;
        $refundAmount = max(0, $refundAmount);

        return [
            'refund_percentage' => $refundPercentage,
            'refund_amount' => round($refundAmount, 2),
            'cancellation_fee' => $airline->cancellation_fee,
            'hours_until_departure' => $hoursUntilDeparture,
            'message' => $message,
        ];
    }

    public function canBeCancelled(): bool
    {
        if (!in_array($this->status, ['pending', 'confirmed'])) {
            return false;
        }

        // For external bookings, check from external_booking_data
        if ($this->isExternal()) {
            $departureTime = $this->external_booking_data['flight']['departure_time'] ?? null;
            if ($departureTime) {
                return \Carbon\Carbon::parse($departureTime) > now();
            }
            return false; // Cannot determine, so don't allow cancellation
        }

        return $this->flight && $this->flight->departure_time > now();
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'confirmed']);
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }
}
