<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use Illuminate\Http\Request;

class SeatController extends Controller
{
    public function index(Flight $flight)
    {
        // Auto-generate seats if none exist
        if ($flight->seats()->count() === 0) {
            $this->generateSeats($flight);
        }

        $seats = $flight->seats->map(function ($seat) {
            return [
                'id' => $seat->seat_number,
                'status' => $seat->is_booked ? 'occupied' : 'available',
                'class' => $seat->class,
                // Add price pricing logic here later
                'price' => $seat->class === 'business' ? 50 : 0
            ];
        })->values();

        return response()->json([
            'flight_id' => $flight->id,
            'aircraft_type' => $flight->aircraft_type,
            'seats' => $seats
        ]);
    }

    private function generateSeats(Flight $flight)
    {
        $rows = 20; // Default rows
        $columns = ['A', 'B', 'C', 'D', 'E', 'F'];

        $seats = [];
        for ($i = 1; $i <= $rows; $i++) {
            foreach ($columns as $col) {
                // Determine class based on row
                $class = $i <= 3 ? 'business' : 'economy';
                
                // Randomly mark some as booked for realism if it's a new generation
                $isBooked = rand(0, 100) < 20; 

                $seats[] = [
                    'flight_id' => $flight->id,
                    'seat_number' => $i . $col,
                    'class' => $class,
                    'is_booked' => $isBooked,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        \App\Models\Seat::insert($seats);
    }

    public function lock(Request $request, Flight $flight)
    {
        $seats = $request->input('seats', []);
        
        // Validation logic would go here
        
        return response()->json(['message' => 'Seats locked successfully']);
    }

}
