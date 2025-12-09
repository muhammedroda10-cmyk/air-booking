<?php

namespace App\Http\Controllers;

use App\Services\FlightSupplierManager;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * AmadeusController - API endpoints for Amadeus services.
 * 
 * Provides access to Airport/City Search, Airline Lookup, 
 * Flight Pricing, and Order Management APIs.
 */
class AmadeusController extends Controller
{
    protected FlightSupplierManager $supplierManager;

    public function __construct(FlightSupplierManager $supplierManager)
    {
        $this->supplierManager = $supplierManager;
    }

    /**
     * Get the Amadeus supplier instance.
     */
    protected function getAmadeusSupplier()
    {
        try {
            return $this->supplierManager->driver('amadeus');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Search for airports and cities.
     * 
     * GET /api/locations/search?keyword=JFK&type=AIRPORT,CITY
     */
    public function searchLocations(Request $request): JsonResponse
    {
        $request->validate([
            'keyword' => 'required|string|min:1|max:50',
            'type' => 'nullable|string', // AIRPORT, CITY, or both
            'limit' => 'nullable|integer|min:1|max:10',
        ]);

        try {
            $supplier = $this->getAmadeusSupplier();
            
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'error' => 'Amadeus supplier not available',
                ], 503);
            }

            $result = $supplier->searchLocations(
                $request->input('keyword'),
                $request->input('type', 'AIRPORT,CITY'),
                $request->input('limit', 5)
            );

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get airline information by IATA code.
     * 
     * GET /api/airlines/lookup/{code}
     */
    public function getAirline(string $code): JsonResponse
    {
        try {
            $supplier = $this->getAmadeusSupplier();
            
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'error' => 'Amadeus supplier not available',
                ], 503);
            }

            $result = $supplier->getAirlineInfo(strtoupper($code));

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Price a flight offer.
     * 
     * POST /api/flights/price
     */
    public function priceOffer(Request $request): JsonResponse
    {
        $request->validate([
            'offer_id' => 'required|string',
        ]);

        try {
            $supplier = $this->getAmadeusSupplier();
            
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'error' => 'Amadeus supplier not available',
                ], 503);
            }

            // Get the cached offer
            $offer = $supplier->getOfferDetails($request->input('offer_id'));
            
            if (!$offer) {
                return response()->json([
                    'success' => false,
                    'error' => 'Offer not found. Please search again.',
                ], 404);
            }

            $result = $supplier->priceFlightOffer($offer);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get flight order details.
     * 
     * GET /api/flights/orders/{orderId}
     */
    public function getOrder(string $orderId): JsonResponse
    {
        try {
            $supplier = $this->getAmadeusSupplier();
            
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'error' => 'Amadeus supplier not available',
                ], 503);
            }

            $result = $supplier->getFlightOrder($orderId);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel a flight order.
     * 
     * DELETE /api/flights/orders/{orderId}
     */
    public function cancelOrder(string $orderId): JsonResponse
    {
        try {
            $supplier = $this->getAmadeusSupplier();
            
            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'error' => 'Amadeus supplier not available',
                ], 503);
            }

            $result = $supplier->cancelFlightOrder($orderId);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
