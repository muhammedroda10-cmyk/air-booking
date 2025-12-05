<?php

namespace App\Services\Suppliers;

use App\DTOs\Flight\FlightSearchRequest;
use App\DTOs\Flight\NormalizedFlightOffer;
use Illuminate\Support\Collection;

class FlightBufferSupplier extends AbstractFlightSupplier
{
    /**
     * Get the supplier code.
     */
    public function getSupplierCode(): string
    {
        return 'flightbuffer';
    }

    /**
     * Search for flights.
     */
    public function search(FlightSearchRequest $request): Collection
    {
        return $this->getCachedOrFetch($request, function () use ($request) {
            try {
                $response = $this->performSearch($request);
                return $this->parseSearchResponse($response);
            } catch (\Exception $e) {
                $this->logError('Search failed', [
                    'error' => $e->getMessage(),
                    'request' => $request->toArray(),
                ]);
                $this->markUnhealthy();
                return collect();
            }
        });
    }

    /**
     * Perform the actual search API call.
     */
    protected function performSearch(FlightSearchRequest $request): array
    {
        $payload = $this->buildSearchPayload($request);

        $this->logInfo('Performing search', ['payload' => $payload]);

        $response = $this->getHttpClient()
            ->post($this->getBaseUrl(), $payload);

        if (!$response->successful()) {
            throw new \Exception('API error: ' . $response->status() . ' - ' . $response->body());
        }

        $this->markHealthy();
        return $response->json();
    }

    /**
     * Build the search payload for FlightBuffer API.
     */
    protected function buildSearchPayload(FlightSearchRequest $request): array
    {
        return [
            'adults' => $request->adults,
            'children' => $request->children,
            'infants' => $request->infants,
            'cabin' => $request->cabin,
            'tripType' => $request->tripType,
            'searcherIdentity' => $this->config['searcher_identity'] ?? 'default',
            'legs' => [
                [
                    'origin' => $request->originCode,
                    'destination' => $request->destinationCode,
                    'departure' => $request->departureDate->toDateString(),
                ],
            ],
        ];
    }

    /**
     * Parse the search response into normalized offers.
     */
    protected function parseSearchResponse(array $response): Collection
    {
        if (!($response['status'] ?? false)) {
            $this->logError('Search returned unsuccessful status', ['response' => $response]);
            return collect();
        }

        $data = $response['data'] ?? [];

        $offers = collect($data)->map(function ($item) {
            try {
                return NormalizedFlightOffer::fromFlightBufferData($item, $this->getSupplierCode());
            } catch (\Exception $e) {
                $this->logError('Failed to parse offer', [
                    'error' => $e->getMessage(),
                    'item' => $item['flightBufferReferenceId'] ?? 'unknown',
                ]);
                return null;
            }
        })->filter();

        $this->logInfo('Search completed', [
            'total_results' => count($data),
            'parsed_results' => $offers->count(),
        ]);

        return $offers;
    }

    /**
     * Get offer details by reference ID.
     */
    public function getOfferDetails(string $offerId): ?NormalizedFlightOffer
    {
        try {
            $response = $this->getHttpClient()
                ->get($this->getBaseUrl() . '/api/flights/offer/' . $offerId);

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json();

            if (!isset($data['data'])) {
                return null;
            }

            return NormalizedFlightOffer::fromFlightBufferData($data['data'], $this->getSupplierCode());
        } catch (\Exception $e) {
            $this->logError('Failed to get offer details', [
                'offerId' => $offerId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get default headers including API authentication.
     */
    protected function getDefaultHeaders(): array
    {
        $headers = parent::getDefaultHeaders();

        if (!empty($this->config['api_key'])) {
            $headers['Authorization'] = 'Bearer ' . $this->config['api_key'];
        }

        if (!empty($this->config['api_secret'])) {
            $headers['X-API-Secret'] = $this->config['api_secret'];
        }

        return $headers;
    }

    /**
     * Perform connection test.
     */
    protected function performConnectionTest(): array
    {
        try {
            // Try to reach the base URL - any response means connection works
            $response = $this->getHttpClient()
                ->get($this->getBaseUrl());

            // Any response from the server (even 500) means we successfully connected
            // The API might not have a health endpoint, so we just verify connectivity
            $status = $response->status();

            return [
                'success' => true,
                'message' => 'FlightBuffer API is reachable (HTTP ' . $status . ')',
            ];
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return [
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ];
        } catch (\Exception $e) {
            // If we get here, it might still be a connection issue
            $message = $e->getMessage();

            // Check if this is actually a successful HTTP response that threw
            if (str_contains($message, 'status code')) {
                return [
                    'success' => true,
                    'message' => 'FlightBuffer API is reachable (received response)',
                ];
            }

            return [
                'success' => false,
                'message' => 'Connection failed: ' . $message,
            ];
        }
    }

    /**
     * Parse mock/test data directly (useful for testing without API).
     */
    public function parseTestData(array $jsonData): Collection
    {
        return $this->parseSearchResponse($jsonData);
    }
}
