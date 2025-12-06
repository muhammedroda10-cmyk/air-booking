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

/**
 * DuffelSupplier - Integration with Duffel Flight API.
 * 
 * @see https://duffel.com/docs/api/v2/offer-requests/create-offer-request
 */
class DuffelSupplier extends AbstractFlightSupplier
{
    protected const API_VERSION = 'v2';

    /**
     * Get the supplier code.
     */
    public function getSupplierCode(): string
    {
        return 'duffel';
    }

    /**
     * Get the Duffel API base URL.
     */
    protected function getBaseUrl(): string
    {
        return rtrim($this->config['base_url'] ?? 'https://api.duffel.com', '/');
    }

    /**
     * Search for flights using Duffel Offer Requests API.
     */
    public function search(FlightSearchRequest $request): Collection
    {
        return $this->getCachedOrFetch($request, function () use ($request) {
            try {
                $response = $this->performSearch($request);
                return $this->parseSearchResponse($response, $request);
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

        $this->logInfo('Performing Duffel search', ['payload' => $payload]);

        $response = $this->getHttpClient()
            ->post($this->getBaseUrl() . '/air/offer_requests?return_offers=true', [
                'data' => $payload,
            ]);

        if (!$response->successful()) {
            throw new \Exception('Duffel API error: ' . $response->status() . ' - ' . $response->body());
        }

        $this->markHealthy();
        return $response->json();
    }

    /**
     * Build the search payload for Duffel API.
     */
    protected function buildSearchPayload(FlightSearchRequest $request): array
    {
        $slices = [
            [
                'origin' => $request->originCode,
                'destination' => $request->destinationCode,
                'departure_date' => $request->departureDate->toDateString(),
            ],
        ];

        // Add return slice for round trips
        if ($request->isRoundTrip() && $request->returnDate) {
            $slices[] = [
                'origin' => $request->destinationCode,
                'destination' => $request->originCode,
                'departure_date' => $request->returnDate->toDateString(),
            ];
        }

        // Build passengers array
        $passengers = [];

        // Add adults
        for ($i = 0; $i < $request->adults; $i++) {
            $passengers[] = ['type' => 'adult'];
        }

        // Add children
        for ($i = 0; $i < $request->children; $i++) {
            $passengers[] = ['type' => 'child'];
        }

        // Add infants
        for ($i = 0; $i < $request->infants; $i++) {
            $passengers[] = ['type' => 'infant_without_seat'];
        }

        $payload = [
            'slices' => $slices,
            'passengers' => $passengers,
        ];

        // Add cabin class if specified
        $cabinClass = $this->mapCabinClass($request->cabin);
        if ($cabinClass) {
            $payload['cabin_class'] = $cabinClass;
        }

        return $payload;
    }

    /**
     * Map internal cabin class to Duffel format.
     */
    protected function mapCabinClass(string $cabin): ?string
    {
        return match (strtolower($cabin)) {
            'economy', 'y' => 'economy',
            'premium_economy', 'premium economy', 'w' => 'premium_economy',
            'business', 'c', 'j' => 'business',
            'first', 'f' => 'first',
            default => 'economy',
        };
    }

    /**
     * Parse the Duffel search response into normalized offers.
     */
    protected function parseSearchResponse(array $response, FlightSearchRequest $request): Collection
    {
        $data = $response['data'] ?? [];
        $offers = $data['offers'] ?? [];

        if (empty($offers)) {
            $this->logInfo('No offers returned from Duffel');
            return collect();
        }

        $normalizedOffers = collect($offers)->map(function ($offer) use ($request) {
            try {
                return $this->normalizeOffer($offer, $request);
            } catch (\Exception $e) {
                $this->logError('Failed to parse Duffel offer', [
                    'error' => $e->getMessage(),
                    'offer_id' => $offer['id'] ?? 'unknown',
                ]);
                return null;
            }
        })->filter();

        $this->logInfo('Duffel search completed', [
            'total_results' => count($offers),
            'parsed_results' => $normalizedOffers->count(),
        ]);

        return $normalizedOffers;
    }

    /**
     * Normalize a single Duffel offer to NormalizedFlightOffer.
     */
    protected function normalizeOffer(array $offer, FlightSearchRequest $request): NormalizedFlightOffer
    {
        $legs = [];
        $slices = $offer['slices'] ?? [];

        foreach ($slices as $slice) {
            $legs[] = $this->normalizeSlice($slice);
        }

        // Extract owner/validating airline
        $owner = $offer['owner'] ?? [];
        $validatingAirline = new NormalizedAirline(
            id: 0,
            code: $owner['iata_code'] ?? '',
            name: $owner['name'] ?? '',
            logo: $owner['logo_symbol_url'] ?? $owner['logo_lockup_url'] ?? null,
            translations: null,
        );

        // Parse price
        $totalAmount = floatval($offer['total_amount'] ?? 0);
        $baseAmount = floatval($offer['base_amount'] ?? 0);
        $taxAmount = floatval($offer['tax_amount'] ?? 0);
        $currency = $offer['total_currency'] ?? $offer['base_currency'] ?? 'USD';

        $price = new NormalizedPrice(
            total: $totalAmount,
            baseFare: $baseAmount,
            taxes: $taxAmount,
            currency: $currency,
            currencySymbol: $this->getCurrencySymbol($currency),
            decimalPlaces: 2,
            breakdown: $this->buildPriceBreakdown($offer, $request),
            guaranteed: false,
        );

        // Check refundability
        $conditions = $offer['conditions'] ?? [];
        $refundable = isset($conditions['refund_before_departure']['allowed'])
            ? $conditions['refund_before_departure']['allowed']
            : false;

        // Get expiry time
        $expiresAt = isset($offer['expires_at'])
            ? Carbon::parse($offer['expires_at'])
            : Carbon::now()->addMinutes(30);

        // Extract available seats (minimum across all segments)
        $seatsAvailable = $this->extractSeatsAvailable($slices);

        return new NormalizedFlightOffer(
            id: 'duffel_' . ($offer['id'] ?? ''),
            supplierCode: $this->getSupplierCode(),
            referenceId: $offer['id'] ?? '',
            price: $price,
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
            hasBrands: false,
            onholdable: !($offer['payment_requirements']['requires_instant_payment'] ?? true),
        );
    }

    /**
     * Normalize a Duffel slice to NormalizedLeg.
     */
    protected function normalizeSlice(array $slice): NormalizedLeg
    {
        $segments = [];
        $duffelSegments = $slice['segments'] ?? [];

        foreach ($duffelSegments as $segment) {
            $segments[] = $this->normalizeSegment($segment);
        }

        $firstSegment = $segments[0] ?? null;
        $lastSegment = end($segments) ?: $firstSegment;

        // Parse duration (format: PT2H26M)
        $duration = $this->parseDuration($slice['duration'] ?? 'PT0H0M');

        // Get cabin from first segment's passengers
        $cabin = 'Economy';
        if (!empty($duffelSegments[0]['passengers'][0]['cabin_class'])) {
            $cabin = ucfirst($duffelSegments[0]['passengers'][0]['cabin_class']);
        }

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
     * Normalize a Duffel segment to NormalizedSegment.
     */
    protected function normalizeSegment(array $segment): NormalizedSegment
    {
        // Departure location
        $origin = $segment['origin'] ?? [];
        $departureTime = isset($segment['departing_at'])
            ? Carbon::parse($segment['departing_at'])
            : null;

        $departure = new NormalizedLocation(
            city: $origin['city_name'] ?? $origin['city']['name'] ?? '',
            airportCode: $origin['iata_code'] ?? '',
            airportName: $origin['name'] ?? '',
            airportId: null,
            cityId: null,
            terminal: $segment['origin_terminal'] ?? null,
            country: $origin['city']['iata_country_code'] ?? $origin['iata_country_code'] ?? null,
            countryCode: $origin['iata_country_code'] ?? null,
            dateTime: $departureTime,
            time: $departureTime?->format('H:i'),
            translations: null,
        );

        // Arrival location
        $destination = $segment['destination'] ?? [];
        $arrivalTime = isset($segment['arriving_at'])
            ? Carbon::parse($segment['arriving_at'])
            : null;

        $arrival = new NormalizedLocation(
            city: $destination['city_name'] ?? $destination['city']['name'] ?? '',
            airportCode: $destination['iata_code'] ?? '',
            airportName: $destination['name'] ?? '',
            airportId: null,
            cityId: null,
            terminal: $segment['destination_terminal'] ?? null,
            country: $destination['city']['iata_country_code'] ?? $destination['iata_country_code'] ?? null,
            countryCode: $destination['iata_country_code'] ?? null,
            dateTime: $arrivalTime,
            time: $arrivalTime?->format('H:i'),
            translations: null,
        );

        // Marketing carrier (airline)
        $marketingCarrier = $segment['marketing_carrier'] ?? [];
        $airline = new NormalizedAirline(
            id: 0,
            code: $marketingCarrier['iata_code'] ?? '',
            name: $marketingCarrier['name'] ?? '',
            logo: $marketingCarrier['logo_symbol_url'] ?? null,
            translations: null,
        );

        // Operating carrier
        $operatingCarrier = $segment['operating_carrier'] ?? null;
        $operatingAirline = $operatingCarrier ? new NormalizedAirline(
            id: 0,
            code: $operatingCarrier['iata_code'] ?? '',
            name: $operatingCarrier['name'] ?? '',
            logo: $operatingCarrier['logo_symbol_url'] ?? null,
            translations: null,
        ) : null;

        // Parse duration
        $duration = $this->parseDuration($segment['duration'] ?? 'PT0H0M');

        // Get cabin class from passengers
        $cabin = 'Economy';
        if (!empty($segment['passengers'][0]['cabin_class'])) {
            $cabin = ucfirst($segment['passengers'][0]['cabin_class']);
        }

        // Get baggage info
        $luggage = null;
        if (!empty($segment['passengers'][0]['baggages'])) {
            $baggages = $segment['passengers'][0]['baggages'];
            foreach ($baggages as $baggage) {
                if ($baggage['type'] === 'checked' && $baggage['quantity'] > 0) {
                    $luggage = $baggage['quantity'] . ' checked bag(s)';
                    break;
                }
            }
        }

        // Aircraft
        $aircraft = $segment['aircraft']['name'] ?? null;

        return new NormalizedSegment(
            departure: $departure,
            arrival: $arrival,
            airline: $airline,
            operatingAirline: $operatingAirline,
            flightNumber: $segment['marketing_carrier_flight_number'] ?? '',
            cabin: $cabin,
            duration: $duration,
            aircraft: $aircraft,
            luggage: $luggage,
            bookingClass: $segment['passengers'][0]['fare_basis_code'] ?? null,
            fareBasis: $segment['passengers'][0]['fare_basis_code'] ?? null,
            capacity: 9, // Duffel doesn't expose exact seat count
        );
    }

    /**
     * Parse ISO 8601 duration string (e.g., PT2H26M) to minutes.
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
     * Build price breakdown from Duffel offer.
     */
    protected function buildPriceBreakdown(array $offer, FlightSearchRequest $request): array
    {
        $breakdown = [];
        $passengers = $offer['passengers'] ?? [];

        // Group by passenger type
        $passengersByType = [];
        foreach ($passengers as $passenger) {
            $type = $passenger['type'] ?? 'adult';
            if (!isset($passengersByType[$type])) {
                $passengersByType[$type] = 0;
            }
            $passengersByType[$type]++;
        }

        $totalAmount = floatval($offer['total_amount'] ?? 0);
        $baseAmount = floatval($offer['base_amount'] ?? 0);
        $taxAmount = floatval($offer['tax_amount'] ?? 0);
        $totalPassengers = count($passengers) ?: 1;

        foreach ($passengersByType as $type => $count) {
            $perPassengerTotal = $totalAmount / $totalPassengers;
            $perPassengerBase = $baseAmount / $totalPassengers;
            $perPassengerTax = $taxAmount / $totalPassengers;

            $breakdown[$type] = [
                'base_fare' => round($perPassengerBase, 2),
                'tax' => round($perPassengerTax, 2),
                'service_charge' => 0,
                'total_fare' => round($perPassengerTotal, 2),
                'commission' => 0,
                'payable' => round($perPassengerTotal, 2),
                'passengers_count' => $count,
            ];
        }

        return $breakdown;
    }

    /**
     * Extract minimum available seats from slices.
     */
    protected function extractSeatsAvailable(array $slices): int
    {
        // Duffel doesn't directly expose seat availability per segment
        // Return a default value
        return 9;
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
     * Get offer details by ID.
     */
    public function getOfferDetails(string $offerId): ?NormalizedFlightOffer
    {
        try {
            $response = $this->getHttpClient()
                ->get($this->getBaseUrl() . '/air/offers/' . $offerId);

            if (!$response->successful()) {
                $this->logError('Failed to get offer details', [
                    'offerId' => $offerId,
                    'status' => $response->status(),
                ]);
                return null;
            }

            $data = $response->json();
            $offer = $data['data'] ?? null;

            if (!$offer) {
                return null;
            }

            // Create a basic request for price breakdown
            $request = new FlightSearchRequest(
                originCode: '',
                destinationCode: '',
                departureDate: Carbon::now(),
                adults: 1,
            );

            return $this->normalizeOffer($offer, $request);
        } catch (\Exception $e) {
            $this->logError('Failed to get offer details', [
                'offerId' => $offerId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get default headers including Duffel authentication.
     */
    protected function getDefaultHeaders(): array
    {
        $headers = parent::getDefaultHeaders();

        // Add Duffel-specific headers
        $headers['Duffel-Version'] = self::API_VERSION;
        $headers['Accept-Encoding'] = 'gzip';

        // Add Bearer token authentication
        if (!empty($this->config['api_key'])) {
            $headers['Authorization'] = 'Bearer ' . $this->config['api_key'];
        }

        return $headers;
    }

    /**
     * Perform connection test against Duffel API.
     */
    protected function performConnectionTest(): array
    {
        try {
            // Try to list airlines as a simple connectivity test
            $response = $this->getHttpClient()
                ->get($this->getBaseUrl() . '/air/airlines?limit=1');

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Duffel API connection successful',
                ];
            }

            $body = $response->json();
            $errorMessage = $body['errors'][0]['message'] ?? 'Unknown error';

            return [
                'success' => false,
                'message' => 'Duffel API error: ' . $errorMessage,
            ];
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return [
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ];
        }
    }
    /**
     * Create a booking with the supplier.
     */
    public function book(NormalizedFlightOffer $offer, array $passengers): array
    {
        $payload = $this->buildBookingPayload($offer, $passengers);

        $this->logInfo('Creating Duffel order', ['payload' => $payload]);

        $response = $this->getHttpClient()
            ->post($this->getBaseUrl() . '/air/orders', [
                'data' => $payload,
            ]);

        if (!$response->successful()) {
            $body = $response->json();
            $error = $body['errors'][0]['message'] ?? 'Unknown error';
            $errorCode = $body['errors'][0]['code'] ?? null;
            $field = $body['errors'][0]['source']['field'] ?? null;

            // Provide clearer error messages for common issues
            if ($field === 'selected_offers' || str_contains($error, 'expired') || str_contains($error, 'no longer available')) {
                throw new \Exception('This flight offer has expired. Please search again to find current availability.');
            }

            throw new \Exception('Duffel Booking Failed: ' . $error);
        }

        $data = $response->json()['data'];

        return [
            'pnr' => $data['booking_reference'] ?? 'PENDING',
            'order_id' => $data['id'],
            'ticket_number' => $data['documents'][0]['unique_identifier'] ?? null,
            'status' => 'confirmed',
            'raw_response' => $data,
        ];
    }

    /**
     * Build booking payload for Duffel.
     */
    protected function buildBookingPayload(NormalizedFlightOffer $offer, array $passengers): array
    {
        // Map passengers to Duffel's requirements using the Offer's passenger IDs
        $duffelPassengers = $this->mapPassengersToOffer($offer, $passengers);

        // Check if this offer requires instant payment
        $rawData = $offer->getRawData();
        $requiresInstantPayment = $rawData['payment_requirements']['requires_instant_payment'] ?? false;

        if ($requiresInstantPayment) {
            // Use instant payment with balance (works in test mode with unlimited balance)
            return [
                'type' => 'instant',
                'selected_offers' => [$offer->referenceId],
                'passengers' => $duffelPassengers,
                'payments' => [
                    [
                        'type' => 'balance',
                        'amount' => (string) $offer->price->total,
                        'currency' => $offer->price->currency,
                    ]
                ],
            ];
        }

        // Use 'hold' type for offers that don't require instant payment
        // Note: hold orders auto-cancel after the hold expires if not paid
        return [
            'type' => 'hold',
            'selected_offers' => [$offer->referenceId],
            'passengers' => $duffelPassengers,
        ];
    }

    /**
     * Map internal passengers to Duffel offer passenger IDs.
     */
    protected function mapPassengersToOffer(NormalizedFlightOffer $offer, array $passengers): array
    {
        $offerPassengers = $offer->getRawData()['passengers'] ?? [];
        $mappedPassengers = [];

        // Group offer passengers by type
        $availableSlots = [];
        foreach ($offerPassengers as $op) {
            $availableSlots[$op['type']][] = $op['id'];
        }

        $isFirstPassenger = true;
        foreach ($passengers as $p) {
            $type = $this->mapPassengerType($p['passenger_type'] ?? 'adult');

            if (empty($availableSlots[$type])) {
                throw new \Exception("Not enough slots for passenger type: {$type}");
            }

            $duffelId = array_shift($availableSlots[$type]);

            $passengerData = [
                'id' => $duffelId,
                'given_name' => $p['first_name'] ?? $p['name'] ?? 'Test',
                'family_name' => $p['last_name'] ?? 'Passenger',
                'born_on' => !empty($p['date_of_birth']) ? Carbon::parse($p['date_of_birth'])->format('Y-m-d') : '1990-01-15',
                'gender' => isset($p['gender']) ? strtolower($p['gender'])[0] : 'm',
                'title' => $p['title'] ?? 'mr',
            ];

            // Only add email and phone for the first passenger (contact)
            if ($isFirstPassenger) {
                $passengerData['email'] = $p['email'] ?? 'test@example.com';
                $passengerData['phone_number'] = $p['phone_number'] ?? '+441234567890';
                $isFirstPassenger = false;
            }

            $mappedPassengers[] = $passengerData;
        }

        return $mappedPassengers;
    }

    protected function mapPassengerType(string $type): string
    {
        return match (strtolower($type)) {
            'adult' => 'adult',
            'child' => 'child',
            'infant' => 'infant_without_seat',
            default => 'adult',
        };
    }
}
