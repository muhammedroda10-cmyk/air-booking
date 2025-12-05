<?php

namespace App\Services\Suppliers;

use App\DTOs\Flight\FlightSearchRequest;
use App\DTOs\Flight\NormalizedFlightOffer;
use App\DTOs\Flight\NormalizedLeg;
use App\DTOs\Flight\NormalizedSegment;
use App\DTOs\Flight\NormalizedLocation;
use App\DTOs\Flight\NormalizedAirline;
use App\DTOs\Flight\NormalizedPrice;
use App\Models\Flight;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * DatabaseSupplier - Treats the local database as a flight supplier.
 * This allows combining local flights with external API results.
 */
class DatabaseSupplier extends AbstractFlightSupplier
{
    /**
     * Get the supplier code.
     */
    public function getSupplierCode(): string
    {
        return 'database';
    }

    /**
     * Search for flights in the local database.
     */
    public function search(FlightSearchRequest $request): Collection
    {
        return $this->getCachedOrFetch($request, function () use ($request) {
            try {
                $flights = $this->queryFlights($request);
                return $this->normalizeFlights($flights, $request);
            } catch (\Exception $e) {
                $this->logError('Database search failed', [
                    'error' => $e->getMessage(),
                    'request' => $request->toArray(),
                ]);
                return collect();
            }
        });
    }

    /**
     * Query flights from the database.
     */
    protected function queryFlights(FlightSearchRequest $request): Collection
    {
        $query = Flight::with(['airline', 'originAirport', 'destinationAirport'])
            ->whereHas('originAirport', function ($q) use ($request) {
                $q->where('code', $request->originCode);
            })
            ->whereHas('destinationAirport', function ($q) use ($request) {
                $q->where('code', $request->destinationCode);
            });

        // Filter by departure date
        $query->whereDate('departure_time', $request->departureDate->toDateString());

        // Apply price filters
        if (!empty($request->filters['min_price'])) {
            $query->where('base_price', '>=', $request->filters['min_price']);
        }

        if (!empty($request->filters['max_price'])) {
            $query->where('base_price', '<=', $request->filters['max_price']);
        }

        // Apply airline filter
        if (!empty($request->filters['airline_id'])) {
            $query->where('airline_id', $request->filters['airline_id']);
        }

        return $query->orderBy('departure_time', 'asc')->get();
    }

    /**
     * Convert database flights to normalized flight offers.
     */
    protected function normalizeFlights(Collection $flights, FlightSearchRequest $request): Collection
    {
        return $flights->map(function (Flight $flight) use ($request) {
            return $this->normalizeFlightToOffer($flight, $request);
        });
    }

    /**
     * Convert a single flight to a normalized offer.
     */
    protected function normalizeFlightToOffer(Flight $flight, FlightSearchRequest $request): NormalizedFlightOffer
    {
        $departureTime = Carbon::parse($flight->departure_time);
        $arrivalTime = Carbon::parse($flight->arrival_time);
        $durationMinutes = $departureTime->diffInMinutes($arrivalTime);

        // Create normalized location for departure
        $departure = new NormalizedLocation(
            city: $flight->originAirport->city ?? '',
            airportCode: $flight->originAirport->code ?? '',
            airportName: $flight->originAirport->name ?? '',
            airportId: $flight->originAirport->id ?? null,
            cityId: null,
            terminal: null,
            country: $flight->originAirport->country ?? null,
            countryCode: null,
            dateTime: $departureTime,
            time: $departureTime->format('H:i'),
            translations: null,
        );

        // Create normalized location for arrival
        $arrival = new NormalizedLocation(
            city: $flight->destinationAirport->city ?? '',
            airportCode: $flight->destinationAirport->code ?? '',
            airportName: $flight->destinationAirport->name ?? '',
            airportId: $flight->destinationAirport->id ?? null,
            cityId: null,
            terminal: null,
            country: $flight->destinationAirport->country ?? null,
            countryCode: null,
            dateTime: $arrivalTime,
            time: $arrivalTime->format('H:i'),
            translations: null,
        );

        // Create normalized airline
        $airline = new NormalizedAirline(
            id: $flight->airline->id ?? 0,
            code: $flight->airline->code ?? '',
            name: $flight->airline->name ?? '',
            logo: $flight->airline->logo ?? null,
            translations: null,
        );

        // Create segment
        $segment = new NormalizedSegment(
            departure: $departure,
            arrival: $arrival,
            airline: $airline,
            operatingAirline: null,
            flightNumber: $flight->flight_number,
            cabin: ucfirst($request->cabin),
            duration: $durationMinutes,
            aircraft: $flight->aircraft_type ?? null,
            luggage: ($flight->default_baggage ?? 23) . ' KG',
            bookingClass: null,
            fareBasis: null,
            capacity: 9, // Default capacity for database flights
        );

        // Create leg
        $leg = new NormalizedLeg(
            departure: $departure,
            arrival: $arrival,
            duration: $durationMinutes,
            stops: 0, // Database flights are direct
            cabin: ucfirst($request->cabin),
            segments: [$segment],
            airline: $airline,
            flightNumber: $flight->flight_number,
        );

        // Calculate price based on passengers
        $basePrice = $flight->base_price;
        $adultTotal = $basePrice * $request->adults;
        $childTotal = ($basePrice * 0.75) * $request->children; // 75% for children
        $infantTotal = ($basePrice * 0.1) * $request->infants; // 10% for infants
        $totalPrice = $adultTotal + $childTotal + $infantTotal;
        $taxes = $totalPrice * 0.12; // 12% taxes estimate

        // Create price
        $price = new NormalizedPrice(
            total: $totalPrice + $taxes,
            baseFare: $totalPrice,
            taxes: $taxes,
            currency: $request->currency ?? 'USD',
            currencySymbol: '$',
            decimalPlaces: 2,
            breakdown: [
                'adult' => [
                    'base_fare' => $basePrice,
                    'tax' => $basePrice * 0.12,
                    'total_fare' => $basePrice * 1.12,
                    'passengers_count' => $request->adults,
                ],
            ],
            guaranteed: true, // Database flights are guaranteed
        );

        return new NormalizedFlightOffer(
            id: 'database_' . $flight->id,
            supplierCode: $this->getSupplierCode(),
            referenceId: (string) $flight->id,
            price: $price,
            legs: [$leg],
            validatingAirline: $airline,
            seatsAvailable: 9,
            refundable: true, // Configurable based on policy
            validUntil: Carbon::now()->addHours(24),
            passengers: [
                'adults' => $request->adults,
                'children' => $request->children,
                'infants' => $request->infants,
            ],
            rawData: [
                'flight_id' => $flight->id,
                'source' => 'database',
            ],
            sellerCode: null,
            hasBrands: false,
            onholdable: true,
        );
    }

    /**
     * Get offer details by flight ID.
     */
    public function getOfferDetails(string $offerId): ?NormalizedFlightOffer
    {
        try {
            $flight = Flight::with(['airline', 'originAirport', 'destinationAirport'])
                ->find($offerId);

            if (!$flight) {
                return null;
            }

            // Create a basic search request for normalization
            $request = new FlightSearchRequest(
                originCode: $flight->originAirport->code,
                destinationCode: $flight->destinationAirport->code,
                departureDate: Carbon::parse($flight->departure_time),
                adults: 1,
            );

            return $this->normalizeFlightToOffer($flight, $request);
        } catch (\Exception $e) {
            $this->logError('Failed to get offer details', [
                'offerId' => $offerId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Perform connection test - database is always available if we can query.
     */
    protected function performConnectionTest(): array
    {
        try {
            $count = Flight::count();
            return [
                'success' => true,
                'message' => "Database connected. {$count} flights available.",
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage(),
            ];
        }
    }
}
