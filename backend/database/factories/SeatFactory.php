<?php

namespace Database\Factories;

use App\Models\Flight;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Seat>
 */
class SeatFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'flight_id' => Flight::factory(),
            'seat_number' => strtoupper($this->faker->bothify('?#')),
            'class' => $this->faker->randomElement(['economy', 'business', 'first']),
            'is_booked' => false,
        ];
    }
}
