<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Booking;
use App\Models\Flight;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_search_flights()
    {
        $origin = Airport::factory()->create();
        $destination = Airport::factory()->create();
        $flight = Flight::factory()->create([
            'origin_airport_id' => $origin->id,
            'destination_airport_id' => $destination->id,
            'departure_time' => now()->addDays(2),
        ]);

        $response = $this->getJson("/api/flights/search?from={$origin->code}&to={$destination->code}&date=" . now()->addDays(2)->toDateString());

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $flight->id]);
    }

    public function test_user_can_create_booking()
    {
        $user = User::factory()->create();
        $flight = Flight::factory()->create(['base_price' => 100]);

        $this->actingAs($user);

        // Create specific seats for the test
        \App\Models\Seat::factory()->create(['flight_id' => $flight->id, 'seat_number' => '1A', 'is_booked' => false]);
        \App\Models\Seat::factory()->create(['flight_id' => $flight->id, 'seat_number' => '1B', 'is_booked' => false]);

        $response = $this->postJson('/api/bookings', [
            'flight_id' => $flight->id,
            'passengers' => [
                ['name' => 'John Doe', 'seat_number' => '1A'],
                ['name' => 'Jane Doe', 'seat_number' => '1B'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['total_price' => 200, 'status' => 'pending']);

        $this->assertDatabaseHas('bookings', ['user_id' => $user->id, 'flight_id' => $flight->id]);
        $this->assertDatabaseHas('passengers', ['name' => 'John Doe']);
    }

    public function test_user_can_pay_for_booking()
    {
        $user = User::factory()->create();
        $booking = Booking::create([
            'user_id' => $user->id,
            'flight_id' => Flight::factory()->create()->id,
            'total_price' => 100,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'pnr' => 'ABC1234',
        ]);

        $this->actingAs($user);

        $response = $this->postJson('/api/payments', [
            'booking_id' => $booking->id,
            'payment_method' => 'credit_card',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['message' => 'Payment successful']);

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'payment_status' => 'paid', 'status' => 'confirmed']);
    }

    public function test_user_can_view_booking_history()
    {
        $user = User::factory()->create();
        Booking::create([
            'user_id' => $user->id,
            'flight_id' => Flight::factory()->create()->id,
            'total_price' => 100,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'pnr' => 'XYZ789',
        ]);

        $this->actingAs($user);

        $response = $this->getJson('/api/bookings');

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }
}
