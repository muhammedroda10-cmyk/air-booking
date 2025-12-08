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
     * Create a booking with the supplier.
     * 
     * @param NormalizedFlightOffer $offer The flight offer to book
     * @param array $passengers Array of passenger details
     * @return array{pnr: string, order_id: string, ticket_number?: string, status: string}
     */
    public function book(NormalizedFlightOffer $offer, array $passengers): array;

    /**
     * Test the connection to the supplier API.
     *
     * @return array{success: bool, message: string, latency_ms?: int}
     */
    public function testConnection(): array;

    /**
     * Get seat map for an offer (optional - not all suppliers support this).
     *
     * @param string $offerId The offer ID to get seat map for
     * @return array{success: bool, seats: array, error?: string}
     */
    public function getSeatMap(string $offerId): array;
}

