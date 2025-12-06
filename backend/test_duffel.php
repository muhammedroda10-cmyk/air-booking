<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\Suppliers\DuffelSupplier;
use App\DTOs\Flight\FlightSearchRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Config;

// Ensure config is set for testing
Config::set('suppliers.suppliers.duffel', [
    'driver' => 'duffel',
    'base_url' => env('DUFFEL_API_URL', 'https://api.duffel.com'),
    'api_key' => env('DUFFEL_ACCESS_TOKEN'),
    'timeout' => 30,
    'retry_times' => 1,
]);

$supplier = new DuffelSupplier(config('suppliers.suppliers.duffel'));

echo "Testing Duffel Connection...\n";
$connection = $supplier->testConnection();
print_r($connection);

if (!$connection['success']) {
    echo "\nConnection failed. Please check DUFFEL_ACCESS_TOKEN in .env\n";
    // We don't exit here to allow checking the search object construction even if auth fails
}

echo "\nTesting Flight Search (LHR -> JFK)...\n";

$request = new FlightSearchRequest(
    originCode: 'LHR',
    destinationCode: 'JFK',
    departureDate: Carbon::now()->addDays(30),
    adults: 1
);

try {
    // Just print the request for now if connection failed, or try search if it succeeded
    if ($connection['success']) {
        $results = $supplier->search($request);
        echo "Found " . $results->count() . " offers.\n";

        if ($results->isNotEmpty()) {
            $first = $results->first();
            echo "First offer:\n";
            echo "Airline: " . $first->validatingAirline->name . "\n";
            echo "Price: " . $first->price->currencySymbol . number_format($first->price->total, 2) . "\n";
            echo "Details:\n";
            print_r($first->getSummary());
        }
    } else {
        echo "Skipping search due to connection failure.\n";
    }
} catch (\Exception $e) {
    echo "Search failed: " . $e->getMessage() . "\n";
}
