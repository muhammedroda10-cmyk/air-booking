<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Booking;

$latest = Booking::latest()->first();

if (!$latest) {
    echo "No bookings found.\n";
    exit;
}

echo "Latest Booking ID: " . $latest->id . "\n";
echo "Flight ID: " . ($latest->flight_id ?? 'NULL') . "\n";
echo "Supplier Code: " . ($latest->supplier_code ?? 'NULL') . "\n";
echo "External Offer ID: " . ($latest->external_offer_id ?? 'NULL') . "\n";
echo "Is External: " . ($latest->isExternal() ? 'YES' : 'NO') . "\n";
echo "Status: " . $latest->status . "\n";
echo "Payment Status: " . $latest->payment_status . "\n";
