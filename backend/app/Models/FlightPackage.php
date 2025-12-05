<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FlightPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'flight_id',
        'name',
        'display_name',
        'baggage_allowance',
        'cabin_baggage',
        'meals_included',
        'extra_legroom',
        'priority_boarding',
        'lounge_access',
        'flexible_rebooking',
        'price_modifier',
        'description',
    ];

    protected $casts = [
        'meals_included' => 'boolean',
        'extra_legroom' => 'boolean',
        'priority_boarding' => 'boolean',
        'lounge_access' => 'boolean',
        'flexible_rebooking' => 'boolean',
        'price_modifier' => 'decimal:2',
    ];

    public function flight()
    {
        return $this->belongsTo(Flight::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Get the total price (base flight price + package modifier)
     */
    public function getTotalPriceAttribute()
    {
        return $this->flight->base_price + $this->price_modifier;
    }

    /**
     * Get formatted features as array
     */
    public function getFeaturesAttribute()
    {
        $features = [];
        
        $features[] = [
            'icon' => 'luggage',
            'label' => "Checked Baggage: {$this->baggage_allowance}kg",
            'included' => true
        ];
        
        $features[] = [
            'icon' => 'briefcase',
            'label' => "Cabin Bag: {$this->cabin_baggage}kg",
            'included' => true
        ];
        
        $features[] = [
            'icon' => 'utensils',
            'label' => 'Meals Included',
            'included' => $this->meals_included
        ];
        
        $features[] = [
            'icon' => 'armchair',
            'label' => 'Extra Legroom',
            'included' => $this->extra_legroom
        ];
        
        $features[] = [
            'icon' => 'crown',
            'label' => 'Priority Boarding',
            'included' => $this->priority_boarding
        ];
        
        $features[] = [
            'icon' => 'coffee',
            'label' => 'Lounge Access',
            'included' => $this->lounge_access
        ];
        
        $features[] = [
            'icon' => 'refresh',
            'label' => 'Flexible Rebooking',
            'included' => $this->flexible_rebooking
        ];
        
        return $features;
    }
}
