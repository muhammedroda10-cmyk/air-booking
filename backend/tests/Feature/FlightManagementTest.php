<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Flight;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FlightManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_access_flight_management()
    {
        $user = User::factory()->create(['role' => 'user']);
        $this->actingAs($user);

        $this->getJson('/api/airlines')->assertStatus(403);
        $this->getJson('/api/flights')->assertStatus(403);
    }

    public function test_admin_can_manage_airports()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        // Create
        $response = $this->postJson('/api/airports', [
            'name' => 'Test Airport',
            'code' => 'TST',
            'city' => 'Test City',
            'country' => 'Test Country',
        ]);
        $response->assertStatus(201);

        // Read
        $this->getJson('/api/airports')->assertStatus(200)->assertJsonCount(1);

        // Update
        $airport = Airport::first();
        $this->putJson("/api/airports/{$airport->id}", ['name' => 'Updated Airport'])
            ->assertStatus(200);
        
        $this->assertDatabaseHas('airports', ['name' => 'Updated Airport']);

        // Delete
        $this->deleteJson("/api/airports/{$airport->id}")->assertStatus(204);
        $this->assertDatabaseMissing('airports', ['id' => $airport->id]);
    }

    public function test_admin_can_manage_airlines()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        // Create
        $response = $this->postJson('/api/airlines', [
            'name' => 'Test Airline',
            'code' => 'TA',
        ]);
        $response->assertStatus(201);

        // Read
        $this->getJson('/api/airlines')->assertStatus(200)->assertJsonCount(1);

        // Update
        $airline = Airline::first();
        $this->putJson("/api/airlines/{$airline->id}", ['name' => 'Updated Airline'])
            ->assertStatus(200);

        // Delete
        $this->deleteJson("/api/airlines/{$airline->id}")->assertStatus(204);
    }

    public function test_admin_can_manage_flights()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $airline = Airline::factory()->create();
        $origin = Airport::factory()->create();
        $destination = Airport::factory()->create();

        // Create
        $response = $this->postJson('/api/flights', [
            'airline_id' => $airline->id,
            'flight_number' => 'FL123',
            'origin_airport_id' => $origin->id,
            'destination_airport_id' => $destination->id,
            'departure_time' => now()->addDay()->toDateTimeString(),
            'arrival_time' => now()->addDay()->addHours(2)->toDateTimeString(),
            'aircraft_type' => 'Boeing 737',
            'base_price' => 100.00,
        ]);
        $response->assertStatus(201);

        // Read
        $this->getJson('/api/flights')->assertStatus(200)->assertJsonCount(1);

        // Update
        $flight = Flight::first();
        $this->putJson("/api/flights/{$flight->id}", ['base_price' => 150.00])
            ->assertStatus(200);

        // Delete
        $this->deleteJson("/api/flights/{$flight->id}")->assertStatus(204);
    }
}
