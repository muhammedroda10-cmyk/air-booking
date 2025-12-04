<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class HotelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $hotels = [
            [
                'name' => 'Grand Plaza Dubai',
                'city' => 'Dubai',
                'country' => 'UAE',
                'description' => 'Luxury hotel in the heart of Dubai with stunning views of the Burj Khalifa.',
                'address' => '1 Sheikh Zayed Road',
                'rating' => 4.8,
                'image_url' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                'rooms' => [
                    ['type' => 'Deluxe King', 'price' => 250, 'capacity' => 2, 'amenities' => ['Wifi', 'Breakfast', 'Pool View']],
                    ['type' => 'Executive Suite', 'price' => 500, 'capacity' => 3, 'amenities' => ['Wifi', 'Breakfast', 'Lounge Access', 'Jacuzzi']],
                ]
            ],
            [
                'name' => 'London City Stay',
                'city' => 'London',
                'country' => 'UK',
                'description' => 'Modern comfort near major attractions and transport links.',
                'address' => '123 Oxford Street',
                'rating' => 4.2,
                'image_url' => 'https://images.unsplash.com/photo-1529290130-4ca3753253ae?auto=format&fit=crop&w=800&q=80',
                'rooms' => [
                    ['type' => 'Standard Double', 'price' => 150, 'capacity' => 2, 'amenities' => ['Wifi', 'TV']],
                    ['type' => 'Family Room', 'price' => 280, 'capacity' => 4, 'amenities' => ['Wifi', 'Kitchenette']],
                ]
            ],
            [
                'name' => 'New York Central',
                'city' => 'New York',
                'country' => 'USA',
                'description' => 'Experience the energy of NYC from this centrally located hotel.',
                'address' => '456 5th Avenue',
                'rating' => 4.5,
                'image_url' => 'https://images.unsplash.com/photo-1496417263034-38ec4f0d665a?auto=format&fit=crop&w=800&q=80',
                'rooms' => [
                    ['type' => 'Queen Room', 'price' => 200, 'capacity' => 2, 'amenities' => ['Wifi', 'City View']],
                    ['type' => 'Penthouse Suite', 'price' => 800, 'capacity' => 4, 'amenities' => ['Wifi', 'Breakfast', 'Terrace', 'Butler Service']],
                ]
            ],
        ];

        foreach ($hotels as $hotelData) {
            $rooms = $hotelData['rooms'];
            unset($hotelData['rooms']);
            
            $hotel = \App\Models\Hotel::create($hotelData);
            
            foreach ($rooms as $room) {
                $hotel->rooms()->create($room);
            }
        }
    }
}
