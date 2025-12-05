<?php

namespace App\DTOs\Flight;

use Carbon\Carbon;

class NormalizedLocation
{
    public function __construct(
        public readonly string $city,
        public readonly string $airportCode,
        public readonly string $airportName,
        public readonly ?int $airportId = null,
        public readonly ?int $cityId = null,
        public readonly ?string $terminal = null,
        public readonly ?string $country = null,
        public readonly ?string $countryCode = null,
        public readonly ?Carbon $dateTime = null,
        public readonly ?string $time = null,
        public readonly ?array $translations = null,
    ) {}

    public static function fromArray(array $data): self
    {
        $airport = $data['airport'] ?? [];
        $city = $airport['city'] ?? [];
        $country = $city['country'] ?? [];

        return new self(
            city: $data['city'] ?? $city['en'] ?? '',
            airportCode: $airport['abb'] ?? '',
            airportName: $airport['en'] ?? $airport['title'] ?? '',
            airportId: $airport['id'] ?? null,
            cityId: $city['id'] ?? null,
            terminal: $data['terminal'] ?? null,
            country: $country['en'] ?? $country['title'] ?? null,
            countryCode: $country['abb'] ?? null,
            dateTime: isset($data['raw_time']) ? Carbon::parse($data['raw_time']) : null,
            time: $data['time'] ?? null,
            translations: [
                'airport' => [
                    'en' => $airport['en'] ?? null,
                    'ar' => $airport['ar'] ?? null,
                    'fa' => $airport['fa'] ?? null,
                    'ku' => $airport['ku'] ?? null,
                ],
                'city' => [
                    'en' => $city['en'] ?? null,
                    'ar' => $city['ar'] ?? null,
                    'fa' => $city['fa'] ?? null,
                    'ku' => $city['ku'] ?? null,
                ],
            ],
        );
    }

    public function toArray(): array
    {
        return [
            'city' => $this->city,
            'airport_code' => $this->airportCode,
            'airport_name' => $this->airportName,
            'airport_id' => $this->airportId,
            'city_id' => $this->cityId,
            'terminal' => $this->terminal,
            'country' => $this->country,
            'country_code' => $this->countryCode,
            'date_time' => $this->dateTime?->toIso8601String(),
            'time' => $this->time,
            'translations' => $this->translations,
        ];
    }
}
