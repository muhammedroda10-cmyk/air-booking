<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // FlightBuffer supplier
        Supplier::updateOrCreate(
            ['code' => 'flightbuffer'],
            [
                'name' => 'FlightBuffer',
                'driver' => 'flightbuffer',
                'api_base_url' => config('suppliers.suppliers.flightbuffer.base_url', 'https://api.flightbuffer.com'),
                'api_key' => config('suppliers.suppliers.flightbuffer.api_key'),
                'api_secret' => config('suppliers.suppliers.flightbuffer.api_secret'),
                'is_active' => true,
                'priority' => 100,
                'timeout' => 30,
                'retry_times' => 3,
                'config' => [
                    'searcher_identity' => 'default',
                    'supports_brands' => true,
                    'supports_onhold' => true,
                ],
            ]
        );

        // Add more suppliers as needed (inactive by default)
        // Supplier::updateOrCreate(
        //     ['code' => 'amadeus'],
        //     [
        //         'name' => 'Amadeus',
        //         'driver' => 'amadeus',
        //         'is_active' => false,
        //         'priority' => 90,
        //     ]
        // );
    }
}
