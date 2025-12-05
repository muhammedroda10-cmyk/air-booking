<?php

namespace Database\Seeders;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Flight;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class IranianFlightsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding Iranian Airlines...');
        $this->seedIranianAirlines();

        $this->command->info('Seeding Iranian Airports...');
        $this->seedIranianAirports();

        $this->command->info('Seeding Iranian Flights...');
        $this->seedIranianFlights();

        $this->command->info('Iranian flights seeder completed!');
    }

    protected function seedIranianAirlines(): void
    {
        $airlines = [
            ['name' => 'Iran Air', 'code' => 'IR', 'logo_url' => null],
            ['name' => 'Mahan Air', 'code' => 'W5', 'logo_url' => null],
            ['name' => 'Aseman Airlines', 'code' => 'EP', 'logo_url' => null],
            ['name' => 'Kish Air', 'code' => 'Y9', 'logo_url' => null],
            ['name' => 'Qeshm Air', 'code' => 'QB', 'logo_url' => null],
            ['name' => 'Taban Air', 'code' => 'HH', 'logo_url' => null],
            ['name' => 'Ata Airlines', 'code' => 'I3', 'logo_url' => null],
            ['name' => 'Varesh Airlines', 'code' => 'IV', 'logo_url' => null],
            ['name' => 'Caspian Airlines', 'code' => 'RV', 'logo_url' => null],
            ['name' => 'Zagros Airlines', 'code' => 'IZG', 'logo_url' => null],
        ];

        foreach ($airlines as $airline) {
            Airline::updateOrCreate(['code' => $airline['code']], $airline);
        }
    }

    protected function seedIranianAirports(): void
    {
        $airports = [
            // Major International Airports
            ['name' => 'Imam Khomeini International Airport', 'code' => 'IKA', 'city' => 'Tehran', 'country' => 'Iran'],
            ['name' => 'Mehrabad International Airport', 'code' => 'THR', 'city' => 'Tehran', 'country' => 'Iran'],
            ['name' => 'Shahid Hasheminejad Airport', 'code' => 'MHD', 'city' => 'Mashhad', 'country' => 'Iran'],
            ['name' => 'Shiraz International Airport', 'code' => 'SYZ', 'city' => 'Shiraz', 'country' => 'Iran'],
            ['name' => 'Isfahan International Airport', 'code' => 'IFN', 'city' => 'Isfahan', 'country' => 'Iran'],
            ['name' => 'Tabriz International Airport', 'code' => 'TBZ', 'city' => 'Tabriz', 'country' => 'Iran'],

            // Other Major Airports
            ['name' => 'Kish International Airport', 'code' => 'KIH', 'city' => 'Kish Island', 'country' => 'Iran'],
            ['name' => 'Ahvaz International Airport', 'code' => 'AWZ', 'city' => 'Ahvaz', 'country' => 'Iran'],
            ['name' => 'Kerman Airport', 'code' => 'KER', 'city' => 'Kerman', 'country' => 'Iran'],
            ['name' => 'Bandar Abbas International Airport', 'code' => 'BND', 'city' => 'Bandar Abbas', 'country' => 'Iran'],
            ['name' => 'Qeshm International Airport', 'code' => 'GSM', 'city' => 'Qeshm', 'country' => 'Iran'],
            ['name' => 'Yazd Airport', 'code' => 'AZD', 'city' => 'Yazd', 'country' => 'Iran'],
            ['name' => 'Rasht Airport', 'code' => 'RAS', 'city' => 'Rasht', 'country' => 'Iran'],
            ['name' => 'Kermanshah Airport', 'code' => 'KSH', 'city' => 'Kermanshah', 'country' => 'Iran'],
            ['name' => 'Urmia Airport', 'code' => 'OMH', 'city' => 'Urmia', 'country' => 'Iran'],
            ['name' => 'Zahedan Airport', 'code' => 'ZAH', 'city' => 'Zahedan', 'country' => 'Iran'],
            ['name' => 'Sari Dasht-e Naz Airport', 'code' => 'SRY', 'city' => 'Sari', 'country' => 'Iran'],
            ['name' => 'Birjand Airport', 'code' => 'XBJ', 'city' => 'Birjand', 'country' => 'Iran'],
            ['name' => 'Bushehr Airport', 'code' => 'BUZ', 'city' => 'Bushehr', 'country' => 'Iran'],
            ['name' => 'Gorgan Airport', 'code' => 'GBT', 'city' => 'Gorgan', 'country' => 'Iran'],
            ['name' => 'Ardabil Airport', 'code' => 'ADU', 'city' => 'Ardabil', 'country' => 'Iran'],
            ['name' => 'Sanandaj Airport', 'code' => 'SDG', 'city' => 'Sanandaj', 'country' => 'Iran'],
            ['name' => 'Shahrekord Airport', 'code' => 'CQD', 'city' => 'Shahrekord', 'country' => 'Iran'],
            ['name' => 'Hamadan Airport', 'code' => 'HDM', 'city' => 'Hamadan', 'country' => 'Iran'],
            ['name' => 'Arak Airport', 'code' => 'AJK', 'city' => 'Arak', 'country' => 'Iran'],
            ['name' => 'Bojnord Airport', 'code' => 'BJB', 'city' => 'Bojnord', 'country' => 'Iran'],
            ['name' => 'Dezful Airport', 'code' => 'DEF', 'city' => 'Dezful', 'country' => 'Iran'],
            ['name' => 'Chabahar Airport', 'code' => 'ZBR', 'city' => 'Chabahar', 'country' => 'Iran'],
            ['name' => 'Ilam Airport', 'code' => 'IIL', 'city' => 'Ilam', 'country' => 'Iran'],
            ['name' => 'Abadan Airport', 'code' => 'ABD', 'city' => 'Abadan', 'country' => 'Iran'],

            // Add Damascus for connections
            ['name' => 'Damascus International Airport', 'code' => 'DAM', 'city' => 'Damascus', 'country' => 'Syria'],
        ];

        foreach ($airports as $airport) {
            Airport::updateOrCreate(['code' => $airport['code']], $airport);
        }
    }

    /**
     * Create a flight with correct columns
     */
    protected function createFlight(array $data): void
    {
        Flight::create([
            'flight_number' => $data['flight_number'],
            'airline_id' => $data['airline_id'],
            'origin_airport_id' => $data['origin_airport_id'],
            'destination_airport_id' => $data['destination_airport_id'],
            'departure_time' => $data['departure_time'],
            'arrival_time' => $data['arrival_time'],
            'base_price' => $data['base_price'],
            'aircraft_type' => $data['aircraft_type'],
            'default_baggage' => $data['default_baggage'] ?? 23,
            'default_cabin_baggage' => $data['default_cabin_baggage'] ?? 7,
        ]);
    }

    protected function seedIranianFlights(): void
    {
        // Get Iranian airports
        $airports = Airport::where('country', 'Iran')->get()->keyBy('code');
        $damascus = Airport::where('code', 'DAM')->first();

        // Get Iranian airlines
        $airlines = Airline::whereIn('code', ['IR', 'W5', 'EP', 'Y9', 'QB', 'HH', 'I3', 'IV', 'RV', 'IZG'])->get();

        if ($airports->isEmpty() || $airlines->isEmpty()) {
            $this->command->error('No airports or airlines found. Run the seeder again.');
            return;
        }

        // Major city codes for popular routes
        $majorCities = ['IKA', 'THR', 'MHD', 'SYZ', 'IFN', 'TBZ', 'KIH', 'AWZ', 'BND'];
        $allCities = $airports->keys()->toArray();

        // Aircraft types
        $aircraftTypes = ['Airbus A320', 'Airbus A321', 'Boeing 737-800', 'Boeing 747', 'MD-82', 'Fokker 100', 'ATR 72'];

        $flightsCreated = 0;

        // Generate flights for the next 30 days
        for ($day = 0; $day < 30; $day++) {
            $date = Carbon::now()->addDays($day);

            // Create flights between major cities (multiple per day)
            foreach ($majorCities as $originCode) {
                foreach ($majorCities as $destCode) {
                    if ($originCode === $destCode)
                        continue;

                    $origin = $airports->get($originCode);
                    $destination = $airports->get($destCode);

                    if (!$origin || !$destination)
                        continue;

                    // 2-4 flights per major route per day
                    $flightsPerRoute = rand(2, 4);

                    for ($f = 0; $f < $flightsPerRoute; $f++) {
                        $airline = $airlines->random();
                        $departureHour = rand(5, 22);
                        $departureMinute = [0, 15, 30, 45][rand(0, 3)];

                        $departure = $date->copy()->setHour($departureHour)->setMinute($departureMinute)->setSecond(0);
                        $durationMinutes = rand(60, 180);
                        $arrival = $departure->copy()->addMinutes($durationMinutes);

                        $this->createFlight([
                            'flight_number' => $airline->code . rand(100, 999),
                            'airline_id' => $airline->id,
                            'origin_airport_id' => $origin->id,
                            'destination_airport_id' => $destination->id,
                            'departure_time' => $departure,
                            'arrival_time' => $arrival,
                            'base_price' => rand(80, 350),
                            'aircraft_type' => $aircraftTypes[array_rand($aircraftTypes)],
                        ]);
                        $flightsCreated++;
                    }
                }
            }

            // Create flights from major cities to smaller cities
            $smallerCities = array_diff($allCities, $majorCities);

            foreach ($majorCities as $originCode) {
                foreach ($smallerCities as $destCode) {
                    $origin = $airports->get($originCode);
                    $destination = $airports->get($destCode);

                    if (!$origin || !$destination)
                        continue;
                    if (rand(0, 2) < 1)
                        continue; // Skip some routes

                    // 1-2 flights per smaller route per day
                    $flightsPerRoute = rand(1, 2);

                    for ($f = 0; $f < $flightsPerRoute; $f++) {
                        $airline = $airlines->random();
                        $departure = $date->copy()->setHour(rand(6, 20))->setMinute([0, 15, 30, 45][rand(0, 3)])->setSecond(0);
                        $arrival = $departure->copy()->addMinutes(rand(45, 120));

                        $this->createFlight([
                            'flight_number' => $airline->code . rand(100, 999),
                            'airline_id' => $airline->id,
                            'origin_airport_id' => $origin->id,
                            'destination_airport_id' => $destination->id,
                            'departure_time' => $departure,
                            'arrival_time' => $arrival,
                            'base_price' => rand(60, 200),
                            'aircraft_type' => $aircraftTypes[array_rand($aircraftTypes)],
                        ]);
                        $flightsCreated++;
                    }

                    // Return flights
                    $airline = $airlines->random();
                    $departure = $date->copy()->setHour(rand(8, 21))->setMinute([0, 30][rand(0, 1)])->setSecond(0);
                    $arrival = $departure->copy()->addMinutes(rand(45, 120));

                    $this->createFlight([
                        'flight_number' => $airline->code . rand(100, 999),
                        'airline_id' => $airline->id,
                        'origin_airport_id' => $destination->id,
                        'destination_airport_id' => $origin->id,
                        'departure_time' => $departure,
                        'arrival_time' => $arrival,
                        'base_price' => rand(60, 200),
                        'aircraft_type' => $aircraftTypes[array_rand($aircraftTypes)],
                    ]);
                    $flightsCreated++;
                }
            }

            // International flights: Tehran <-> Damascus
            if ($damascus) {
                $tehranIKA = $airports->get('IKA');
                $mashhad = $airports->get('MHD');

                // IKA <-> DAM
                if ($tehranIKA) {
                    for ($i = 0; $i < 3; $i++) {
                        $airline = $airlines->whereIn('code', ['IR', 'W5'])->random();
                        $departure = $date->copy()->setHour(rand(6, 18))->setMinute([0, 30][rand(0, 1)])->setSecond(0);

                        $this->createFlight([
                            'flight_number' => $airline->code . rand(700, 799),
                            'airline_id' => $airline->id,
                            'origin_airport_id' => $tehranIKA->id,
                            'destination_airport_id' => $damascus->id,
                            'departure_time' => $departure,
                            'arrival_time' => $departure->copy()->addMinutes(rand(150, 210)),
                            'base_price' => rand(180, 400),
                            'aircraft_type' => 'Airbus A320',
                        ]);
                        $flightsCreated++;

                        // Return flight
                        $departure2 = $date->copy()->setHour(rand(10, 22))->setMinute([0, 30][rand(0, 1)])->setSecond(0);
                        $this->createFlight([
                            'flight_number' => $airline->code . rand(700, 799),
                            'airline_id' => $airline->id,
                            'origin_airport_id' => $damascus->id,
                            'destination_airport_id' => $tehranIKA->id,
                            'departure_time' => $departure2,
                            'arrival_time' => $departure2->copy()->addMinutes(rand(150, 210)),
                            'base_price' => rand(180, 400),
                            'aircraft_type' => 'Airbus A320',
                        ]);
                        $flightsCreated++;
                    }
                }

                // MHD <-> DAM
                if ($mashhad) {
                    for ($i = 0; $i < 2; $i++) {
                        $airline = $airlines->whereIn('code', ['W5', 'EP'])->random();
                        $departure = $date->copy()->setHour(rand(7, 16))->setMinute([0, 30][rand(0, 1)])->setSecond(0);

                        $this->createFlight([
                            'flight_number' => $airline->code . rand(800, 899),
                            'airline_id' => $airline->id,
                            'origin_airport_id' => $mashhad->id,
                            'destination_airport_id' => $damascus->id,
                            'departure_time' => $departure,
                            'arrival_time' => $departure->copy()->addMinutes(rand(240, 300)),
                            'base_price' => rand(200, 450),
                            'aircraft_type' => 'Boeing 737-800',
                        ]);
                        $flightsCreated++;

                        // Return
                        $departure2 = $date->copy()->setHour(rand(12, 23))->setMinute([0, 30][rand(0, 1)])->setSecond(0);
                        $this->createFlight([
                            'flight_number' => $airline->code . rand(800, 899),
                            'airline_id' => $airline->id,
                            'origin_airport_id' => $damascus->id,
                            'destination_airport_id' => $mashhad->id,
                            'departure_time' => $departure2,
                            'arrival_time' => $departure2->copy()->addMinutes(rand(240, 300)),
                            'base_price' => rand(200, 450),
                            'aircraft_type' => 'Boeing 737-800',
                        ]);
                        $flightsCreated++;
                    }
                }
            }
        }

        $this->command->info("Created {$flightsCreated} Iranian flights!");
    }
}
