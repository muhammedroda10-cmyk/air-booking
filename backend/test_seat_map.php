<?php

/**
 * Test script to debug Duffel seat map API response
 * Run with: php test_seat_map.php <offer_id>
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Get offer ID from command line or use a test ID
$offerId = $argv[1] ?? 'off_0000B12zD8ISFT371gaQbC';

echo "Testing Duffel Seat Map API\n";
echo "===========================\n\n";
echo "Offer ID: {$offerId}\n\n";

// Get the API key
$apiKey = config('suppliers.suppliers.duffel.api_key');
if (empty($apiKey)) {
    echo "ERROR: DUFFEL_API_KEY not configured in .env\n";
    exit(1);
}

echo "Using API Key: " . substr($apiKey, 0, 15) . "...\n\n";

// Make direct API call
$client = new \GuzzleHttp\Client([
    'verify' => false, // For local dev
]);

try {
    echo "Calling Duffel API...\n";

    $response = $client->get('https://api.duffel.com/air/seat_maps', [
        'headers' => [
            'Authorization' => 'Bearer ' . $apiKey,
            'Duffel-Version' => 'v2',
            'Accept' => 'application/json',
            'Accept-Encoding' => 'gzip',
        ],
        'query' => [
            'offer_id' => $offerId,
        ],
    ]);

    $statusCode = $response->getStatusCode();
    echo "Response Status: {$statusCode}\n\n";

    $body = json_decode($response->getBody()->getContents(), true);

    // Check data structure
    if (isset($body['data'])) {
        echo "Number of segments: " . count($body['data']) . "\n\n";

        foreach ($body['data'] as $segmentIndex => $seatMap) {
            echo "=== Segment {$segmentIndex} ===\n";
            echo "Segment ID: " . ($seatMap['segment_id'] ?? 'N/A') . "\n";

            if (isset($seatMap['cabins'])) {
                echo "Number of cabins: " . count($seatMap['cabins']) . "\n";

                foreach ($seatMap['cabins'] as $cabinIndex => $cabin) {
                    echo "\n  Cabin {$cabinIndex}:\n";
                    echo "    Class: " . ($cabin['cabin_class'] ?? 'N/A') . "\n";
                    echo "    Rows: " . (isset($cabin['rows']) ? count($cabin['rows']) : 0) . "\n";

                    // Check first row structure
                    if (!empty($cabin['rows'])) {
                        $firstRow = $cabin['rows'][0];
                        echo "    First row sections: " . (isset($firstRow['sections']) ? count($firstRow['sections']) : 0) . "\n";

                        if (!empty($firstRow['sections'])) {
                            $firstSection = $firstRow['sections'][0];
                            echo "    First section elements: " . (isset($firstSection['elements']) ? count($firstSection['elements']) : 0) . "\n";

                            // Show first element structure
                            if (!empty($firstSection['elements'])) {
                                echo "\n    Sample element structure:\n";
                                echo "    " . json_encode($firstSection['elements'][0], JSON_PRETTY_PRINT) . "\n";
                            }
                        }
                    }
                }
            } else {
                echo "No cabins found in seat map!\n";
                echo "Keys in seatMap: " . implode(', ', array_keys($seatMap)) . "\n";
            }
        }
    } else {
        echo "No 'data' key in response!\n";
        echo "Response keys: " . implode(', ', array_keys($body)) . "\n";
        echo "\nFull response:\n";
        echo json_encode($body, JSON_PRETTY_PRINT) . "\n";
    }

} catch (\GuzzleHttp\Exception\ClientException $e) {
    $response = $e->getResponse();
    $body = json_decode($response->getBody()->getContents(), true);
    echo "API Error ({$response->getStatusCode()}):\n";
    echo json_encode($body, JSON_PRETTY_PRINT) . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
