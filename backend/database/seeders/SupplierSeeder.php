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

        // Duffel supplier
        Supplier::updateOrCreate(
            ['code' => 'duffel'],
            [
                'name' => 'Duffel',
                'driver' => 'duffel',
                'api_base_url' => config('suppliers.suppliers.duffel.base_url', 'https://api.duffel.com'),
                'api_key' => config('suppliers.suppliers.duffel.api_key'),
                'is_active' => true,
                'priority' => 90,
                'timeout' => 30,
                'retry_times' => 2,
                'config' => [
                    'test_mode' => env('DUFFEL_TEST_MODE', true),
                    'default_cabin' => 'economy',
                ],
            ]
        );

        // Amadeus supplier
        Supplier::updateOrCreate(
            ['code' => 'amadeus'],
            [
                'name' => 'Amadeus',
                'driver' => 'amadeus',
                'api_base_url' => config('suppliers.suppliers.amadeus.base_url', 'https://test.api.amadeus.com'),
                'api_key' => config('suppliers.suppliers.amadeus.client_id'),
                'api_secret' => config('suppliers.suppliers.amadeus.client_secret'),
                'is_active' => true,
                'priority' => 85,
                'timeout' => 30,
                'retry_times' => 2,
                'config' => [
                    'test_mode' => env('AMADEUS_TEST_MODE', true),
                    'oauth2' => true,
                ],
            ]
        );

        // Database supplier (local flights from database)
        Supplier::updateOrCreate(
            ['code' => 'database'],
            [
                'name' => 'Local Database',
                'driver' => 'database',
                'api_base_url' => null,
                'api_key' => null,
                'is_active' => true,
                'priority' => 80,
                'timeout' => 10,
                'retry_times' => 0,
                'config' => [
                    'description' => 'Local flight inventory from database',
                ],
            ]
        );
    }
}
