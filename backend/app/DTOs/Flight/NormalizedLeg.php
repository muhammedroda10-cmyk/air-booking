<?php

namespace App\DTOs\Flight;

class NormalizedLeg
{
    public function __construct(
        public readonly NormalizedLocation $departure,
        public readonly NormalizedLocation $arrival,
        public readonly int $duration, // in minutes
        public readonly int $stops,
        public readonly string $cabin,
        public readonly array $segments, // NormalizedSegment[]
        public readonly ?NormalizedAirline $airline = null,
        public readonly ?string $flightNumber = null,
    ) {
    }

    public static function fromArray(array $data): self
    {
        $info = $data['info'] ?? $data;
        $segmentsData = $data['segments'] ?? [];

        $segments = array_map(
            fn($segment) => NormalizedSegment::fromArray($segment),
            $segmentsData
        );

        // Get first segment for departure, last for arrival if not in info
        $firstSegment = $segments[0] ?? null;
        $lastSegment = end($segments) ?: $firstSegment;

        return new self(
            departure: isset($info['departure'])
            ? NormalizedLocation::fromArray($info['departure'])
            : ($firstSegment?->departure ?? NormalizedLocation::fromArray([])),
            arrival: isset($info['arrival'])
            ? NormalizedLocation::fromArray($info['arrival'])
            : ($lastSegment?->arrival ?? NormalizedLocation::fromArray([])),
            duration: self::parseDuration($info['duration'] ?? '0:0'),
            stops: $info['connections'] ?? (count($segments) - 1),
            cabin: self::normalizeCabin($info['cabin'] ?? 'Economy'),
            segments: $segments,
            airline: isset($info['airline']) ? NormalizedAirline::fromArray($info['airline']) : null,
            flightNumber: $info['flight_number'] ?? null,
        );
    }

    private static function parseDuration(string $duration): int
    {
        if (str_contains($duration, ':')) {
            $parts = explode(':', $duration);
            $hours = (int) ($parts[0] ?? 0);
            $minutes = (int) ($parts[1] ?? 0);

            return ($hours * 60) + $minutes;
        }

        return (int) $duration;
    }

    private static function normalizeCabin(string $cabin): string
    {
        $cabin = strtolower(trim($cabin));

        return match ($cabin) {
            'economy', 'y' => 'Economy',
            'premium economy', 'premium_economy', 'w' => 'Premium Economy',
            'business', 'c', 'j' => 'Business',
            'first', 'f' => 'First',
            default => ucfirst($cabin),
        };
    }

    public function toArray(): array
    {
        return [
            'departure' => $this->departure->toArray(),
            'arrival' => $this->arrival->toArray(),
            'duration' => $this->duration,
            'duration_formatted' => $this->formatDuration(),
            'stops' => $this->stops,
            'cabin' => $this->cabin,
            'airline' => $this->airline?->toArray(),
            'flight_number' => $this->flightNumber,
            'segments' => array_map(fn($s) => $s->toArray(), $this->segments),
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
