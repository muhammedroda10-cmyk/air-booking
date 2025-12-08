<?php

namespace App\Http\Controllers;

use App\Models\Addon;
use App\Models\Flight;
use Illuminate\Http\Request;

class AddonController extends Controller
{
    public function index(Request $request)
    {
        $query = Addon::where('is_active', true);

        if ($request->has('flight_id') && is_numeric($request->flight_id) && $request->flight_id > 0) {
            $flight = Flight::find($request->flight_id);
            if ($flight && $flight->airline_id) {
                // Get global addons OR airline specific addons
                $query->where(function($q) use ($flight) {
                    $q->whereNull('airline_id')
                      ->orWhere('airline_id', $flight->airline_id);
                });
            } else {
                // Just global addons
                $query->whereNull('airline_id');
            }
        } else {
             // Just global addons if no valid flight specified
             $query->whereNull('airline_id');
        }

        return response()->json($query->get());
    }
}
