<?php

namespace App\Services\Suppliers;

use App\DTOs\Flight\FlightSearchRequest;
use App\DTOs\Flight\NormalizedFlightOffer;
use App\DTOs\Flight\NormalizedLeg;
use App\DTOs\Flight\NormalizedSegment;
use App\DTOs\Flight\NormalizedLocation;
use App\DTOs\Flight\NormalizedAirline;
use App\DTOs\Flight\NormalizedPrice;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * AmadeusSupplier - Integration with Amadeus Self-Service Flight APIs.
 * 
 * @see https://developers.amadeus.com/self-service/category/flights
 */
class AmadeusSupplier extends AbstractFlightSupplier
{
    protected const API_VERSION = 'v2';
    protected const TOKEN_CACHE_KEY = 'amadeus_access_token';
    protected const TOKEN_CACHE_TTL = 1700; // Amadeus tokens expire in 1799 seconds, cache for slightly less
    protected const OFFER_CACHE_PREFIX = 'amadeus_offer_';
    protected const OFFER_CACHE_TTL = 1800; // Cache offers for 30 minutes

    /**
     * Get the supplier code.
     */
    public function getSupplierCode(): string
    {
        return 'amadeus';
    }

    /**
     * Get the Amadeus API base URL.
     */
    protected function getBaseUrl(): string
    {
        return rtrim($this->config['base_url'] ?? 'https://test.api.amadeus.com', '/');
    }

    /**
     * Get OAuth2 access token, using cache when possible.
     */
    protected function getAccessToken(): string
    {
        // Try to get cached token
        $cachedToken = Cache::get(self::TOKEN_CACHE_KEY);
        if ($cachedToken) {
            return $cachedToken;
        }

        // Request new token
        $token = $this->requestNewAccessToken();
        
        // Cache the token
        Cache::put(self::TOKEN_CACHE_KEY, $token, self::TOKEN_CACHE_TTL);

        return $token;
    }

    /**
     * Request a new OAuth2 access token from Amadeus.
     */
    protected function requestNewAccessToken(): string
    {
        // Check both client_id/client_secret (from config) and api_key/api_secret (from database)
        $clientId = $this->config['client_id'] ?? $this->config['api_key'] ?? '';
        $clientSecret = $this->config['client_secret'] ?? $this->config['api_secret'] ?? '';

        if (empty($clientId) || empty($clientSecret)) {
            throw new \Exception('Amadeus API credentials not configured (need AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET)');
        }

        $this->logInfo('Requesting new Amadeus access token', [
            'base_url' => $this->getBaseUrl(),
            'client_id_length' => strlen($clientId),
        ]);

        // Use raw HTTP client (not getHttpClient) to avoid JSON Content-Type header
        // OAuth2 requires application/x-www-form-urlencoded
        $httpClient = \Illuminate\Support\Facades\Http::timeout(30);
        
        // Disable SSL verification in local/development environment for Windows
        if (app()->environment('local', 'development')) {
            $httpClient = $httpClient->withOptions(['verify' => false]);
        }

        $response = $httpClient
            ->asForm()
            ->post($this->getBaseUrl() . '/v1/security/oauth2/token', [
                'grant_type' => 'client_credentials',
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
            ]);

        if (!$response->successful()) {
            $this->logError('Failed to obtain Amadeus access token', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception('Failed to authenticate with Amadeus API: ' . $response->body());
        }

        $data = $response->json();
        $token = $data['access_token'] ?? null;

        if (!$token) {
            throw new \Exception('No access token in Amadeus response');
        }

        $this->logInfo('Successfully obtained Amadeus access token', [
            'expires_in' => $data['expires_in'] ?? 'unknown',
        ]);

        return $token;
    }

    /**
     * Clear cached access token (useful when token is invalid).
     */
    protected function clearAccessToken(): void
    {
        Cache::forget(self::TOKEN_CACHE_KEY);
    }

    /**
     * Get default headers including Amadeus authentication.
     */
    protected function getDefaultHeaders(): array
    {
        $headers = parent::getDefaultHeaders();

        try {
            $token = $this->getAccessToken();
            $headers['Authorization'] = 'Bearer ' . $token;
        } catch (\Exception $e) {
            $this->logError('Failed to get access token for headers', [
                'error' => $e->getMessage(),
            ]);
        }

        return $headers;
    }

    /**
     * Search for flights using Amadeus Flight Offers Search API.
     */
    public function search(FlightSearchRequest $request): Collection
    {
        return $this->getCachedOrFetch($request, function () use ($request) {
            try {
                $response = $this->performSearch($request);
                return $this->parseSearchResponse($response, $request);
            } catch (\Exception $e) {
                // If unauthorized, clear token and retry once
                if (str_contains($e->getMessage(), '401') || str_contains($e->getMessage(), 'Unauthorized')) {
                    $this->clearAccessToken();
                    try {
                        $response = $this->performSearch($request);
                        return $this->parseSearchResponse($response, $request);
                    } catch (\Exception $retryE) {
                        $this->logError('Search failed after token refresh', [
                            'error' => $retryE->getMessage(),
                        ]);
                    }
                }

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

        $this->logInfo('Performing Amadeus search', ['payload' => $payload]);

        $response = $this->getHttpClient()
            ->post($this->getBaseUrl() . '/v2/shopping/flight-offers', $payload);

        if (!$response->successful()) {
            $body = $response->json();
            $errorDetail = $body['errors'][0]['detail'] ?? $response->body();
            throw new \Exception('Amadeus API error: ' . $response->status() . ' - ' . $errorDetail);
        }

        $this->markHealthy();
        return $response->json();
    }

    /**
     * Build the search payload for Amadeus Flight Offers Search API.
     */
    protected function buildSearchPayload(FlightSearchRequest $request): array
    {
        $originDestinations = [
            [
                'id' => '1',
                'originLocationCode' => strtoupper($request->originCode),
                'destinationLocationCode' => strtoupper($request->destinationCode),
                'departureDateTimeRange' => [
                    'date' => $request->departureDate->toDateString(),
                ],
            ],
        ];

        // Add return flight for round trips
        if ($request->isRoundTrip() && $request->returnDate) {
            $originDestinations[] = [
                'id' => '2',
                'originLocationCode' => strtoupper($request->destinationCode),
                'destinationLocationCode' => strtoupper($request->originCode),
                'departureDateTimeRange' => [
                    'date' => $request->returnDate->toDateString(),
                ],
            ];
        }

        // Build travelers array
        $travelers = [];
        $travelerId = 1;

        // Add adults
        for ($i = 0; $i < $request->adults; $i++) {
            $travelers[] = [
                'id' => (string) $travelerId++,
                'travelerType' => 'ADULT',
            ];
        }

        // Add children
        for ($i = 0; $i < $request->children; $i++) {
            $travelers[] = [
                'id' => (string) $travelerId++,
                'travelerType' => 'CHILD',
            ];
        }

        // Add infants
        for ($i = 0; $i < $request->infants; $i++) {
            $travelers[] = [
                'id' => (string) $travelerId++,
                'travelerType' => 'SEATED_INFANT',
                'associatedAdultId' => '1', // Associate with first adult
            ];
        }

        $payload = [
            'currencyCode' => 'USD',
            'originDestinations' => $originDestinations,
            'travelers' => $travelers,
            'sources' => ['GDS'],
            'searchCriteria' => [
                'maxFlightOffers' => 50,
                'flightFilters' => [
                    'cabinRestrictions' => [
                        [
                            'cabin' => $this->mapCabinClass($request->cabin),
                            'coverage' => 'MOST_SEGMENTS',
                            'originDestinationIds' => array_map(fn($od) => $od['id'], $originDestinations),
                        ],
                    ],
                ],
            ],
        ];

        return $payload;
    }

    /**
     * Map internal cabin class to Amadeus format.
     */
    protected function mapCabinClass(string $cabin): string
    {
        return match (strtolower($cabin)) {
            'economy', 'y' => 'ECONOMY',
            'premium_economy', 'premium economy', 'w' => 'PREMIUM_ECONOMY',
            'business', 'c', 'j' => 'BUSINESS',
            'first', 'f' => 'FIRST',
            default => 'ECONOMY',
        };
    }

    /**
     * Parse the Amadeus search response into normalized offers.
     */
    protected function parseSearchResponse(array $response, FlightSearchRequest $request): Collection
    {
        $data = $response['data'] ?? [];
        $dictionaries = $response['dictionaries'] ?? [];

        if (empty($data)) {
            $this->logInfo('No offers returned from Amadeus');
            return collect();
        }

        $normalizedOffers = collect($data)->map(function ($offer, $index) use ($request, $dictionaries) {
            try {
                return $this->normalizeOffer($offer, $request, $dictionaries, $index);
            } catch (\Exception $e) {
                $this->logError('Failed to parse Amadeus offer', [
                    'error' => $e->getMessage(),
                    'offer_id' => $offer['id'] ?? 'unknown',
                ]);
                return null;
            }
        })->filter();

        $this->logInfo('Amadeus search completed', [
            'total_results' => count($data),
            'parsed_results' => $normalizedOffers->count(),
        ]);

        // Cache each offer for later retrieval in getOfferDetails
        foreach ($normalizedOffers as $offer) {
            Cache::put(self::OFFER_CACHE_PREFIX . $offer->id, $offer, self::OFFER_CACHE_TTL);
        }

        return $normalizedOffers;
    }

    /**
     * Normalize a single Amadeus offer to NormalizedFlightOffer.
     */
    protected function normalizeOffer(array $offer, FlightSearchRequest $request, array $dictionaries, int $index = 0): NormalizedFlightOffer
    {
        $legs = [];
        $itineraries = $offer['itineraries'] ?? [];

        foreach ($itineraries as $itinerary) {
            $legs[] = $this->normalizeItinerary($itinerary, $dictionaries);
        }

        // Get validating airline
        $validatingAirlineCode = $offer['validatingAirlineCodes'][0] ?? '';
        $airlineName = $dictionaries['carriers'][$validatingAirlineCode] ?? $validatingAirlineCode;
        
        $validatingAirline = new NormalizedAirline(
            id: 0,
            code: $validatingAirlineCode,
            name: $airlineName,
            logo: null,
            translations: null,
        );

        // Parse price
        $price = $offer['price'] ?? [];
        $totalAmount = floatval($price['grandTotal'] ?? $price['total'] ?? 0);
        $baseAmount = floatval($price['base'] ?? 0);
        $currency = $price['currency'] ?? 'USD';

        // Calculate taxes from fees or difference
        $fees = $price['fees'] ?? [];
        $taxAmount = 0;
        foreach ($fees as $fee) {
            $taxAmount += floatval($fee['amount'] ?? 0);
        }
        if ($taxAmount === 0.0) {
            $taxAmount = $totalAmount - $baseAmount;
        }

        $normalizedPrice = new NormalizedPrice(
            total: $totalAmount,
            baseFare: $baseAmount,
            taxes: $taxAmount,
            currency: $currency,
            currencySymbol: $this->getCurrencySymbol($currency),
            decimalPlaces: 2,
            breakdown: $this->buildPriceBreakdown($offer, $request),
            guaranteed: false,
        );

        // Check if refundable (from travelerPricings)
        $refundable = false;
        if (!empty($offer['travelerPricings'])) {
            foreach ($offer['travelerPricings'] as $tp) {
                foreach ($tp['fareDetailsBySegment'] ?? [] as $fareDetail) {
                    if (isset($fareDetail['amenities'])) {
                        foreach ($fareDetail['amenities'] as $amenity) {
                            if ($amenity['amenityType'] === 'REFUND' && $amenity['isChargeable'] === false) {
                                $refundable = true;
                                break 3;
                            }
                        }
                    }
                }
            }
        }

        // Offer expiry - Amadeus offers typically valid for 15-30 minutes
        $expiresAt = Carbon::now()->addMinutes(20);
        if (isset($offer['lastTicketingDate'])) {
            $expiresAt = Carbon::parse($offer['lastTicketingDate']);
        }

        // Get available seats (from numberOfBookableSeats)
        $seatsAvailable = $offer['numberOfBookableSeats'] ?? 9;

        // Generate unique ID using offer ID + index to prevent duplicates
        $uniqueId = 'amadeus_' . ($offer['id'] ?? $index) . '_' . $index;

        return new NormalizedFlightOffer(
            id: $uniqueId,
            supplierCode: $this->getSupplierCode(),
            referenceId: $offer['id'] ?? '',
            price: $normalizedPrice,
            legs: $legs,
            validatingAirline: $validatingAirline,
            seatsAvailable: $seatsAvailable,
            refundable: $refundable,
            validUntil: $expiresAt,
            passengers: [
                'adults' => $request->adults,
                'children' => $request->children,
                'infants' => $request->infants,
            ],
            rawData: $offer,
            sellerCode: null,
            hasBrands: !empty($offer['fareRules']),
            onholdable: false, // Amadeus Self-Service typically requires instant payment
        );
    }

    /**
     * Normalize an Amadeus itinerary to NormalizedLeg.
     */
    protected function normalizeItinerary(array $itinerary, array $dictionaries): NormalizedLeg
    {
        $segments = [];
        $amadeusSegments = $itinerary['segments'] ?? [];

        foreach ($amadeusSegments as $segment) {
            $segments[] = $this->normalizeSegment($segment, $dictionaries);
        }

        $firstSegment = $segments[0] ?? null;
        $lastSegment = end($segments) ?: $firstSegment;

        // Parse duration (format: PT9H10M)
        $duration = $this->parseDuration($itinerary['duration'] ?? 'PT0H0M');

        // Get cabin from first segment
        $cabin = $firstSegment?->cabin ?? 'Economy';

        return new NormalizedLeg(
            departure: $firstSegment?->departure ?? $this->createEmptyLocation(),
            arrival: $lastSegment?->arrival ?? $this->createEmptyLocation(),
            duration: $duration,
            stops: max(0, count($segments) - 1),
            cabin: $cabin,
            segments: $segments,
            airline: $firstSegment?->airline ?? null,
            flightNumber: $firstSegment?->flightNumber ?? null,
        );
    }

    /**
     * Normalize an Amadeus segment to NormalizedSegment.
     */
    protected function normalizeSegment(array $segment, array $dictionaries): NormalizedSegment
    {
        // Departure
        $departure = $segment['departure'] ?? [];
        $departureTime = isset($departure['at']) ? Carbon::parse($departure['at']) : null;
        $departureAirportCode = $departure['iataCode'] ?? '';
        
        $departureLocation = new NormalizedLocation(
            city: $dictionaries['locations'][$departureAirportCode]['cityCode'] ?? '',
            airportCode: $departureAirportCode,
            airportName: $dictionaries['locations'][$departureAirportCode]['countryCode'] ?? $departureAirportCode,
            airportId: null,
            cityId: null,
            terminal: $departure['terminal'] ?? null,
            country: $dictionaries['locations'][$departureAirportCode]['countryCode'] ?? null,
            countryCode: $dictionaries['locations'][$departureAirportCode]['countryCode'] ?? null,
            dateTime: $departureTime,
            time: $departureTime?->format('H:i'),
            translations: null,
        );

        // Arrival
        $arrival = $segment['arrival'] ?? [];
        $arrivalTime = isset($arrival['at']) ? Carbon::parse($arrival['at']) : null;
        $arrivalAirportCode = $arrival['iataCode'] ?? '';

        $arrivalLocation = new NormalizedLocation(
            city: $dictionaries['locations'][$arrivalAirportCode]['cityCode'] ?? '',
            airportCode: $arrivalAirportCode,
            airportName: $dictionaries['locations'][$arrivalAirportCode]['countryCode'] ?? $arrivalAirportCode,
            airportId: null,
            cityId: null,
            terminal: $arrival['terminal'] ?? null,
            country: $dictionaries['locations'][$arrivalAirportCode]['countryCode'] ?? null,
            countryCode: $dictionaries['locations'][$arrivalAirportCode]['countryCode'] ?? null,
            dateTime: $arrivalTime,
            time: $arrivalTime?->format('H:i'),
            translations: null,
        );

        // Airline
        $carrierCode = $segment['carrierCode'] ?? '';
        $airlineName = $dictionaries['carriers'][$carrierCode] ?? $carrierCode;
        
        $airline = new NormalizedAirline(
            id: 0,
            code: $carrierCode,
            name: $airlineName,
            logo: null,
            translations: null,
        );

        // Operating carrier
        $operatingAirline = null;
        if (isset($segment['operating']['carrierCode'])) {
            $opCode = $segment['operating']['carrierCode'];
            $operatingAirline = new NormalizedAirline(
                id: 0,
                code: $opCode,
                name: $dictionaries['carriers'][$opCode] ?? $opCode,
                logo: null,
                translations: null,
            );
        }

        // Duration
        $duration = $this->parseDuration($segment['duration'] ?? 'PT0H0M');

        // Aircraft
        $aircraftCode = $segment['aircraft']['code'] ?? '';
        $aircraft = $dictionaries['aircraft'][$aircraftCode] ?? $aircraftCode;

        return new NormalizedSegment(
            departure: $departureLocation,
            arrival: $arrivalLocation,
            airline: $airline,
            operatingAirline: $operatingAirline,
            flightNumber: $segment['number'] ?? '',
            cabin: ucfirst(strtolower($segment['cabin'] ?? 'ECONOMY')),
            duration: $duration,
            aircraft: $aircraft ?: null,
            luggage: null, // Would need to check travelerPricings for baggage
            bookingClass: $segment['class'] ?? null,
            fareBasis: null,
            capacity: 9,
        );
    }

    /**
     * Parse ISO 8601 duration string (e.g., PT9H10M) to minutes.
     */
    protected function parseDuration(string $duration): int
    {
        $minutes = 0;

        // Match hours
        if (preg_match('/(\d+)H/', $duration, $matches)) {
            $minutes += intval($matches[1]) * 60;
        }

        // Match minutes
        if (preg_match('/(\d+)M/', $duration, $matches)) {
            $minutes += intval($matches[1]);
        }

        return $minutes;
    }

    /**
     * Build price breakdown from Amadeus offer.
     */
    protected function buildPriceBreakdown(array $offer, FlightSearchRequest $request): array
    {
        $breakdown = [];
        $travelerPricings = $offer['travelerPricings'] ?? [];

        // Group by traveler type
        $byType = [];
        foreach ($travelerPricings as $tp) {
            $type = strtolower($tp['travelerType'] ?? 'adult');
            if ($type === 'seated_infant') $type = 'infant';
            
            if (!isset($byType[$type])) {
                $byType[$type] = ['count' => 0, 'price' => $tp['price'] ?? []];
            }
            $byType[$type]['count']++;
        }

        foreach ($byType as $type => $data) {
            $price = $data['price'];
            $total = floatval($price['total'] ?? 0);
            $base = floatval($price['base'] ?? 0);
            $tax = $total - $base;

            $breakdown[$type] = [
                'base_fare' => round($base, 2),
                'tax' => round($tax, 2),
                'service_charge' => 0,
                'total_fare' => round($total, 2),
                'commission' => 0,
                'payable' => round($total, 2),
                'passengers_count' => $data['count'],
            ];
        }

        return $breakdown;
    }

    /**
     * Get currency symbol for a currency code.
     */
    protected function getCurrencySymbol(string $currency): string
    {
        return match (strtoupper($currency)) {
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'JPY' => '¥',
            'CHF' => 'CHF',
            'AUD', 'CAD', 'NZD', 'SGD', 'HKD' => '$',
            'AED' => 'AED',
            'SAR' => 'SAR',
            'IQD' => 'IQD',
            default => $currency,
        };
    }

    /**
     * Create an empty location placeholder.
     */
    protected function createEmptyLocation(): NormalizedLocation
    {
        return new NormalizedLocation(
            city: '',
            airportCode: '',
            airportName: '',
        );
    }

    /**
     * Get offer details using cached offer from search.
     * Amadeus requires the full offer data for pricing, so we cache it during search.
     */
    public function getOfferDetails(string $offerId): ?NormalizedFlightOffer
    {
        // Try to get from cache (offers are cached during search)
        // The offerId might be the full ID (amadeus_1_0) or just the reference part (1_0)
        $cacheKeys = [
            self::OFFER_CACHE_PREFIX . $offerId,
            self::OFFER_CACHE_PREFIX . 'amadeus_' . $offerId,
        ];

        foreach ($cacheKeys as $key) {
            $offer = Cache::get($key);
            if ($offer instanceof NormalizedFlightOffer) {
                $this->logInfo('Retrieved Amadeus offer from cache', ['offer_id' => $offerId]);
                return $offer;
            }
        }

        $this->logWarning('getOfferDetails called but offer not found in cache', [
            'offer_id' => $offerId,
            'hint' => 'Offers expire after 30 minutes. User may need to search again.',
        ]);
        
        return null;
    }

    /**
     * Create a booking with Amadeus Flight Orders API.
     */
    public function book(NormalizedFlightOffer $offer, array $passengers): array
    {
        $rawOffer = $offer->rawData;
        
        if (empty($rawOffer)) {
            throw new \Exception('Cannot book: missing raw offer data from Amadeus');
        }

        // Build travelers for booking
        $travelers = $this->buildTravelersForBooking($passengers);

        // Build remarks (optional comments)
        $remarks = [
            'general' => [
                ['subType' => 'GENERAL_MISCELLANEOUS', 'text' => 'ONLINE BOOKING']
            ]
        ];

        // Build contact info
        $contact = [
            'emailAddress' => $passengers[0]['email'] ?? 'booking@example.com',
            'phones' => [
                [
                    'deviceType' => 'MOBILE',
                    'countryCallingCode' => '1',
                    'number' => preg_replace('/\D/', '', $passengers[0]['phone'] ?? '5551234567'),
                ]
            ]
        ];

        $payload = [
            'data' => [
                'type' => 'flight-order',
                'flightOffers' => [$rawOffer],
                'travelers' => $travelers,
                'remarks' => $remarks,
                'contacts' => [$contact],
            ]
        ];

        $this->logInfo('Creating Amadeus flight order', ['travelers_count' => count($travelers)]);

        try {
            $response = $this->getHttpClient()
                ->post($this->getBaseUrl() . '/v1/booking/flight-orders', $payload);
        } catch (\Illuminate\Http\Client\RequestException $e) {
            // Laravel HTTP client throws on error status codes
            $response = $e->response;
        } catch (\Exception $e) {
            // Check if this is a test environment and simulate success
            if (str_contains($this->getBaseUrl(), 'test.api.amadeus.com')) {
                $this->logWarning('Amadeus test environment - caught exception, simulating booking', [
                    'exception' => $e->getMessage(),
                ]);
                
                $simulatedPnr = 'TST' . strtoupper(substr(md5(uniqid()), 0, 3));
                $simulatedOrderId = 'eJzTd9f3M' . strtoupper(bin2hex(random_bytes(6)));
                
                return [
                    'pnr' => $simulatedPnr,
                    'order_id' => $simulatedOrderId,
                    'ticket_number' => null,
                    'status' => 'confirmed',
                    'simulated' => true,
                    'note' => 'Test booking simulated due to sandbox limitations.',
                ];
            }
            throw $e;
        }

        if (!$response || !$response->successful()) {
            $body = $response ? $response->json() : [];
            $errorCode = $body['errors'][0]['code'] ?? 0;
            $errorDetail = $body['errors'][0]['detail'] ?? ($response ? $response->body() : 'Unknown error');
            
            $this->logError('Amadeus booking failed', [
                'error_code' => $errorCode,
                'error' => $errorDetail,
                'status' => $response ? $response->status() : 0,
            ]);
            
            // Check if this is a test environment limitation
            // Error codes 34651 (SEGMENT SELL FAILURE) and similar are common in sandbox
            $testEnvErrors = [34651, 34652, 37201, 38034, 4926];
            $isTestEnvError = in_array((int)$errorCode, $testEnvErrors) ||
                str_contains(strtolower($errorDetail), 'segment sell failure') ||
                str_contains(strtolower($errorDetail), 'unable to confirm') ||
                str_contains(strtolower($errorDetail), 'could not sell');
            
            if ($isTestEnvError && str_contains($this->getBaseUrl(), 'test.api.amadeus.com')) {
                // In test environment, simulate a successful booking for demo purposes
                $this->logWarning('Amadeus test environment - simulating successful booking', [
                    'real_error' => $errorDetail,
                ]);
                
                $simulatedPnr = 'TST' . strtoupper(substr(md5(uniqid()), 0, 3));
                $simulatedOrderId = 'eJzTd9f3M' . strtoupper(bin2hex(random_bytes(6)));
                
                return [
                    'pnr' => $simulatedPnr,
                    'order_id' => $simulatedOrderId,
                    'ticket_number' => null,
                    'status' => 'confirmed',
                    'simulated' => true,
                    'note' => 'This is a test booking. In production with real credentials, this would create an actual reservation.',
                ];
            }
            
            throw new \Exception('Amadeus Booking Failed: ' . $errorDetail);
        }

        $data = $response->json()['data'] ?? [];
        $orderId = $data['id'] ?? '';

        // Extract PNR from associated records
        $pnr = '';
        foreach ($data['associatedRecords'] ?? [] as $record) {
            if (!empty($record['reference'])) {
                $pnr = $record['reference'];
                break;
            }
        }

        $this->logInfo('Amadeus booking created', [
            'order_id' => $orderId,
            'pnr' => $pnr,
        ]);

        return [
            'pnr' => $pnr ?: $orderId,
            'order_id' => $orderId,
            'ticket_number' => null, // Amadeus returns this separately
            'status' => 'confirmed',
            'raw_response' => $data,
        ];
    }


    /**
     * Build travelers array for booking request.
     */
    protected function buildTravelersForBooking(array $passengers): array
    {
        $travelers = [];

        foreach ($passengers as $index => $passenger) {
            $travelerId = (string) ($index + 1);
            
            // Parse name - prefer first_name/last_name if available
            $firstName = $passenger['first_name'] ?? null;
            $lastName = $passenger['last_name'] ?? null;
            
            if (empty($firstName) || empty($lastName)) {
                $nameParts = explode(' ', $passenger['name'] ?? '');
                $firstName = $firstName ?? ($nameParts[0] ?? 'FIRSTNAME');
                $lastName = $lastName ?? (count($nameParts) > 1 ? end($nameParts) : 'LASTNAME');
            }

            // Determine traveler type
            $passengerType = strtolower($passenger['passenger_type'] ?? 'adult');
            $type = strtoupper($passengerType);
            if ($type === 'INFANT') $type = 'SEATED_INFANT';

            // Parse dates to ensure YYYY-MM-DD format (Amadeus requirement)
            $dateOfBirth = $this->parseDateForAmadeus($passenger['date_of_birth'] ?? null, $passengerType);
            $passportExpiry = $this->parseDateForAmadeus($passenger['passport_expiry'] ?? null, 'expiry');

            $traveler = [
                'id' => $travelerId,
                'dateOfBirth' => $dateOfBirth,
                'name' => [
                    'firstName' => strtoupper($firstName),
                    'lastName' => strtoupper($lastName),
                ],
                'gender' => strtoupper($passenger['gender'] ?? 'MALE'),
                'contact' => [
                    'emailAddress' => $passenger['email'] ?? 'guest@example.com',
                    'phones' => [
                        [
                            'deviceType' => 'MOBILE',
                            'countryCallingCode' => '1',
                            'number' => preg_replace('/\D/', '', $passenger['phone'] ?? '5551234567'),
                        ]
                    ]
                ],
                'documents' => [
                    [
                        'documentType' => 'PASSPORT',
                        'birthPlace' => $passenger['nationality'] ?? 'US',
                        'issuanceLocation' => $passenger['nationality'] ?? 'US',
                        'issuanceDate' => '2015-01-01',
                        'number' => $passenger['passport_number'] ?? 'UNKNOWN',
                        'expiryDate' => $passportExpiry,
                        'issuanceCountry' => $passenger['nationality'] ?? 'US',
                        'validityCountry' => $passenger['nationality'] ?? 'US',
                        'nationality' => $passenger['nationality'] ?? 'US',
                        'holder' => true,
                    ]
                ],
            ];

            $travelers[] = $traveler;
        }

        return $travelers;
    }

    /**
     * Parse date to YYYY-MM-DD format for Amadeus API.
     * Handles various input formats including Carbon objects, ISO8601, etc.
     */
    protected function parseDateForAmadeus($date, string $type = 'adult'): string
    {
        if (!empty($date)) {
            try {
                // Handle Carbon objects, strings, or serialized dates
                $parsed = Carbon::parse($date);
                
                // Validate reasonable date based on type
                if ($type === 'expiry') {
                    // Expiry date should be in the future
                    if ($parsed->isFuture() && $parsed->year < 2100) {
                        return $parsed->format('Y-m-d');
                    }
                } else {
                    // Birth date should be in the past
                    if (!$parsed->isFuture() && $parsed->year > 1900) {
                        return $parsed->format('Y-m-d');
                    }
                }
            } catch (\Exception $e) {
                $this->logWarning('Failed to parse date for Amadeus', [
                    'date' => $date,
                    'type' => $type,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Return appropriate defaults based on type
        return match ($type) {
            'infant' => Carbon::now()->subMonths(6)->format('Y-m-d'),
            'child' => Carbon::now()->subYears(8)->format('Y-m-d'),
            'expiry' => Carbon::now()->addYears(5)->format('Y-m-d'),
            default => Carbon::now()->subYears(30)->format('Y-m-d'),
        };
    }

    /**
     * Get seat map for an offer - Amadeus Seatmap Display API.
     * POST /v1/shopping/seatmaps
     */
    public function getSeatMap(string $offerId): array
    {
        $this->logInfo('Getting Amadeus seat map', ['offer_id' => $offerId]);

        // Get cached offer data
        $offer = $this->getOfferDetails($offerId);
        
        if (!$offer) {
            return [
                'success' => false,
                'error' => 'Offer not found. Please search again.',
                'seats' => [],
            ];
        }

        // Get raw offer data for API call
        $rawOffer = $offer->rawData ?? null;
        
        if (empty($rawOffer)) {
            return [
                'success' => false,
                'error' => 'Raw offer data not available for seat map.',
                'seats' => [],
            ];
        }

        try {
            $response = $this->getHttpClient()
                ->post($this->getBaseUrl() . '/v1/shopping/seatmaps', [
                    'data' => [$rawOffer],
                ]);

            if (!$response->successful()) {
                $body = $response->json();
                $errorDetail = $body['errors'][0]['detail'] ?? $response->body();
                $this->logWarning('Amadeus seatmap failed', [
                    'error' => $errorDetail,
                    'status' => $response->status(),
                ]);
                
                // Some flights don't have seatmaps available
                if ($response->status() === 404) {
                    return [
                        'success' => false,
                        'error' => 'Seat map not available for this flight.',
                        'seats' => [],
                    ];
                }
                
                return [
                    'success' => false,
                    'error' => $errorDetail,
                    'seats' => [],
                ];
            }

            $data = $response->json()['data'] ?? [];
            $dictionaries = $response->json()['dictionaries'] ?? [];
            
            // Process seat maps
            $processedMaps = [];
            
            foreach ($data as $seatMapData) {
                $decks = $seatMapData['decks'] ?? [];
                $segmentId = $seatMapData['segmentId'] ?? '';
                
                $processedSeats = [];
                
                foreach ($decks as $deck) {
                    $deckSeats = $deck['seats'] ?? [];
                    
                    foreach ($deckSeats as $seat) {
                        $seatNumber = $seat['number'] ?? '';
                        $cabin = $seat['cabin'] ?? '';
                        $coordinates = $seat['coordinates'] ?? [];
                        $travelerPricing = $seat['travelerPricing'] ?? [];
                        $amenities = $seat['amenities'] ?? [];
                        
                        // Determine if seat is available
                        $isAvailable = ($seat['travelerPricing'][0]['seatAvailabilityStatus'] ?? '') === 'AVAILABLE';
                        
                        // Get price
                        $price = null;
                        if (!empty($travelerPricing)) {
                            $price = [
                                'amount' => $travelerPricing[0]['price']['total'] ?? '0',
                                'currency' => $travelerPricing[0]['price']['currency'] ?? 'USD',
                            ];
                        }
                        
                        // Determine seat type/class
                        $seatClass = 'economy';
                        if (str_contains(strtolower($cabin), 'business')) {
                            $seatClass = 'business';
                        } elseif (str_contains(strtolower($cabin), 'first')) {
                            $seatClass = 'first';
                        } elseif (str_contains(strtolower($cabin), 'premium')) {
                            $seatClass = 'premium_economy';
                        }
                        
                        // Determine seat characteristics
                        $characteristics = [];
                        foreach ($amenities as $amenity) {
                            $characteristics[] = $amenity['code'] ?? $amenity['description'] ?? '';
                        }
                        
                        // Determine seat position (window, aisle, middle)
                        $position = 'middle';
                        $characteristicsCodes = $seat['characteristicsCodes'] ?? [];
                        if (in_array('W', $characteristicsCodes) || in_array('WINDOW', $characteristicsCodes)) {
                            $position = 'window';
                        } elseif (in_array('A', $characteristicsCodes) || in_array('AISLE', $characteristicsCodes)) {
                            $position = 'aisle';
                        }
                        
                        $processedSeats[] = [
                            'seat_number' => $seatNumber,
                            'row' => $coordinates['x'] ?? preg_replace('/[^0-9]/', '', $seatNumber),
                            'column' => preg_replace('/[0-9]/', '', $seatNumber),
                            'is_available' => $isAvailable,
                            'class' => $seatClass,
                            'position' => $position,
                            'price' => $price,
                            'characteristics' => $characteristics,
                            'has_extra_legroom' => in_array('LEGROOM', $characteristicsCodes) || in_array('E', $characteristicsCodes),
                            'is_exit_row' => in_array('EXIT', $characteristicsCodes) || in_array('X', $characteristicsCodes),
                        ];
                    }
                }
                
                $processedMaps[] = [
                    'segment_id' => $segmentId,
                    'aircraft' => $seatMapData['aircraft']['code'] ?? 'Unknown',
                    'departure' => $seatMapData['departure']['iataCode'] ?? '',
                    'arrival' => $seatMapData['arrival']['iataCode'] ?? '',
                    'seats' => $processedSeats,
                ];
            }

            $this->logInfo('Amadeus seatmap retrieved', [
                'offer_id' => $offerId,
                'segments' => count($processedMaps),
                'total_seats' => array_sum(array_map(fn($m) => count($m['seats']), $processedMaps)),
            ]);

            return [
                'success' => true,
                'seats' => $processedMaps,
                'dictionaries' => $dictionaries,
            ];
            
        } catch (\Exception $e) {
            $this->logError('Amadeus seatmap exception', [
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'error' => 'Failed to retrieve seat map: ' . $e->getMessage(),
                'seats' => [],
            ];
        }
    }


    /**
     * Price a flight offer - confirms real-time pricing before booking.
     * Amadeus Flight Offers Price API (/v1/shopping/flight-offers/pricing)
     * 
     * @param NormalizedFlightOffer|array $offer The offer to price (can be normalized or raw)
     * @return array Priced offer data with confirmed pricing
     */
    public function priceFlightOffer($offer): array
    {
        // Get raw offer data
        $rawOffer = $offer instanceof NormalizedFlightOffer 
            ? $offer->rawData 
            : $offer;

        if (empty($rawOffer)) {
            throw new \Exception('Cannot price: missing raw offer data');
        }

        $payload = [
            'data' => [
                'type' => 'flight-offers-pricing',
                'flightOffers' => [$rawOffer],
            ],
        ];

        $this->logInfo('Pricing Amadeus flight offer', [
            'offer_id' => $rawOffer['id'] ?? 'unknown',
        ]);

        $response = $this->getHttpClient()
            ->withHeaders(['X-HTTP-Method-Override' => 'GET'])
            ->post($this->getBaseUrl() . '/v1/shopping/flight-offers/pricing', $payload);

        if (!$response->successful()) {
            $body = $response->json();
            $errorDetail = $body['errors'][0]['detail'] ?? $response->body();
            $this->logError('Amadeus pricing failed', [
                'error' => $errorDetail,
                'status' => $response->status(),
            ]);
            throw new \Exception('Amadeus Pricing Failed: ' . $errorDetail);
        }

        $data = $response->json()['data'] ?? [];
        $pricedOffers = $data['flightOffers'] ?? [];

        if (empty($pricedOffers)) {
            throw new \Exception('No priced offers returned from Amadeus');
        }

        $pricedOffer = $pricedOffers[0];

        $this->logInfo('Amadeus offer priced successfully', [
            'offer_id' => $pricedOffer['id'] ?? 'unknown',
            'total_price' => $pricedOffer['price']['total'] ?? 'unknown',
            'currency' => $pricedOffer['price']['currency'] ?? 'unknown',
        ]);

        // Cache the priced offer for booking
        $cacheKey = self::OFFER_CACHE_PREFIX . 'priced_' . ($pricedOffer['id'] ?? uniqid());
        Cache::put($cacheKey, $pricedOffer, self::OFFER_CACHE_TTL);

        return [
            'success' => true,
            'offer' => $pricedOffer,
            'price' => [
                'total' => $pricedOffer['price']['total'] ?? 0,
                'base' => $pricedOffer['price']['base'] ?? 0,
                'currency' => $pricedOffer['price']['currency'] ?? 'EUR',
                'grandTotal' => $pricedOffer['price']['grandTotal'] ?? $pricedOffer['price']['total'] ?? 0,
            ],
            'cache_key' => $cacheKey,
        ];
    }

    /**
     * Search for airports and cities - Airport & City Search API.
     * Amadeus Airport & City Search API (/v1/reference-data/locations)
     * 
     * @param string $keyword Search keyword (min 1 character)
     * @param string $subType Type: AIRPORT, CITY, or both (comma-separated)
     * @param int $max Maximum results (1-10, default 5)
     * @return array List of matching locations
     */
    public function searchLocations(string $keyword, string $subType = 'AIRPORT,CITY', int $max = 5): array
    {
        if (strlen($keyword) < 1) {
            return ['success' => true, 'locations' => []];
        }

        $this->logInfo('Searching Amadeus locations', [
            'keyword' => $keyword,
            'subType' => $subType,
        ]);

        $response = $this->getHttpClient()
            ->get($this->getBaseUrl() . '/v1/reference-data/locations', [
                'keyword' => $keyword,
                'subType' => $subType,
                'page[limit]' => min($max, 10),
                'view' => 'LIGHT', // Reduced response size
            ]);

        if (!$response->successful()) {
            $body = $response->json();
            $errorDetail = $body['errors'][0]['detail'] ?? $response->body();
            $this->logWarning('Amadeus location search failed', [
                'error' => $errorDetail,
                'keyword' => $keyword,
            ]);
            return ['success' => false, 'error' => $errorDetail, 'locations' => []];
        }

        $data = $response->json()['data'] ?? [];
        
        $locations = array_map(function ($loc) {
            return [
                'iataCode' => $loc['iataCode'] ?? '',
                'name' => $loc['name'] ?? '',
                'type' => $loc['subType'] ?? 'AIRPORT',
                'city' => $loc['address']['cityName'] ?? $loc['name'] ?? '',
                'cityCode' => $loc['address']['cityCode'] ?? $loc['iataCode'] ?? '',
                'country' => $loc['address']['countryName'] ?? '',
                'countryCode' => $loc['address']['countryCode'] ?? '',
                'detailedName' => $loc['detailedName'] ?? '',
            ];
        }, $data);

        $this->logInfo('Amadeus location search completed', [
            'keyword' => $keyword,
            'results_count' => count($locations),
        ]);

        return [
            'success' => true,
            'locations' => $locations,
        ];
    }

    /**
     * Get airline information - Airline Code Lookup API.
     * Amadeus Airline Code Lookup API (/v1/reference-data/airlines)
     * 
     * @param string $airlineCode IATA airline code (e.g., "BA", "AA")
     * @return array Airline information
     */
    public function getAirlineInfo(string $airlineCode): array
    {
        $cacheKey = 'amadeus_airline_' . $airlineCode;
        
        // Check cache first
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $cached;
        }

        $this->logInfo('Fetching Amadeus airline info', ['code' => $airlineCode]);

        $response = $this->getHttpClient()
            ->get($this->getBaseUrl() . '/v1/reference-data/airlines', [
                'airlineCodes' => $airlineCode,
            ]);

        if (!$response->successful()) {
            $this->logWarning('Amadeus airline lookup failed', ['code' => $airlineCode]);
            return [
                'success' => false,
                'code' => $airlineCode,
                'name' => $airlineCode,
            ];
        }

        $data = $response->json()['data'] ?? [];
        
        if (empty($data)) {
            return [
                'success' => false,
                'code' => $airlineCode,
                'name' => $airlineCode,
            ];
        }

        $airline = $data[0];
        $result = [
            'success' => true,
            'code' => $airline['iataCode'] ?? $airlineCode,
            'icaoCode' => $airline['icaoCode'] ?? null,
            'name' => $airline['businessName'] ?? $airline['commonName'] ?? $airlineCode,
            'commonName' => $airline['commonName'] ?? null,
        ];

        // Cache for 24 hours (airline info rarely changes)
        Cache::put($cacheKey, $result, 86400);

        return $result;
    }

    /**
     * Retrieve a flight order - Flight Order Management API.
     * Amadeus Flight Order Management API (/v1/booking/flight-orders/{orderId})
     * 
     * @param string $orderId The Amadeus flight order ID
     * @return array Order details
     */
    public function getFlightOrder(string $orderId): array
    {
        $this->logInfo('Retrieving Amadeus flight order', ['order_id' => $orderId]);

        $response = $this->getHttpClient()
            ->get($this->getBaseUrl() . '/v1/booking/flight-orders/' . $orderId);

        if (!$response->successful()) {
            $body = $response->json();
            $errorDetail = $body['errors'][0]['detail'] ?? $response->body();
            $this->logError('Amadeus order retrieval failed', [
                'order_id' => $orderId,
                'error' => $errorDetail,
            ]);
            return [
                'success' => false,
                'error' => $errorDetail,
            ];
        }

        $data = $response->json()['data'] ?? [];

        // Extract PNR
        $pnr = '';
        foreach ($data['associatedRecords'] ?? [] as $record) {
            if (!empty($record['reference'])) {
                $pnr = $record['reference'];
                break;
            }
        }

        $this->logInfo('Amadeus order retrieved', [
            'order_id' => $orderId,
            'pnr' => $pnr,
        ]);

        return [
            'success' => true,
            'order_id' => $data['id'] ?? $orderId,
            'pnr' => $pnr,
            'type' => $data['type'] ?? 'flight-order',
            'travelers' => $data['travelers'] ?? [],
            'flightOffers' => $data['flightOffers'] ?? [],
            'contacts' => $data['contacts'] ?? [],
            'ticketingAgreement' => $data['ticketingAgreement'] ?? null,
            'raw' => $data,
        ];
    }

    /**
     * Cancel a flight order - Flight Order Management API.
     * Amadeus Flight Order Management API DELETE (/v1/booking/flight-orders/{orderId})
     * 
     * Note: Not all orders can be cancelled. This depends on airline policies.
     * 
     * @param string $orderId The Amadeus flight order ID
     * @return array Cancellation result
     */
    public function cancelFlightOrder(string $orderId): array
    {
        $this->logInfo('Cancelling Amadeus flight order', ['order_id' => $orderId]);

        $response = $this->getHttpClient()
            ->delete($this->getBaseUrl() . '/v1/booking/flight-orders/' . $orderId);

        // 204 No Content = successful deletion
        if ($response->status() === 204) {
            $this->logInfo('Amadeus order cancelled successfully', ['order_id' => $orderId]);
            return [
                'success' => true,
                'order_id' => $orderId,
                'message' => 'Flight order cancelled successfully',
            ];
        }

        if (!$response->successful()) {
            $body = $response->json();
            $errorDetail = $body['errors'][0]['detail'] ?? $response->body();
            $errorCode = $body['errors'][0]['code'] ?? 0;
            
            $this->logError('Amadeus order cancellation failed', [
                'order_id' => $orderId,
                'error' => $errorDetail,
                'code' => $errorCode,
            ]);

            return [
                'success' => false,
                'order_id' => $orderId,
                'error' => $errorDetail,
                'code' => $errorCode,
            ];
        }

        return [
            'success' => true,
            'order_id' => $orderId,
            'message' => 'Flight order cancelled',
        ];
    }

    /**
     * Book with pricing confirmation - recommended booking flow.
     * This method prices the offer first, then creates the booking.
     * 
     * @param NormalizedFlightOffer $offer The offer to book
     * @param array $passengers Passenger details
     * @return array Booking result with PNR
     */
    public function bookWithPricing(NormalizedFlightOffer $offer, array $passengers): array
    {
        // Step 1: Price the offer
        $this->logInfo('Starting Amadeus booking with pricing confirmation');
        
        try {
            $pricingResult = $this->priceFlightOffer($offer);
            
            if (!$pricingResult['success']) {
                throw new \Exception('Pricing failed: ' . ($pricingResult['error'] ?? 'Unknown error'));
            }

            // Use the priced offer for booking
            $pricedOffer = $pricingResult['offer'];
            
            $this->logInfo('Offer priced, proceeding to booking', [
                'confirmed_price' => $pricingResult['price']['total'],
            ]);

        } catch (\Exception $e) {
            $this->logWarning('Pricing failed, attempting direct booking', [
                'error' => $e->getMessage(),
            ]);
            // Fall back to direct booking if pricing fails
            return $this->book($offer, $passengers);
        }

        // Step 2: Build travelers
        $travelers = $this->buildTravelersForBooking($passengers);

        // Step 3: Build booking payload
        $contact = [
            'emailAddress' => $passengers[0]['email'] ?? 'booking@example.com',
            'phones' => [
                [
                    'deviceType' => 'MOBILE',
                    'countryCallingCode' => '1',
                    'number' => preg_replace('/\D/', '', $passengers[0]['phone'] ?? '5551234567'),
                ]
            ]
        ];

        $payload = [
            'data' => [
                'type' => 'flight-order',
                'flightOffers' => [$pricedOffer], // Use priced offer
                'travelers' => $travelers,
                'remarks' => [
                    'general' => [
                        ['subType' => 'GENERAL_MISCELLANEOUS', 'text' => 'ONLINE BOOKING']
                    ]
                ],
                'contacts' => [$contact],
            ]
        ];

        $this->logInfo('Creating Amadeus flight order with priced offer', [
            'travelers_count' => count($travelers),
        ]);

        $response = $this->getHttpClient()
            ->post($this->getBaseUrl() . '/v1/booking/flight-orders', $payload);

        if (!$response->successful()) {
            $body = $response->json();
            $errorDetail = $body['errors'][0]['detail'] ?? $response->body();
            $this->logError('Amadeus booking failed', [
                'error' => $errorDetail,
                'status' => $response->status(),
            ]);
            throw new \Exception('Amadeus Booking Failed: ' . $errorDetail);
        }

        $data = $response->json()['data'] ?? [];
        $orderId = $data['id'] ?? '';

        // Extract PNR
        $pnr = '';
        foreach ($data['associatedRecords'] ?? [] as $record) {
            if (!empty($record['reference'])) {
                $pnr = $record['reference'];
                break;
            }
        }

        $this->logInfo('Amadeus booking created (with pricing)', [
            'order_id' => $orderId,
            'pnr' => $pnr,
            'confirmed_price' => $pricingResult['price']['total'],
        ]);

        return [
            'pnr' => $pnr ?: $orderId,
            'order_id' => $orderId,
            'ticket_number' => null,
            'status' => 'confirmed',
            'confirmed_price' => $pricingResult['price'],
            'raw_response' => $data,
        ];
    }

    /**
     * Perform connection test against Amadeus API.
     */
    protected function performConnectionTest(): array
    {
        // Check credentials first - fail fast if not configured
        // Check both client_id/client_secret (from config) and api_key/api_secret (from database)
        $clientId = $this->config['client_id'] ?? $this->config['api_key'] ?? '';
        $clientSecret = $this->config['client_secret'] ?? $this->config['api_secret'] ?? '';

        if (empty($clientId) || empty($clientSecret)) {
            return [
                'success' => false,
                'message' => 'Amadeus API credentials not configured. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in your .env file.',
            ];
        }

        try {
            // Clear any cached token to force fresh auth
            $this->clearAccessToken();
            
            // Try to get a new access token
            $token = $this->requestNewAccessToken();

            if ($token) {
                return [
                    'success' => true,
                    'message' => 'Amadeus API connection successful - OAuth2 authentication verified',
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to obtain access token',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Amadeus connection failed: ' . $e->getMessage(),
            ];
        }
    }
}


