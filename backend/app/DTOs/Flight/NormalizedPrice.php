<?php

namespace App\DTOs\Flight;

class NormalizedPrice
{
    public function __construct(
        public readonly float $total,
        public readonly float $baseFare,
        public readonly float $taxes,
        public readonly string $currency,
        public readonly string $currencySymbol,
        public readonly int $decimalPlaces,
        public readonly array $breakdown,
        public readonly bool $guaranteed = false,
    ) {}

    public static function fromArray(array $data): self
    {
        $currency = $data['currency'] ?? [];
        $breakdowns = $data['breakDowns'] ?? [];

        $breakdown = [];
        foreach ($breakdowns as $type => $info) {
            $breakdown[$type] = [
                'base_fare' => $info['baseFare'] ?? 0,
                'tax' => $info['tax'] ?? 0,
                'service_charge' => $info['serviceCharge'] ?? 0,
                'total_fare' => $info['totalFare'] ?? 0,
                'commission' => $info['commission'] ?? 0,
                'payable' => $info['payable'] ?? 0,
                'passengers_count' => $info['passengersCount'] ?? 1,
            ];
        }

        // Calculate taxes from total and base fare
        $total = $data['payable'] ?? $data['b2c'] ?? 0;
        $baseFare = $data['baseFare'] ?? 0;
        $taxes = $total - $baseFare;

        return new self(
            total: $total,
            baseFare: $baseFare,
            taxes: $taxes > 0 ? $taxes : 0,
            currency: $currency['abb'] ?? 'USD',
            currencySymbol: $currency['symbol'] ?? '$',
            decimalPlaces: $currency['decimal_places'] ?? 2,
            breakdown: $breakdown,
            guaranteed: $data['guaranteed'] ?? false,
        );
    }

    public function toArray(): array
    {
        return [
            'total' => round($this->total, $this->decimalPlaces),
            'base_fare' => round($this->baseFare, $this->decimalPlaces),
            'taxes' => round($this->taxes, $this->decimalPlaces),
            'currency' => $this->currency,
            'currency_symbol' => $this->currencySymbol,
            'decimal_places' => $this->decimalPlaces,
            'breakdown' => $this->breakdown,
            'guaranteed' => $this->guaranteed,
            'formatted' => $this->currencySymbol . number_format($this->total, $this->decimalPlaces),
        ];
    }
}
