<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Supplier;
use Illuminate\Support\Facades\Http;

echo "=== Testing FlightBuffer API ===" . PHP_EOL . PHP_EOL;

$supplier = Supplier::where('code', 'flightbuffer')->first();
$apiUrl = $supplier->api_base_url;

// Check supplier config
echo "Supplier config: " . json_encode($supplier->config) . PHP_EOL . PHP_EOL;

// Use airports from the sample JSON (Damascus to Mashhad)
$payload = [
    'adults' => 1,
    'children' => 0,
    'infants' => 0,
    'cabin' => 'economy',
    'tripType' => 'oneWay',
    'searcherIdentity' => $supplier->config['searcher_identity'] ?? 'web',  // from config or default
    'legs' => [
        [
            'origin' => 'DAM',
            'destination' => 'MHD',
            'departure' => '2025-12-18',
        ],
    ],
];

echo "Payload: " . json_encode($payload, JSON_PRETTY_PRINT) . PHP_EOL . PHP_EOL;
echo "Sending POST to: " . $apiUrl . PHP_EOL . PHP_EOL;

try {
    $response = Http::timeout(60)
        ->withOptions(['verify' => false])
        ->withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])
        ->post($apiUrl, $payload);

    echo "Status: " . $response->status() . PHP_EOL;

    $body = $response->json();
    if (isset($body['status']) && $body['status']) {
        echo "SUCCESS! Found " . count($body['data'] ?? []) . " flights" . PHP_EOL . PHP_EOL;
        if (!empty($body['data'])) {
            $first = $body['data'][0];
            echo "First flight:" . PHP_EOL;
            echo "  Reference: " . ($first['flightBufferReferenceId'] ?? 'N/A') . PHP_EOL;
            echo "  Price: " . ($first['priceInfo']['payable'] ?? 'N/A') . " " . ($first['priceInfo']['currency']['abb'] ?? '') . PHP_EOL;
            echo "  Airline: " . ($first['serviceInfo']['validatingAirline']['en'] ?? 'N/A') . PHP_EOL;
        }
    } else {
        echo "Response: " . json_encode($body, JSON_PRETTY_PRINT) . PHP_EOL;
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
