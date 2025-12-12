<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use App\Models\Booking;
use App\Models\User;
use App\Models\Airline;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        $today = Carbon::today();

        // Booking stats
        $totalBookings = Booking::count();
        $todayBookings = Booking::whereDate('created_at', $today)->count();
        $pendingBookings = Booking::where('status', 'pending')->count();

        // Revenue stats
        $totalRevenue = Booking::where('payment_status', 'paid')->sum('total_price');
        $todayRevenue = Booking::where('payment_status', 'paid')
            ->whereDate('created_at', $today)
            ->sum('total_price');

        // User stats
        $totalUsers = User::count();
        $newUsersToday = User::whereDate('created_at', $today)->count();

        // Support ticket stats
        $openTickets = 0;
        $pendingTickets = 0;
        
        if (class_exists(SupportTicket::class)) {
            $openTickets = SupportTicket::whereIn('status', ['open', 'in_progress'])->count();
            $pendingTickets = SupportTicket::where('status', 'awaiting_customer')->count();
        }

        return response()->json([
            'bookings' => [
                'total' => $totalBookings,
                'today' => $todayBookings,
                'pending' => $pendingBookings,
            ],
            'revenue' => [
                'total' => round($totalRevenue, 2),
                'today' => round($todayRevenue, 2),
            ],
            'users' => [
                'total' => $totalUsers,
                'new_today' => $newUsersToday,
            ],
            'support' => [
                'open' => $openTickets,
                'pending' => $pendingTickets,
            ],
            // Additional data for charts and recent activity
            'flights' => Flight::count(),
            'airlines' => Airline::count(),
            'recent_bookings' => Booking::with(['user', 'flight.airline'])
                ->latest()
                ->take(5)
                ->get(),
        ]);
    }

    /**
     * Get financial reports and analytics
     */
    public function reports(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $startDate = Carbon::now()->subDays($period);
        $previousStartDate = Carbon::now()->subDays($period * 2);
        $previousEndDate = Carbon::now()->subDays($period);

        // Current period stats
        $totalRevenue = Booking::where('payment_status', 'paid')
            ->where('created_at', '>=', $startDate)
            ->sum('total_price');

        $totalBookings = Booking::where('created_at', '>=', $startDate)->count();

        $flightBookings = Booking::where('created_at', '>=', $startDate)->count();

        $hotelBookings = 0;
        if (class_exists(\App\Models\HotelBooking::class)) {
            $hotelBookings = \App\Models\HotelBooking::where('created_at', '>=', $startDate)->count();
        }

        $totalRefunds = Booking::where('payment_status', 'refunded')
            ->where('created_at', '>=', $startDate)
            ->sum('total_price');

        // Previous period stats for growth calculation
        $previousRevenue = Booking::where('payment_status', 'paid')
            ->whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->sum('total_price');

        $previousBookings = Booking::whereBetween('created_at', [$previousStartDate, $previousEndDate])->count();

        // Calculate growth percentages
        $revenueGrowth = $previousRevenue > 0 
            ? round((($totalRevenue - $previousRevenue) / $previousRevenue) * 100, 1) 
            : 0;

        $bookingGrowth = $previousBookings > 0 
            ? round((($totalBookings - $previousBookings) / $previousBookings) * 100, 1) 
            : 0;

        $averageBookingValue = $totalBookings > 0 ? round($totalRevenue / $totalBookings, 2) : 0;

        return response()->json([
            'totalRevenue' => round($totalRevenue, 2),
            'totalBookings' => $totalBookings,
            'flightBookings' => $flightBookings,
            'hotelBookings' => $hotelBookings,
            'totalRefunds' => round($totalRefunds, 2),
            'averageBookingValue' => $averageBookingValue,
            'revenueGrowth' => $revenueGrowth,
            'bookingGrowth' => $bookingGrowth,
        ]);
    }
}
