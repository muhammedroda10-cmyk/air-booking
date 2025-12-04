<?php

namespace Database\Seeders;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Flight;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class FlightSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $airlines = Airline::all();
        $airports = Airport::all();

        if ($airlines->isEmpty() || $airports->isEmpty()) {
            $this->command->info('Please run RealDataSeeder first to create airlines and airports.');
            return;
        }

        // Define popular routes with typical prices
        $popularRoutes = [
            // US Domestic
            ['from' => 'JFK', 'to' => 'LAX', 'base_price' => 350, 'duration' => 330],
            ['from' => 'LAX', 'to' => 'JFK', 'base_price' => 350, 'duration' => 300],
            ['from' => 'ORD', 'to' => 'LAX', 'base_price' => 280, 'duration' => 240],
            ['from' => 'LAX', 'to' => 'ORD', 'base_price' => 280, 'duration' => 225],
            ['from' => 'JFK', 'to' => 'SFO', 'base_price' => 380, 'duration' => 360],
            ['from' => 'SFO', 'to' => 'JFK', 'base_price' => 380, 'duration' => 320],
            ['from' => 'ATL', 'to' => 'LAX', 'base_price' => 320, 'duration' => 270],
            ['from' => 'LAX', 'to' => 'ATL', 'base_price' => 320, 'duration' => 240],
            ['from' => 'DFW', 'to' => 'JFK', 'base_price' => 290, 'duration' => 210],
            ['from' => 'JFK', 'to' => 'DFW', 'base_price' => 290, 'duration' => 225],
            
            // International - Middle East/Asia
            ['from' => 'DXB', 'to' => 'LHR', 'base_price' => 650, 'duration' => 420],
            ['from' => 'LHR', 'to' => 'DXB', 'base_price' => 650, 'duration' => 390],
            ['from' => 'DXB', 'to' => 'JFK', 'base_price' => 950, 'duration' => 840],
            ['from' => 'JFK', 'to' => 'DXB', 'base_price' => 950, 'duration' => 750],
            ['from' => 'DOH', 'to' => 'LHR', 'base_price' => 620, 'duration' => 400],
            ['from' => 'LHR', 'to' => 'DOH', 'base_price' => 620, 'duration' => 380],
            ['from' => 'SIN', 'to' => 'LHR', 'base_price' => 850, 'duration' => 780],
            ['from' => 'LHR', 'to' => 'SIN', 'base_price' => 850, 'duration' => 720],
            ['from' => 'HKG', 'to' => 'LHR', 'base_price' => 800, 'duration' => 720],
            ['from' => 'LHR', 'to' => 'HKG', 'base_price' => 800, 'duration' => 680],
            
            // Europe
            ['from' => 'LHR', 'to' => 'CDG', 'base_price' => 180, 'duration' => 75],
            ['from' => 'CDG', 'to' => 'LHR', 'base_price' => 180, 'duration' => 80],
            ['from' => 'LHR', 'to' => 'FRA', 'base_price' => 200, 'duration' => 90],
            ['from' => 'FRA', 'to' => 'LHR', 'base_price' => 200, 'duration' => 95],
            ['from' => 'CDG', 'to' => 'FRA', 'base_price' => 150, 'duration' => 75],
            ['from' => 'FRA', 'to' => 'CDG', 'base_price' => 150, 'duration' => 80],
            ['from' => 'AMS', 'to' => 'LHR', 'base_price' => 160, 'duration' => 60],
            ['from' => 'LHR', 'to' => 'AMS', 'base_price' => 160, 'duration' => 65],
            ['from' => 'BCN', 'to' => 'LHR', 'base_price' => 190, 'duration' => 120],
            ['from' => 'LHR', 'to' => 'BCN', 'base_price' => 190, 'duration' => 125],
            ['from' => 'MAD', 'to' => 'LHR', 'base_price' => 180, 'duration' => 135],
            ['from' => 'LHR', 'to' => 'MAD', 'base_price' => 180, 'duration' => 140],
            
            // Asia
            ['from' => 'HND', 'to' => 'SIN', 'base_price' => 550, 'duration' => 420],
            ['from' => 'SIN', 'to' => 'HND', 'base_price' => 550, 'duration' => 400],
            ['from' => 'HKG', 'to' => 'SIN', 'base_price' => 380, 'duration' => 240],
            ['from' => 'SIN', 'to' => 'HKG', 'base_price' => 380, 'duration' => 230],
            ['from' => 'BKK', 'to' => 'SIN', 'base_price' => 220, 'duration' => 150],
            ['from' => 'SIN', 'to' => 'BKK', 'base_price' => 220, 'duration' => 140],
            ['from' => 'ICN', 'to' => 'HND', 'base_price' => 400, 'duration' => 150],
            ['from' => 'HND', 'to' => 'ICN', 'base_price' => 400, 'duration' => 165],
            
            // US to Europe
            ['from' => 'JFK', 'to' => 'LHR', 'base_price' => 750, 'duration' => 420],
            ['from' => 'LHR', 'to' => 'JFK', 'base_price' => 750, 'duration' => 510],
            ['from' => 'JFK', 'to' => 'CDG', 'base_price' => 780, 'duration' => 450],
            ['from' => 'CDG', 'to' => 'JFK', 'base_price' => 780, 'duration' => 540],
            ['from' => 'LAX', 'to' => 'LHR', 'base_price' => 850, 'duration' => 630],
            ['from' => 'LHR', 'to' => 'LAX', 'base_price' => 850, 'duration' => 660],
            
            // US to Asia
            ['from' => 'LAX', 'to' => 'HND', 'base_price' => 950, 'duration' => 720],
            ['from' => 'HND', 'to' => 'LAX', 'base_price' => 950, 'duration' => 600],
            ['from' => 'SFO', 'to' => 'HKG', 'base_price' => 900, 'duration' => 840],
            ['from' => 'HKG', 'to' => 'SFO', 'base_price' => 900, 'duration' => 720],
            ['from' => 'LAX', 'to' => 'SIN', 'base_price' => 1100, 'duration' => 1080],
            ['from' => 'SIN', 'to' => 'LAX', 'base_price' => 1100, 'duration' => 960],
            
            // Middle East connections
            ['from' => 'DXB', 'to' => 'BOM', 'base_price' => 350, 'duration' => 180],
            ['from' => 'BOM', 'to' => 'DXB', 'base_price' => 350, 'duration' => 190],
            ['from' => 'DXB', 'to' => 'DEL', 'base_price' => 380, 'duration' => 210],
            ['from' => 'DEL', 'to' => 'DXB', 'base_price' => 380, 'duration' => 220],
            ['from' => 'DOH', 'to' => 'SIN', 'base_price' => 600, 'duration' => 480],
            ['from' => 'SIN', 'to' => 'DOH', 'base_price' => 600, 'duration' => 450],
            ['from' => 'IST', 'to' => 'LHR', 'base_price' => 280, 'duration' => 240],
            ['from' => 'LHR', 'to' => 'IST', 'base_price' => 280, 'duration' => 210],
            ['from' => 'IST', 'to' => 'DXB', 'base_price' => 320, 'duration' => 270],
            ['from' => 'DXB', 'to' => 'IST', 'base_price' => 320, 'duration' => 300],
            
            // Australia connections
            ['from' => 'SYD', 'to' => 'SIN', 'base_price' => 550, 'duration' => 480],
            ['from' => 'SIN', 'to' => 'SYD', 'base_price' => 550, 'duration' => 450],
            ['from' => 'SYD', 'to' => 'LAX', 'base_price' => 1200, 'duration' => 840],
            ['from' => 'LAX', 'to' => 'SYD', 'base_price' => 1200, 'duration' => 900],
            ['from' => 'SYD', 'to' => 'DXB', 'base_price' => 950, 'duration' => 840],
            ['from' => 'DXB', 'to' => 'SYD', 'base_price' => 950, 'duration' => 780],
        ];

        $flightCount = 0;

        // For each route, create multiple flights over the next 30 days
        foreach ($popularRoutes as $route) {
            $originAirport = $airports->where('code', $route['from'])->first();
            $destinationAirport = $airports->where('code', $route['to'])->first();

            if (!$originAirport || !$destinationAirport) {
                continue;
            }

            // Create 3-5 flights per day for the next 14 days on popular routes
            for ($dayOffset = 1; $dayOffset <= 14; $dayOffset++) {
                $flightsPerDay = rand(2, 4);
                
                for ($f = 0; $f < $flightsPerDay; $f++) {
                    $airline = $airlines->random();
                    
                    // Random departure times spread throughout the day
                    $departureHours = [6, 8, 10, 12, 14, 16, 18, 20, 22];
                    $departureHour = $departureHours[array_rand($departureHours)];
                    $departureMinute = [0, 15, 30, 45][array_rand([0, 15, 30, 45])];
                    
                    $departure = Carbon::now()
                        ->addDays($dayOffset)
                        ->setTime($departureHour, $departureMinute, 0);
                    
                    // Add some variation to duration (±15%)
                    $durationVariation = $route['duration'] * (rand(85, 115) / 100);
                    $arrival = $departure->copy()->addMinutes((int)$durationVariation);
                    
                    // Price variation (±20%)
                    $priceVariation = $route['base_price'] * (rand(80, 120) / 100);
                    
                    // Generate flight number
                    $flightNumber = $airline->code . rand(100, 9999);

                    Flight::create([
                        'airline_id' => $airline->id,
                        'flight_number' => $flightNumber,
                        'origin_airport_id' => $originAirport->id,
                        'destination_airport_id' => $destinationAirport->id,
                        'departure_time' => $departure,
                        'arrival_time' => $arrival,
                        'aircraft_type' => collect(['Boeing 737', 'Boeing 777', 'Boeing 787', 'Airbus A320', 'Airbus A350', 'Airbus A380'])->random(),
                        'base_price' => round($priceVariation, 2),
                    ]);
                    
                    $flightCount++;
                }
            }
        }

        $this->command->info("Created {$flightCount} flights across " . count($popularRoutes) . " routes.");
    }
}
