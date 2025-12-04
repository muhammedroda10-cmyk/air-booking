<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Airport>
 */
class AirportFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->city . ' International Airport',
            'code' => strtoupper($this->faker->unique()->lexify('???')),
            'city' => $this->faker->city,
            'country' => $this->faker->country,
        ];
    }
}
