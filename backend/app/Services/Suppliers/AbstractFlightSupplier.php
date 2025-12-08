<?php

namespace App\Services\Suppliers;

use App\Contracts\FlightSupplierInterface;
use App\DTOs\Flight\FlightSearchRequest;
use App\DTOs\Flight\NormalizedFlightOffer;
use App\Models\Supplier;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

abstract class AbstractFlightSupplier implements FlightSupplierInterface
{
    protected ?Supplier $supplier = null;
    protected array $config = [];

    public function __construct(array $config = [], ?Supplier $supplier = null)
    {
        $this->config = $config;
        $this->supplier = $supplier;

        // Merge database config with file config
        if ($supplier) {
            $this->config = array_merge($config, [
                'base_url' => $supplier->api_base_url ?? $config['base_url'] ?? '',
                'api_key' => $supplier->api_key ?? $config['api_key'] ?? '',
                'api_secret' => $supplier->api_secret ?? $config['api_secret'] ?? '',
                'timeout' => $supplier->timeout ?? $config['timeout'] ?? 30,
                'retry_times' => $supplier->retry_times ?? $config['retry_times'] ?? 3,
            ], $supplier->config ?? []);
        }
    }

    /**
     * Get HTTP client with configured settings.
     */
    protected function getHttpClient()
    {
        $client = Http::timeout($this->config['timeout'] ?? 30)
            ->retry(
                $this->config['retry_times'] ?? 3,
                $this->config['retry_delay'] ?? 100
            )
            ->withHeaders($this->getDefaultHeaders());

        // Disable SSL verification in local/development environment
        // This is needed for Windows/Laragon setups that have certificate issues
        if (app()->environment('local', 'development')) {
            $client = $client->withOptions([
                'verify' => false,
            ]);
        }

        return $client;
    }

    /**
     * Get default headers for API requests.
     */
    protected function getDefaultHeaders(): array
    {
        return [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }

    /**
     * Get base URL for API requests.
     */
    protected function getBaseUrl(): string
    {
        return rtrim($this->config['base_url'] ?? '', '/');
    }

    /**
     * Get cached search results or fetch new ones.
     */
    protected function getCachedOrFetch(FlightSearchRequest $request, callable $fetcher): Collection
    {
        $cacheConfig = config('suppliers.cache');

        if (!($cacheConfig['enabled'] ?? false)) {
            return $fetcher();
        }

        $cacheKey = $this->buildCacheKey($request);
        $ttl = ($cacheConfig['ttl'] ?? 5) * 60; // Convert minutes to seconds

        return Cache::remember($cacheKey, $ttl, $fetcher);
    }

    /**
     * Build cache key for search request.
     */
    protected function buildCacheKey(FlightSearchRequest $request): string
    {
        $prefix = config('suppliers.cache.prefix', 'flight_search_');

        $key = implode('_', [
            $this->getSupplierCode(),
            $request->originCode,
            $request->destinationCode,
            $request->departureDate->toDateString(),
            $request->returnDate?->toDateString() ?? 'null',
            $request->adults,
            $request->children,
            $request->infants,
            $request->cabin,
        ]);

        return $prefix . md5($key);
    }

    /**
     * Log an error with context.
     */
    protected function logError(string $message, array $context = []): void
    {
        Log::error("[{$this->getSupplierCode()}] {$message}", array_merge([
            'supplier' => $this->getSupplierCode(),
        ], $context));
    }

    /**
     * Log info with context.
     */
    protected function logInfo(string $message, array $context = []): void
    {
        Log::info("[{$this->getSupplierCode()}] {$message}", array_merge([
            'supplier' => $this->getSupplierCode(),
        ], $context));
    }

    /**
     * Log warning with context.
     */
    protected function logWarning(string $message, array $context = []): void
    {
        Log::warning("[{$this->getSupplierCode()}] {$message}", array_merge([
            'supplier' => $this->getSupplierCode(),
        ], $context));
    }

    /**
     * Mark supplier as unhealthy if we have a database record.
     */
    protected function markUnhealthy(): void
    {
        if ($this->supplier) {
            $this->supplier->markUnhealthy();
        }
    }

    /**
     * Mark supplier as healthy if we have a database record.
     */
    protected function markHealthy(): void
    {
        if ($this->supplier) {
            $this->supplier->markHealthy();
        }
    }

    /**
     * Check if supplier is available.
     */
    public function isAvailable(): bool
    {
        if ($this->supplier) {
            return $this->supplier->is_active && $this->supplier->is_healthy;
        }

        return true;
    }

    /**
     * Get supplier display name.
     */
    public function getName(): string
    {
        return $this->supplier?->name ?? ucfirst($this->getSupplierCode());
    }

    /**
     * Create a booking with the supplier.
     */
    public function book(NormalizedFlightOffer $offer, array $passengers): array
    {
        throw new \BadMethodCallException('Booking is not implemented for this supplier (' . $this->getSupplierCode() . ').');
    }

    /**
     * Test connection to supplier API.
     */
    public function testConnection(): array
    {
        $start = microtime(true);

        try {
            $result = $this->performConnectionTest();
            $latency = (int) ((microtime(true) - $start) * 1000);

            if ($result['success']) {
                $this->markHealthy();
            } else {
                $this->markUnhealthy();
            }

            return array_merge($result, ['latency_ms' => $latency]);
        } catch (\Exception $e) {
            $this->markUnhealthy();
            return [
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
                'latency_ms' => (int) ((microtime(true) - $start) * 1000),
            ];
        }
    }

    /**
     * Perform the actual connection test. Override in child classes.
     */
    protected function performConnectionTest(): array
    {
        // Default implementation - try to reach base URL
        try {
            $response = $this->getHttpClient()->get($this->getBaseUrl());
            return [
                'success' => $response->successful(),
                'message' => $response->successful() ? 'Connection successful' : 'API returned error',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get seat map for an offer. Override in suppliers that support seat selection.
     */
    public function getSeatMap(string $offerId): array
    {
        return [
            'success' => false,
            'error' => 'Seat selection is not supported by this supplier (' . $this->getSupplierCode() . ')',
            'seats' => [],
        ];
    }
}

