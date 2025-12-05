<?php

namespace App\DTOs\Flight;

use Carbon\Carbon;

class FlightSearchRequest
{
    public function __construct(
        public readonly string $originCode,
        public readonly string $destinationCode,
        public readonly Carbon $departureDate,
        public readonly ?Carbon $returnDate = null,
        public readonly int $adults = 1,
        public readonly int $children = 0,
        public readonly int $infants = 0,
        public readonly string $cabin = 'economy',
        public readonly string $tripType = 'oneWay',
        public readonly ?string $currency = 'USD',
        public readonly ?string $language = 'EN',
        public readonly array $filters = [],
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            originCode: $data['from'] ?? $data['origin'] ?? '',
            destinationCode: $data['to'] ?? $data['destination'] ?? '',
            departureDate: Carbon::parse($data['date'] ?? $data['departure_date'] ?? now()),
            returnDate: isset($data['return_date']) ? Carbon::parse($data['return_date']) : null,
            adults: (int)($data['adults'] ?? 1),
            children: (int)($data['children'] ?? 0),
            infants: (int)($data['infants'] ?? 0),
            cabin: strtolower($data['cabin'] ?? 'economy'),
            tripType: $data['trip_type'] ?? $data['tripType'] ?? 'oneWay',
            currency: $data['currency'] ?? 'USD',
            language: strtoupper($data['language'] ?? $data['lang'] ?? 'EN'),
            filters: [
                'min_price' => $data['min_price'] ?? null,
                'max_price' => $data['max_price'] ?? null,
                'airline_id' => $data['airline_id'] ?? null,
                'stops' => $data['stops'] ?? null,
            ],
        );
    }

    public function getTotalPassengers(): int
    {
        return $this->adults + $this->children + $this->infants;
    }

    public function isRoundTrip(): bool
    {
        return $this->tripType === 'roundTrip' && $this->returnDate !== null;
    }

    public function toArray(): array
    {
        return [
            'origin' => $this->originCode,
            'destination' => $this->destinationCode,
            'departure_date' => $this->departureDate->toDateString(),
            'return_date' => $this->returnDate?->toDateString(),
            'adults' => $this->adults,
            'children' => $this->children,
            'infants' => $this->infants,
            'cabin' => $this->cabin,
            'trip_type' => $this->tripType,
            'currency' => $this->currency,
            'language' => $this->language,
            'filters' => $this->filters,
        ];
    }
}
