<?php

namespace Database\Seeders;

use App\Models\Airline;
use App\Models\Airport;
use Illuminate\Database\Seeder;

class RealDataSeeder extends Seeder
{
    public function run(): void
    {
        // Real Airlines
        $airlines = [
            ['name' => 'Emirates', 'code' => 'EK', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Emirates_logo.svg'],
            ['name' => 'Qatar Airways', 'code' => 'QR', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/en/9/9b/Qatar_Airways_Logo.svg'],
            ['name' => 'Singapore Airlines', 'code' => 'SQ', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/en/6/6d/Singapore_Airlines_Logo_2.svg'],
            ['name' => 'Cathay Pacific', 'code' => 'CX', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/en/1/17/Cathay_Pacific_logo.svg'],
            ['name' => 'Lufthansa', 'code' => 'LH', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lufthansa_Logo_2018.svg'],
            ['name' => 'British Airways', 'code' => 'BA', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/en/6/65/British_Airways_Logo.svg'],
            ['name' => 'Air France', 'code' => 'AF', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/en/e/e4/Air_France_Logo.svg'],
            ['name' => 'Delta Air Lines', 'code' => 'DL', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Delta_logo.svg'],
            ['name' => 'United Airlines', 'code' => 'UA', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/en/e/e0/United_Airlines_Logo.svg'],
            ['name' => 'American Airlines', 'code' => 'AA', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/en/2/23/American_Airlines_logo_2013.svg'],
            ['name' => 'Turkish Airlines', 'code' => 'TK', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/0/00/Turkish_Airlines_logo_2019.svg'],
            ['name' => 'Etihad Airways', 'code' => 'EY', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/en/e/e4/Etihad_Airways_Logo.svg'],
            ['name' => 'ANA All Nippon Airways', 'code' => 'NH', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/9/9c/ANA_logo.svg'],
            ['name' => 'Japan Airlines', 'code' => 'JL', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/en/d/dd/Japan_Airlines_Logo_%282011%29.svg'],
            ['name' => 'Qantas', 'code' => 'QF', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/en/0/02/Qantas_Airways_logo_2016.svg'],
            ['name' => 'Swiss International Air Lines', 'code' => 'LX', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Swiss_International_Air_Lines_Logo_2011.svg'],
            ['name' => 'Korean Air', 'code' => 'KE', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Korean_Air_logo.svg'],
            ['name' => 'Air New Zealand', 'code' => 'NZ', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Air_New_Zealand_logo.svg'],
            ['name' => 'Virgin Atlantic', 'code' => 'VS', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/en/2/29/Virgin_Atlantic_logo.svg'],
            ['name' => 'KLM Royal Dutch Airlines', 'code' => 'KL', 'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/c/c7/KLM_logo.svg'],
        ];

        foreach ($airlines as $airline) {
            Airline::updateOrCreate(['code' => $airline['code']], $airline);
        }

        // Real Airports
        $airports = [
            ['name' => 'Hartsfield-Jackson Atlanta International Airport', 'code' => 'ATL', 'city' => 'Atlanta', 'country' => 'USA'],
            ['name' => 'Beijing Capital International Airport', 'code' => 'PEK', 'city' => 'Beijing', 'country' => 'China'],
            ['name' => 'Los Angeles International Airport', 'code' => 'LAX', 'city' => 'Los Angeles', 'country' => 'USA'],
            ['name' => 'Dubai International Airport', 'code' => 'DXB', 'city' => 'Dubai', 'country' => 'UAE'],
            ['name' => 'Tokyo Haneda Airport', 'code' => 'HND', 'city' => 'Tokyo', 'country' => 'Japan'],
            ['name' => 'O\'Hare International Airport', 'code' => 'ORD', 'city' => 'Chicago', 'country' => 'USA'],
            ['name' => 'Heathrow Airport', 'code' => 'LHR', 'city' => 'London', 'country' => 'UK'],
            ['name' => 'Hong Kong International Airport', 'code' => 'HKG', 'city' => 'Hong Kong', 'country' => 'Hong Kong'],
            ['name' => 'Shanghai Pudong International Airport', 'code' => 'PVG', 'city' => 'Shanghai', 'country' => 'China'],
            ['name' => 'Paris Charles de Gaulle Airport', 'code' => 'CDG', 'city' => 'Paris', 'country' => 'France'],
            ['name' => 'Amsterdam Airport Schiphol', 'code' => 'AMS', 'city' => 'Amsterdam', 'country' => 'Netherlands'],
            ['name' => 'Indira Gandhi International Airport', 'code' => 'DEL', 'city' => 'New Delhi', 'country' => 'India'],
            ['name' => 'Guangzhou Baiyun International Airport', 'code' => 'CAN', 'city' => 'Guangzhou', 'country' => 'China'],
            ['name' => 'Frankfurt Airport', 'code' => 'FRA', 'city' => 'Frankfurt', 'country' => 'Germany'],
            ['name' => 'Dallas/Fort Worth International Airport', 'code' => 'DFW', 'city' => 'Dallas', 'country' => 'USA'],
            ['name' => 'Incheon International Airport', 'code' => 'ICN', 'city' => 'Seoul', 'country' => 'South Korea'],
            ['name' => 'Istanbul Airport', 'code' => 'IST', 'city' => 'Istanbul', 'country' => 'Turkey'],
            ['name' => 'Denver International Airport', 'code' => 'DEN', 'city' => 'Denver', 'country' => 'USA'],
            ['name' => 'Singapore Changi Airport', 'code' => 'SIN', 'city' => 'Singapore', 'country' => 'Singapore'],
            ['name' => 'Suvarnabhumi Airport', 'code' => 'BKK', 'city' => 'Bangkok', 'country' => 'Thailand'],
            ['name' => 'John F. Kennedy International Airport', 'code' => 'JFK', 'city' => 'New York', 'country' => 'USA'],
            ['name' => 'Kuala Lumpur International Airport', 'code' => 'KUL', 'city' => 'Kuala Lumpur', 'country' => 'Malaysia'],
            ['name' => 'Madrid-Barajas Airport', 'code' => 'MAD', 'city' => 'Madrid', 'country' => 'Spain'],
            ['name' => 'San Francisco International Airport', 'code' => 'SFO', 'city' => 'San Francisco', 'country' => 'USA'],
            ['name' => 'Chengdu Shuangliu International Airport', 'code' => 'CTU', 'city' => 'Chengdu', 'country' => 'China'],
            ['name' => 'Soekarno-Hatta International Airport', 'code' => 'CGK', 'city' => 'Jakarta', 'country' => 'Indonesia'],
            ['name' => 'Shenzhen Bao\'an International Airport', 'code' => 'SZX', 'city' => 'Shenzhen', 'country' => 'China'],
            ['name' => 'Barcelona-El Prat Airport', 'code' => 'BCN', 'city' => 'Barcelona', 'country' => 'Spain'],
            ['name' => 'Mumbai Chhatrapati Shivaji Maharaj International Airport', 'code' => 'BOM', 'city' => 'Mumbai', 'country' => 'India'],
            ['name' => 'Seattle-Tacoma International Airport', 'code' => 'SEA', 'city' => 'Seattle', 'country' => 'USA'],
            ['name' => 'Toronto Pearson International Airport', 'code' => 'YYZ', 'city' => 'Toronto', 'country' => 'Canada'],
            ['name' => 'Hamad International Airport', 'code' => 'DOH', 'city' => 'Doha', 'country' => 'Qatar'],
            ['name' => 'Mexico City International Airport', 'code' => 'MEX', 'city' => 'Mexico City', 'country' => 'Mexico'],
            ['name' => 'Narita International Airport', 'code' => 'NRT', 'city' => 'Tokyo', 'country' => 'Japan'],
            ['name' => 'Munich Airport', 'code' => 'MUC', 'city' => 'Munich', 'country' => 'Germany'],
            ['name' => 'Sydney Kingsford Smith Airport', 'code' => 'SYD', 'city' => 'Sydney', 'country' => 'Australia'],
            ['name' => 'King Abdulaziz International Airport', 'code' => 'JED', 'city' => 'Jeddah', 'country' => 'Saudi Arabia'],
            ['name' => 'King Khalid International Airport', 'code' => 'RUH', 'city' => 'Riyadh', 'country' => 'Saudi Arabia'],
            ['name' => 'Cairo International Airport', 'code' => 'CAI', 'city' => 'Cairo', 'country' => 'Egypt'],
        ];

        foreach ($airports as $airport) {
            Airport::updateOrCreate(['code' => $airport['code']], $airport);
        }
    }
}
