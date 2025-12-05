<?php

namespace App\Contracts;

use App\DTOs\Flight\FlightSearchRequest;
use App\DTOs\Flight\NormalizedFlightOffer;
use Illuminate\Support\Collection;

interface FlightSupplierInterface
{
    /**
     * Search for flights from this supplier.
     *
     * @param FlightSearchRequest $request
     * @return Collection<NormalizedFlightOffer>
     */
    public function search(FlightSearchRequest $request): Collection;

    /**
     * Get detailed offer information.
     *
     * @param string $offerId The supplier's reference ID
     * @return NormalizedFlightOffer|null
     */
    public function getOfferDetails(string $offerId): ?NormalizedFlightOffer;

    /**
     * Check if the supplier is available/healthy.
     *
     * @return bool
     */
    public function isAvailable(): bool;

    /**
     * Get the unique supplier code.
     *
     * @return string
     */
    public function getSupplierCode(): string;

    /**
     * Get the supplier's display name.
     *
     * @return string
     */
    public function getName(): string;

    /**
     * Test the connection to the supplier API.
     *
     * @return array{success: bool, message: string, latency_ms?: int}
     */
    public function testConnection(): array;
}
