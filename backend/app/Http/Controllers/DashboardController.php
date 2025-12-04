<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use App\Models\Booking;
use App\Models\User;
use App\Models\Airline;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            'flights' => Flight::count(),
            'bookings' => Booking::count(),
            'users' => User::count(),
            'airlines' => Airline::count(),
            'recent_bookings' => Booking::with(['user', 'flight.airline'])->latest()->take(5)->get(),
            'revenue' => [
                'total' => Booking::where('payment_status', 'paid')->sum('total_price'),
                'monthly' => [1200, 1900, 3000, 5000, 2300, 3400], // Mock data for chart
            ]
        ]);
    }
}
