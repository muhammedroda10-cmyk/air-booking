<?php

namespace App\DTOs\Flight;

class NormalizedSegment
{
    public function __construct(
        public readonly NormalizedLocation $departure,
        public readonly NormalizedLocation $arrival,
        public readonly NormalizedAirline $airline,
        public readonly ?NormalizedAirline $operatingAirline,
        public readonly string $flightNumber,
        public readonly string $cabin,
        public readonly int $duration, // in minutes
        public readonly ?string $aircraft = null,
        public readonly ?string $luggage = null,
        public readonly ?string $bookingClass = null,
        public readonly ?string $fareBasis = null,
        public readonly int $capacity = 0,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            departure: NormalizedLocation::fromArray($data['departure'] ?? []),
            arrival: NormalizedLocation::fromArray($data['arrival'] ?? []),
            airline: NormalizedAirline::fromArray($data['airline'] ?? []),
            operatingAirline: isset($data['operatingAirline']) 
                ? NormalizedAirline::fromArray($data['operatingAirline']) 
                : null,
            flightNumber: $data['flight_number'] ?? '',
            cabin: self::normalizeCabin($data['cabin'] ?? 'Economy'),
            duration: self::parseDuration($data['duration'] ?? '0:0'),
            aircraft: $data['airplane'] ?? null,
            luggage: self::normalizeLuggage($data['luggage'] ?? null),
            bookingClass: $data['resBookDesigCode'] ?? null,
            fareBasis: $data['FareBasis'] ?? null,
            capacity: $data['capacity'] ?? 0,
        );
    }

    /**
     * Parse duration string to minutes.
     * Handles formats like "3:30" (3h 30m) or "195:0" (195h 0m which is likely wrong)
     */
    private static function parseDuration(string $duration): int
    {
        if (str_contains($duration, ':')) {
            $parts = explode(':', $duration);
            $hours = (int)($parts[0] ?? 0);
            $minutes = (int)($parts[1] ?? 0);
            
            // If hours is unreasonably high (>24), it might be total minutes
            if ($hours > 24) {
                return $hours; // Assume it's already in minutes
            }
            
            return ($hours * 60) + $minutes;
        }
        
        return (int)$duration;
    }

    /**
     * Normalize cabin class to standard format.
     */
    private static function normalizeCabin(string $cabin): string
    {
        $cabin = strtolower(trim($cabin));
        
        return match($cabin) {
            'economy', 'y' => 'Economy',
            'premium economy', 'premium_economy', 'w' => 'Premium Economy',
            'business', 'c', 'j' => 'Business',
            'first', 'f' => 'First',
            default => ucfirst($cabin),
        };
    }

    /**
     * Normalize luggage info.
     */
    private static function normalizeLuggage(?string $luggage): ?string
    {
        if (!$luggage) return null;
        
        // Clean up format like "30 KG/ADT " -> "30 KG"
        $luggage = trim($luggage);
        $luggage = preg_replace('/\/[A-Z]+\s*$/', '', $luggage);
        
        return trim($luggage) ?: null;
    }

    public function toArray(): array
    {
        return [
            'departure' => $this->departure->toArray(),
            'arrival' => $this->arrival->toArray(),
            'airline' => $this->airline->toArray(),
            'operating_airline' => $this->operatingAirline?->toArray(),
            'flight_number' => $this->flightNumber,
            'cabin' => $this->cabin,
            'duration' => $this->duration,
            'duration_formatted' => $this->formatDuration(),
            'aircraft' => $this->aircraft,
            'luggage' => $this->luggage,
            'booking_class' => $this->bookingClass,
            'fare_basis' => $this->fareBasis,
            'capacity' => $this->capacity,
        ];
    }

    public function formatDuration(): string
    {
        $hours = floor($this->duration / 60);
        $minutes = $this->duration % 60;
        
        if ($hours > 0 && $minutes > 0) {
            return "{$hours}h {$minutes}m";
        } elseif ($hours > 0) {
            return "{$hours}h";
        } else {
            return "{$minutes}m";
        }
    }
}
