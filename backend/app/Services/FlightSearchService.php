<?php

namespace App\Services;

use App\Contracts\FlightSupplierInterface;
use App\DTOs\Flight\FlightSearchRequest;
use App\DTOs\Flight\NormalizedFlightOffer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class FlightSearchService
{
    public function __construct(
        protected FlightSupplierManager $supplierManager
    ) {}

    /**
     * Search for flights across all active suppliers.
     */
    public function search(FlightSearchRequest $request): Collection
    {
        $suppliers = $this->supplierManager->getActiveSuppliers();

        if (empty($suppliers)) {
            Log::warning('No active suppliers available for flight search');
            return collect();
        }

        $useParallel = config('suppliers.parallel_search', true);

        if ($useParallel && count($suppliers) > 1) {
            return $this->searchParallel($suppliers, $request);
        }

        return $this->searchSequential($suppliers, $request);
    }

    /**
     * Search a specific supplier.
     */
    public function searchSupplier(string $supplierCode, FlightSearchRequest $request): Collection
    {
        try {
            $supplier = $this->supplierManager->driver($supplierCode);
            return $supplier->search($request);
        } catch (\Exception $e) {
            Log::error("Failed to search supplier: {$supplierCode}", [
                'error' => $e->getMessage(),
            ]);
            return collect();
        }
    }

    /**
     * Search suppliers sequentially.
     */
    protected function searchSequential(array $suppliers, FlightSearchRequest $request): Collection
    {
        $allResults = collect();

        foreach ($suppliers as $supplier) {
            try {
                $results = $supplier->search($request);
                $allResults = $allResults->merge($results);
            } catch (\Exception $e) {
                Log::error("Supplier search failed: {$supplier->getSupplierCode()}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $this->processResults($allResults);
    }

    /**
     * Search suppliers in parallel using concurrent HTTP requests.
     */
    protected function searchParallel(array $suppliers, FlightSearchRequest $request): Collection
    {
        // For true parallelism, you would use something like Guzzle async
        // or Laravel's concurrent HTTP feature. For now, we use sequential
        // but the structure is ready for parallel implementation.
        
        // TODO: Implement actual parallel requests with:
        // - Guzzle async
        // - Laravel HTTP pool
        // - ReactPHP or Amp for async

        return $this->searchSequential($suppliers, $request);
    }

    /**
     * Process and merge results from multiple suppliers.
     */
    protected function processResults(Collection $results): Collection
    {
        $mergeConfig = config('suppliers.merge', []);

        // Deduplicate if enabled
        if ($mergeConfig['deduplicate'] ?? true) {
            $results = $this->deduplicateResults($results);
        }

        // Sort results
        $sortBy = $mergeConfig['sort_by'] ?? 'price';
        $sortDirection = $mergeConfig['sort_direction'] ?? 'asc';
        $results = $this->sortResults($results, $sortBy, $sortDirection);

        // Limit results
        $maxResults = $mergeConfig['max_results'] ?? 100;
        if ($results->count() > $maxResults) {
            $results = $results->take($maxResults);
        }

        return $results;
    }

    /**
     * Remove duplicate flights (same route, time, airline).
     */
    protected function deduplicateResults(Collection $results): Collection
    {
        return $results->unique(function (NormalizedFlightOffer $offer) {
            $firstLeg = $offer->legs[0] ?? null;
            if (!$firstLeg) {
                return $offer->id;
            }

            // Create a key based on route, times, and airline
            return implode('|', [
                $firstLeg->departure->airportCode,
                $firstLeg->arrival->airportCode,
                $firstLeg->departure->dateTime?->toDateTimeString(),
                $offer->validatingAirline->code,
                $firstLeg->flightNumber ?? '',
            ]);
        });
    }

    /**
     * Sort results by specified field.
     */
    protected function sortResults(Collection $results, string $sortBy, string $direction): Collection
    {
        $sortFunc = match($sortBy) {
            'price' => fn($offer) => $offer->price->total,
            'duration' => fn($offer) => $offer->legs[0]->duration ?? 0,
            'departure' => fn($offer) => $offer->legs[0]->departure->dateTime?->timestamp ?? 0,
            'arrival' => fn($offer) => $offer->legs[0]->arrival->dateTime?->timestamp ?? 0,
            'stops' => fn($offer) => $offer->legs[0]->stops ?? 0,
            default => fn($offer) => $offer->price->total,
        };

        return $direction === 'desc'
            ? $results->sortByDesc($sortFunc)->values()
            : $results->sortBy($sortFunc)->values();
    }

    /**
     * Get offer details from the appropriate supplier.
     */
    public function getOfferDetails(string $supplierCode, string $referenceId): ?NormalizedFlightOffer
    {
        try {
            $supplier = $this->supplierManager->driver($supplierCode);
            return $supplier->getOfferDetails($referenceId);
        } catch (\Exception $e) {
            Log::error("Failed to get offer details", [
                'supplier' => $supplierCode,
                'referenceId' => $referenceId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Filter results by criteria.
     */
    public function filterResults(Collection $results, array $filters): Collection
    {
        if (isset($filters['min_price']) && $filters['min_price']) {
            $results = $results->filter(
                fn($offer) => $offer->price->total >= $filters['min_price']
            );
        }

        if (isset($filters['max_price']) && $filters['max_price']) {
            $results = $results->filter(
                fn($offer) => $offer->price->total <= $filters['max_price']
            );
        }

        if (isset($filters['airline_code']) && $filters['airline_code']) {
            $results = $results->filter(
                fn($offer) => $offer->validatingAirline->code === $filters['airline_code']
            );
        }

        if (isset($filters['max_stops']) && $filters['max_stops'] !== null) {
            $results = $results->filter(
                fn($offer) => ($offer->legs[0]->stops ?? 0) <= $filters['max_stops']
            );
        }

        if (isset($filters['refundable']) && $filters['refundable']) {
            $results = $results->filter(fn($offer) => $offer->refundable);
        }

        return $results->values();
    }
}
