<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    use HasFactory;
    protected $fillable = [
        'airline_id',
        'flight_number',
        'origin_airport_id',
        'destination_airport_id',
        'departure_time',
        'arrival_time',
        'aircraft_type',
        'cabin_class',
        'base_price',
        'default_baggage',
        'default_cabin_baggage'
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'default_baggage' => 'integer',
        'default_cabin_baggage' => 'integer',
    ];

    public function airline()
    {
        return $this->belongsTo(Airline::class);
    }

    public function originAirport()
    {
        return $this->belongsTo(Airport::class, 'origin_airport_id');
    }

    public function destinationAirport()
    {
        return $this->belongsTo(Airport::class, 'destination_airport_id');
    }

    public function seats()
    {
        return $this->hasMany(Seat::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function packages()
    {
        return $this->hasMany(FlightPackage::class);
    }

    /**
     * Get the cheapest package for this flight
     */
    public function getCheapestPackageAttribute()
    {
        return $this->packages()->orderBy('price_modifier', 'asc')->first();
    }
}
