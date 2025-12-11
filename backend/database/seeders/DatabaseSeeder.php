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
        // 1. First create roles and permissions
        $this->call(RolesAndPermissionsSeeder::class);
        
        // 2. Then create users with roles
        $this->call(UserSeeder::class);

        // 3. Create Real Airlines, Airports, Flights, Hotels, etc.
        $this->call([
            SupplierSeeder::class,
            RealDataSeeder::class,
            IranianFlightsSeeder::class,
            FlightSeeder::class,
            HotelSeeder::class,
        ]);
        
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

        // 6. Create Bookings for a sample customer
        $customer = User::where('email', 'john@example.com')->first();
        if ($flights->isNotEmpty() && $customer) {
            Booking::factory(5)
                ->for($customer)
                ->recycle($flights)
                ->has(Passenger::factory()->count(2))
                ->create();
        }
        
        echo "\nDatabase seeded successfully!\n";
        echo "=================================\n";
        echo "Admin: admin@voyager.com / password\n";
        echo "Sales: sales@voyager.com / password\n";
        echo "Accounting: accounting@voyager.com / password\n"; 
        echo "Support: support@voyager.com / password\n";
        echo "Customer: john@example.com / password\n";
    }
}
