<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Flight;
use App\Models\Passenger;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Admin User
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // 2. Create Regular User
        $user = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'password' => bcrypt('password'),
            'role' => 'user',
        ]);

        // 3. Create Real Airlines and Airports
        $this->call(RealDataSeeder::class);
        
        // 4. Create Flights using the comprehensive FlightSeeder
        $this->call(FlightSeeder::class);
        
        // Get some flights for bookings
        $flights = Flight::take(10)->get();

        // 5. Create seats for each flight
        $flights->each(function ($flight) {
            // Create 60 seats for each flight (10 rows * 6 seats)
            $rows = range(1, 10);
            $letters = ['A', 'B', 'C', 'D', 'E', 'F'];
            foreach ($rows as $row) {
                foreach ($letters as $letter) {
                    \App\Models\Seat::factory()->create([
                        'flight_id' => $flight->id,
                        'seat_number' => $row . $letter,
                        'class' => $row <= 2 ? 'business' : 'economy',
                        'is_booked' => false,
                    ]);
                }
            }
        });

        // 6. Create Bookings for the Regular User
        if ($flights->isNotEmpty()) {
            Booking::factory(5)
                ->for($user)
                ->recycle($flights)
                ->has(Passenger::factory()->count(2))
                ->create();
        }
        
        echo "Database seeded successfully!\n";
        echo "Admin: admin@example.com / password\n";
        echo "User: user@example.com / password\n";
    }
}
