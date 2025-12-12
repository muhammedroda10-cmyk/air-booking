<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HotelBooking extends Model
{
    protected $fillable = ['uuid', 'user_id', 'hotel_id', 'room_id', 'check_in', 'check_out', 'total_price', 'status'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($booking) {
            if (empty($booking->uuid)) {
                // Generate sequential hotel booking number
                $lastBooking = static::orderBy('id', 'desc')->first();
                $nextNumber = $lastBooking ? $lastBooking->id + 1 : 1;
                $booking->uuid = 'HB-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }
}
