<?php

namespace Database\Seeders;

use App\Models\Addon;
use App\Models\Airline;
use Illuminate\Database\Seeder;

class AddonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Global Addons (no airline_id)
        Addon::create([
            'type' => 'insurance',
            'name' => 'Travel Insurance',
            'description' => 'Comprehensive travel insurance covering medical, cancellations, and lost luggage.',
            'price' => 49.99,
            'currency' => 'USD',
            'is_active' => true,
        ]);

        Addon::create([
            'type' => 'insurance',
            'name' => 'Flight Cancellation Protection',
            'description' => 'Get a full refund if you need to cancel for any reason up to 24h before departure.',
            'price' => 29.99,
            'currency' => 'USD',
            'is_active' => true,
        ]);

        // Specific Airline Addons
        $airline = Airline::first();
        if ($airline) {
            Addon::create([
                'airline_id' => $airline->id,
                'type' => 'baggage',
                'name' => 'Extra Checked Bag (23kg)',
                'description' => 'Add an extra checked bag up to 23kg.',
                'price' => 35.00,
                'currency' => 'USD',
                'is_active' => true,
            ]);

            Addon::create([
                'airline_id' => $airline->id,
                'type' => 'meal',
                'name' => 'Premium Vegetarian Meal',
                'description' => 'Gourmet vegetarian meal with appetizer and dessert.',
                'price' => 15.00,
                'currency' => 'USD',
                'is_active' => true,
            ]);
            
            Addon::create([
                'airline_id' => $airline->id,
                'type' => 'wifi',
                'name' => 'In-Flight Wi-Fi',
                'description' => 'High-speed internet access for the entire flight.',
                'price' => 12.00,
                'currency' => 'USD',
                'is_active' => true,
            ]);
        }
    }
}
