<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\HotelBooking;
use Illuminate\Http\Request;

class HotelBookingController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->hotelBookings()->with(['hotel', 'room'])->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'hotel_id' => 'required|exists:hotels,id',
            'room_id' => 'required|exists:rooms,id',
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
        ]);

        $room = \App\Models\Room::findOrFail($request->room_id);
        $days = (new \DateTime($request->check_in))->diff(new \DateTime($request->check_out))->days;
        $totalPrice = $room->price * $days;

        $booking = HotelBooking::create([
            'user_id' => $request->user()->id,
            'hotel_id' => $request->hotel_id,
            'room_id' => $request->room_id,
            'check_in' => $request->check_in,
            'check_out' => $request->check_out,
            'total_price' => $totalPrice,
            'status' => 'confirmed', // Auto-confirm for now
        ]);

        return response()->json($booking, 201);
    }
}
