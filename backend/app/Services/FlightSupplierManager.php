<?php

namespace App\Services;

use App\Contracts\FlightSupplierInterface;
use App\Models\Supplier;
use App\Services\Suppliers\FlightBufferSupplier;
use InvalidArgumentException;

class FlightSupplierManager
{
    /**
     * Registered supplier resolvers.
     */
    protected array $resolvers = [];

    /**
     * Resolved supplier instances.
     */
    protected array $instances = [];

    /**
     * Available driver classes.
     */
    protected array $drivers = [
        'flightbuffer' => FlightBufferSupplier::class,
        // Add more drivers here as they are implemented
        // 'amadeus' => AmadeusSupplier::class,
        // 'sabre' => SabreSupplier::class,
    ];

    /**
     * Get a supplier instance by name.
     */
    public function driver(string $name): FlightSupplierInterface
    {
        if (isset($this->instances[$name])) {
            return $this->instances[$name];
        }

        return $this->instances[$name] = $this->resolve($name);
    }

    /**
     * Resolve a supplier instance.
     */
    protected function resolve(string $name): FlightSupplierInterface
    {
        // Check for custom resolver
        if (isset($this->resolvers[$name])) {
            return call_user_func($this->resolvers[$name]);
        }

        // Try to load from database
        $supplier = Supplier::where('code', $name)->first();

        // Get config from file
        $config = config("suppliers.suppliers.{$name}", []);

        // Determine driver
        $driverName = $supplier?->driver ?? $config['driver'] ?? $name;

        if (!isset($this->drivers[$driverName])) {
            throw new InvalidArgumentException(
                "Unsupported flight supplier driver: {$driverName}"
            );
        }

        $driverClass = $this->drivers[$driverName];

        return new $driverClass($config, $supplier);
    }

    /**
     * Get all active suppliers.
     */
    public function getActiveSuppliers(): array
    {
        $suppliers = [];

        // Get suppliers from database
        $dbSuppliers = Supplier::active()->healthy()->byPriority()->get();

        foreach ($dbSuppliers as $supplier) {
            try {
                $suppliers[] = $this->driver($supplier->code);
            } catch (\Exception $e) {
                // Log and skip unavailable suppliers
                \Log::warning("Could not load supplier: {$supplier->code}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // If no DB suppliers, fall back to config
        if (empty($suppliers)) {
            foreach (config('suppliers.suppliers', []) as $name => $config) {
                try {
                    $driver = $this->driver($name);
                    if ($driver->isAvailable()) {
                        $suppliers[] = $driver;
                    }
                } catch (\Exception $e) {
                    \Log::warning("Could not load supplier from config: {$name}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        return $suppliers;
    }

    /**
     * Register a custom supplier resolver.
     */
    public function extend(string $name, callable $resolver): void
    {
        $this->resolvers[$name] = $resolver;
    }

    /**
     * Register a driver class.
     */
    public function registerDriver(string $name, string $class): void
    {
        $this->drivers[$name] = $class;
    }

    /**
     * Get the default supplier.
     */
    public function getDefaultSupplier(): FlightSupplierInterface
    {
        $default = config('suppliers.default', 'flightbuffer');
        return $this->driver($default);
    }

    /**
     * Clear resolved instances (useful for testing).
     */
    public function clearInstances(): void
    {
        $this->instances = [];
    }

    /**
     * Get available driver names.
     */
    public function getAvailableDrivers(): array
    {
        return array_keys($this->drivers);
    }
}
