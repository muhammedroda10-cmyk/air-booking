<?php
$file = 'storage/logs/laravel.log';
$content = file_get_contents($file);
// Get last 4096 bytes
$offset = max(0, strlen($content) - 8192);
$lastChunk = substr($content, $offset);

$lines = explode("\n", $lastChunk);
foreach ($lines as $line) {
    if (strpos($line, 'local.ERROR') !== false || strpos($line, 'Booking confirmation failed') !== false) {
        echo substr($line, 0, 300) . "\n";
    }
}
