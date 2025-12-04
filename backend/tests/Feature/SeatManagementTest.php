<?php

namespace Tests\Feature;

use App\Models\Flight;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeatManagementTest extends TestCase
{
    // We don't use RefreshDatabase here because we want to use the seeded data or we should seed manually in test.
    // Actually, RefreshDatabase is better for isolation. Let's use it and seed what we need.
    use RefreshDatabase;

    public function test_can_fetch_seats_for_flight()
    {
        $user = User::factory()->create();
        $flight = Flight::factory()->create();
        // Create seats
        \App\Models\Seat::factory()->create(['flight_id' => $flight->id, 'seat_number' => '1A', 'is_booked' => false]);
        \App\Models\Seat::factory()->create(['flight_id' => $flight->id, 'seat_number' => '1B', 'is_booked' => true]);

        $response = $this->actingAs($user)->getJson("/api/flights/{$flight->id}/seats");

        $response->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJsonFragment(['seat_number' => '1A', 'is_booked' => 0]) // 0 for false in JSON/DB usually
            ->assertJsonFragment(['seat_number' => '1B', 'is_booked' => 1]);
    }

    public function test_cannot_book_invalid_seat()
    {
        $user = User::factory()->create();
        $flight = Flight::factory()->create();
        // Create seat 1A
        \App\Models\Seat::factory()->create(['flight_id' => $flight->id, 'seat_number' => '1A', 'is_booked' => false]);

        $response = $this->actingAs($user)->postJson('/api/bookings', [
            'flight_id' => $flight->id,
            'passengers' => [
                ['name' => 'John Doe', 'seat_number' => '99Z'] // Invalid seat
            ]
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Seat 99Z does not exist on this flight.']);
    }

    public function test_cannot_book_already_booked_seat()
    {
        $user = User::factory()->create();
        $flight = Flight::factory()->create();
        // Create seat 1A booked
        \App\Models\Seat::factory()->create(['flight_id' => $flight->id, 'seat_number' => '1A', 'is_booked' => true]);

        $response = $this->actingAs($user)->postJson('/api/bookings', [
            'flight_id' => $flight->id,
            'passengers' => [
                ['name' => 'John Doe', 'seat_number' => '1A']
            ]
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Seat 1A is already booked.']);
    }

    public function test_booking_marks_seat_as_booked()
    {
        $user = User::factory()->create();
        $flight = Flight::factory()->create();
        // Create seat 1A available
        $seat = \App\Models\Seat::factory()->create(['flight_id' => $flight->id, 'seat_number' => '1A', 'is_booked' => false]);

        $response = $this->actingAs($user)->postJson('/api/bookings', [
            'flight_id' => $flight->id,
            'passengers' => [
                ['name' => 'John Doe', 'seat_number' => '1A']
            ]
        ]);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('seats', [
            'id' => $seat->id,
            'is_booked' => true
        ]);
    }
}
