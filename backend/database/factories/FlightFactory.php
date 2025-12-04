<?php

namespace Database\Factories;

use App\Models\Airline;
use App\Models\Airport;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Flight>
 */
class FlightFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Generate flights for the next 30 days
        $departureDate = Carbon::now()->addDays($this->faker->numberBetween(1, 30));
        $departureHour = $this->faker->numberBetween(5, 22);
        $departureMinute = $this->faker->randomElement([0, 15, 30, 45]);
        $departure = $departureDate->setTime($departureHour, $departureMinute);
        
        // Flight duration between 1-14 hours
        $durationMinutes = $this->faker->numberBetween(60, 840);
        $arrival = $departure->copy()->addMinutes($durationMinutes);

        return [
            'airline_id' => Airline::factory(),
            'flight_number' => strtoupper($this->faker->bothify('??###')),
            'origin_airport_id' => Airport::factory(),
            'destination_airport_id' => Airport::factory(),
            'departure_time' => $departure,
            'arrival_time' => $arrival,
            'aircraft_type' => $this->faker->randomElement(['Boeing 737', 'Boeing 777', 'Boeing 787', 'Airbus A320', 'Airbus A350', 'Airbus A380']),
            'base_price' => $this->faker->randomFloat(2, 150, 1500),
        ];
    }
}
