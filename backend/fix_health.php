<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Supplier;

$result = Supplier::where('code', 'flightbuffer')->update([
    'is_healthy' => true,
    'last_health_check' => now(),
]);

echo "Updated $result supplier(s)" . PHP_EOL;

$supplier = Supplier::where('code', 'flightbuffer')->first();
echo "FlightBuffer is_healthy: " . ($supplier->is_healthy ? 'true' : 'false') . PHP_EOL;
