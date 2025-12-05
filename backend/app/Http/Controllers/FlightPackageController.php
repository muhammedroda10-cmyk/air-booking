<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use App\Models\FlightPackage;
use Illuminate\Http\Request;

class FlightPackageController extends Controller
{
    /**
     * Get packages for a specific flight
     */
    public function index(Flight $flight)
    {
        $packages = $flight->packages()->get();
        
        // If no packages exist, return default packages
        if ($packages->isEmpty()) {
            $packages = $this->getDefaultPackages($flight);
        }

        return response()->json([
            'flight' => [
                'id' => $flight->id,
                'flight_number' => $flight->flight_number,
                'airline' => $flight->airline,
                'origin_airport' => $flight->originAirport,
                'destination_airport' => $flight->destinationAirport,
                'departure_time' => $flight->departure_time,
                'arrival_time' => $flight->arrival_time,
                'base_price' => $flight->base_price,
                'default_baggage' => $flight->default_baggage ?? 23,
            ],
            'packages' => $packages
        ]);
    }

    /**
     * Get a specific package
     */
    public function show(FlightPackage $package)
    {
        return response()->json([
            'package' => $package->load('flight.airline', 'flight.originAirport', 'flight.destinationAirport'),
            'features' => $package->features
        ]);
    }

    /**
     * Generate default packages for flights without configured packages
     */
    private function getDefaultPackages(Flight $flight)
    {
        $basePrice = $flight->base_price;

        return collect([
            [
                'id' => 'economy',
                'flight_id' => $flight->id,
                'name' => 'economy',
                'display_name' => 'Economy',
                'baggage_allowance' => 23,
                'cabin_baggage' => 7,
                'meals_included' => false,
                'extra_legroom' => false,
                'priority_boarding' => false,
                'lounge_access' => false,
                'flexible_rebooking' => false,
                'price_modifier' => 0,
                'total_price' => $basePrice,
                'description' => 'Standard economy class with essential amenities.',
                'features' => [
                    ['icon' => 'luggage', 'label' => 'Checked Baggage: 23kg', 'included' => true],
                    ['icon' => 'briefcase', 'label' => 'Cabin Bag: 7kg', 'included' => true],
                    ['icon' => 'utensils', 'label' => 'Meals Included', 'included' => false],
                    ['icon' => 'armchair', 'label' => 'Extra Legroom', 'included' => false],
                    ['icon' => 'crown', 'label' => 'Priority Boarding', 'included' => false],
                    ['icon' => 'coffee', 'label' => 'Lounge Access', 'included' => false],
                    ['icon' => 'refresh', 'label' => 'Flexible Rebooking', 'included' => false],
                ]
            ],
            [
                'id' => 'premium_economy',
                'flight_id' => $flight->id,
                'name' => 'premium_economy',
                'display_name' => 'Premium Economy',
                'baggage_allowance' => 30,
                'cabin_baggage' => 10,
                'meals_included' => true,
                'extra_legroom' => true,
                'priority_boarding' => false,
                'lounge_access' => false,
                'flexible_rebooking' => false,
                'price_modifier' => round($basePrice * 0.4, 2),
                'total_price' => $basePrice + round($basePrice * 0.4, 2),
                'description' => 'Enhanced comfort with extra legroom and complimentary meals.',
                'features' => [
                    ['icon' => 'luggage', 'label' => 'Checked Baggage: 30kg', 'included' => true],
                    ['icon' => 'briefcase', 'label' => 'Cabin Bag: 10kg', 'included' => true],
                    ['icon' => 'utensils', 'label' => 'Meals Included', 'included' => true],
                    ['icon' => 'armchair', 'label' => 'Extra Legroom', 'included' => true],
                    ['icon' => 'crown', 'label' => 'Priority Boarding', 'included' => false],
                    ['icon' => 'coffee', 'label' => 'Lounge Access', 'included' => false],
                    ['icon' => 'refresh', 'label' => 'Flexible Rebooking', 'included' => false],
                ]
            ],
            [
                'id' => 'business',
                'flight_id' => $flight->id,
                'name' => 'business',
                'display_name' => 'Business Class',
                'baggage_allowance' => 40,
                'cabin_baggage' => 12,
                'meals_included' => true,
                'extra_legroom' => true,
                'priority_boarding' => true,
                'lounge_access' => true,
                'flexible_rebooking' => true,
                'price_modifier' => round($basePrice * 1.5, 2),
                'total_price' => $basePrice + round($basePrice * 1.5, 2),
                'description' => 'Premium experience with lounge access and full flexibility.',
                'features' => [
                    ['icon' => 'luggage', 'label' => 'Checked Baggage: 40kg', 'included' => true],
                    ['icon' => 'briefcase', 'label' => 'Cabin Bag: 12kg', 'included' => true],
                    ['icon' => 'utensils', 'label' => 'Gourmet Meals', 'included' => true],
                    ['icon' => 'armchair', 'label' => 'Extra Legroom', 'included' => true],
                    ['icon' => 'crown', 'label' => 'Priority Boarding', 'included' => true],
                    ['icon' => 'coffee', 'label' => 'Lounge Access', 'included' => true],
                    ['icon' => 'refresh', 'label' => 'Flexible Rebooking', 'included' => true],
                ]
            ],
        ]);
    }

    /**
     * Admin: Create a package for a flight
     */
    public function store(Request $request, Flight $flight)
    {
        $validated = $request->validate([
            'name' => 'required|string|in:economy,premium_economy,business,first_class',
            'display_name' => 'required|string|max:100',
            'baggage_allowance' => 'required|integer|min:0|max:100',
            'cabin_baggage' => 'required|integer|min:0|max:20',
            'meals_included' => 'boolean',
            'extra_legroom' => 'boolean',
            'priority_boarding' => 'boolean',
            'lounge_access' => 'boolean',
            'flexible_rebooking' => 'boolean',
            'price_modifier' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $package = $flight->packages()->create($validated);

        return response()->json($package, 201);
    }

    /**
     * Admin: Update a package
     */
    public function update(Request $request, FlightPackage $package)
    {
        $validated = $request->validate([
            'display_name' => 'string|max:100',
            'baggage_allowance' => 'integer|min:0|max:100',
            'cabin_baggage' => 'integer|min:0|max:20',
            'meals_included' => 'boolean',
            'extra_legroom' => 'boolean',
            'priority_boarding' => 'boolean',
            'lounge_access' => 'boolean',
            'flexible_rebooking' => 'boolean',
            'price_modifier' => 'numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $package->update($validated);

        return response()->json($package);
    }

    /**
     * Admin: Delete a package
     */
    public function destroy(FlightPackage $package)
    {
        $package->delete();
        return response()->json(null, 204);
    }
}
