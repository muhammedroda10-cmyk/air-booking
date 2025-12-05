<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use App\DTOs\Flight\FlightSearchRequest;
use App\Services\FlightSearchService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class FlightController extends Controller
{
    public function __construct(
        protected ?FlightSearchService $flightSearchService = null
    ) {}

    public function index()
    {
        return Flight::with(['airline', 'originAirport', 'destinationAirport'])->get();
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'airline_id' => 'required|exists:airlines,id',
            'flight_number' => 'required|string|max:255',
            'origin_airport_id' => 'required|exists:airports,id',
            'destination_airport_id' => 'required|exists:airports,id|different:origin_airport_id',
            'departure_time' => 'required|date',
            'arrival_time' => 'required|date|after:departure_time',
            'aircraft_type' => 'required|string|max:255',
            'base_price' => 'required|numeric|min:0',
        ]);

        $flight = Flight::create($validated);

        return $flight->load(['airline', 'originAirport', 'destinationAirport']);
    }

    public function show(Flight $flight)
    {
        return $flight->load(['airline', 'originAirport', 'destinationAirport']);
    }

    public function update(Request $request, Flight $flight)
    {
        $validated = $request->validate([
            'airline_id' => 'sometimes|exists:airlines,id',
            'flight_number' => 'sometimes|string|max:255',
            'origin_airport_id' => 'sometimes|exists:airports,id',
            'destination_airport_id' => 'sometimes|exists:airports,id|different:origin_airport_id',
            'departure_time' => 'sometimes|date',
            'arrival_time' => 'sometimes|date|after:departure_time',
            'aircraft_type' => 'sometimes|string|max:255',
            'base_price' => 'sometimes|numeric|min:0',
        ]);

        $flight->update($validated);

        return $flight->load(['airline', 'originAirport', 'destinationAirport']);
    }

    public function destroy(Flight $flight)
    {
        $flight->delete();

        return response()->noContent();
    }

    public function search(Request $request)
    {
        $request->validate([
            'from' => 'required|string|exists:airports,code',
            'to' => 'required|string|exists:airports,code',
            'date' => 'nullable|date',
        ]);

        $query = Flight::with(['airline', 'originAirport', 'destinationAirport'])
            ->whereHas('originAirport', function ($query) use ($request) {
                $query->where('code', $request->from);
            })
            ->whereHas('destinationAirport', function ($query) use ($request) {
                $query->where('code', $request->to);
            });

        // If date is provided, search for flights on that date
        // Otherwise, show all future flights on this route
        if ($request->has('date') && $request->date) {
            $query->whereDate('departure_time', $request->date);
        } else {
            $query->where('departure_time', '>=', Carbon::now());
        }

        if ($request->has('min_price') && $request->min_price) {
            $query->where('base_price', '>=', $request->min_price);
        }

        if ($request->has('max_price') && $request->max_price) {
            $query->where('base_price', '<=', $request->max_price);
        }

        if ($request->has('airline_id') && $request->airline_id) {
            $query->where('airline_id', $request->airline_id);
        }

        // Order by departure time
        $query->orderBy('departure_time', 'asc');

        $flights = $query->get();

        // Add default baggage info to each flight
        return $flights->map(function ($flight) {
            $flight->default_baggage = $flight->default_baggage ?? 23;
            $flight->default_cabin_baggage = $flight->default_cabin_baggage ?? 7;
            return $flight;
        });
    }

    /**
     * Get all available routes (origin-destination pairs with flight counts)
     */
    public function routes()
    {
        return Flight::with(['originAirport', 'destinationAirport'])
            ->where('departure_time', '>=', Carbon::now())
            ->get()
            ->groupBy(function ($flight) {
                return $flight->originAirport->code . '-' . $flight->destinationAirport->code;
            })
            ->map(function ($flights, $route) {
                $first = $flights->first();
                return [
                    'route' => $route,
                    'origin' => $first->originAirport,
                    'destination' => $first->destinationAirport,
                    'flight_count' => $flights->count(),
                    'min_price' => $flights->min('base_price'),
                ];
            })
            ->values();
    }

    /**
     * Search flights from external suppliers.
     */
    public function searchExternal(Request $request)
    {
        $request->validate([
            'from' => 'required|string|min:3|max:3',
            'to' => 'required|string|min:3|max:3',
            'date' => 'required|date',
            'return_date' => 'nullable|date|after:date',
            'adults' => 'integer|min:1|max:9',
            'children' => 'integer|min:0|max:9',
            'infants' => 'integer|min:0|max:9',
            'cabin' => 'string|in:economy,premium_economy,business,first',
            'trip_type' => 'string|in:oneWay,roundTrip',
        ]);

        if (!$this->flightSearchService) {
            $this->flightSearchService = app(FlightSearchService::class);
        }

        $searchRequest = FlightSearchRequest::fromRequest($request->all());
        $results = $this->flightSearchService->search($searchRequest);

        // Apply additional filters if provided
        if ($request->has('min_price') || $request->has('max_price') || $request->has('airline_code') || $request->has('max_stops')) {
            $results = $this->flightSearchService->filterResults($results, $request->only([
                'min_price',
                'max_price',
                'airline_code',
                'max_stops',
                'refundable',
            ]));
        }

        return response()->json([
            'status' => true,
            'data' => $results->map(fn($offer) => $offer->toArray())->values(),
            'meta' => [
                'total' => $results->count(),
                'search_params' => $searchRequest->toArray(),
            ],
        ]);
    }

    /**
     * Get flight offer details from a supplier.
     */
    public function getOfferDetails(Request $request)
    {
        $request->validate([
            'supplier_code' => 'required|string',
            'reference_id' => 'required|string',
        ]);

        if (!$this->flightSearchService) {
            $this->flightSearchService = app(FlightSearchService::class);
        }

        $offer = $this->flightSearchService->getOfferDetails(
            $request->supplier_code,
            $request->reference_id
        );

        if (!$offer) {
            return response()->json([
                'status' => false,
                'message' => 'Offer not found or expired',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $offer->toArray(),
        ]);
    }
}
