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

    // Error codes
    public const ERROR_PAYMENT_FAILED = 'PAYMENT_FAILED';
    public const ERROR_SUPPLIER_ERROR = 'SUPPLIER_ERROR';
    public const ERROR_VALIDATION_FAILED = 'VALIDATION_FAILED';
    public const ERROR_SEAT_UNAVAILABLE = 'SEAT_UNAVAILABLE';
    public const ERROR_OFFER_EXPIRED = 'OFFER_EXPIRED';
    public const ERROR_BOOKING_REJECTED = 'BOOKING_REJECTED';
    public const ERROR_UNKNOWN = 'UNKNOWN_ERROR';

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
        'penalty_amount',
        'refund_reason',
        'refunded_by',
        'refunded_at',
        'error_code',
        'error_message',
        'failure_reason',
        'failed_at',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'penalty_amount' => 'decimal:2',
        'cancelled_at' => 'datetime',
        'failed_at' => 'datetime',
        'refunded_at' => 'datetime',
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

    /**
     * Get support tickets related to this booking.
     */
    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class);
    }

    /**
     * Check if booking has failed.
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed' || !empty($this->error_code);
    }

    /**
     * Mark booking as failed with error details.
     */
    public function markAsFailed(string $errorCode, string $errorMessage, ?string $failureReason = null): void
    {
        $this->update([
            'status' => 'failed',
            'error_code' => $errorCode,
            'error_message' => $errorMessage,
            'failure_reason' => $failureReason,
            'failed_at' => now(),
        ]);
    }

    /**
     * Get user-friendly error message.
     */
    public function getErrorDisplayMessage(): ?string
    {
        if (!$this->error_code) {
            return null;
        }

        return match ($this->error_code) {
            self::ERROR_PAYMENT_FAILED => 'Payment could not be processed. Please try again or use a different payment method.',
            self::ERROR_SUPPLIER_ERROR => 'The airline could not complete your booking. Please try again.',
            self::ERROR_VALIDATION_FAILED => 'Some booking information was invalid. Please check your details.',
            self::ERROR_SEAT_UNAVAILABLE => 'Selected seats are no longer available. Please choose different seats.',
            self::ERROR_OFFER_EXPIRED => 'This flight offer has expired. Please search for new flights.',
            self::ERROR_BOOKING_REJECTED => 'The booking was rejected by the airline.',
            default => $this->error_message ?? 'An unexpected error occurred.',
        };
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
