<?php

namespace App\DTOs\Flight;

use Carbon\Carbon;

class NormalizedFlightOffer
{
    public function __construct(
        public readonly string $id,
        public readonly string $supplierCode,
        public readonly string $referenceId,
        public readonly NormalizedPrice $price,
        public readonly array $legs, // NormalizedLeg[]
        public readonly NormalizedAirline $validatingAirline,
        public readonly int $seatsAvailable,
        public readonly bool $refundable,
        public readonly ?Carbon $validUntil,
        public readonly array $passengers,
        public readonly array $rawData, // Original response for booking
        public readonly ?string $sellerCode = null,
        public readonly bool $hasBrands = false,
        public readonly bool $onholdable = false,
    ) {
    }

    public static function fromFlightBufferData(array $data, string $supplierCode = 'flightbuffer'): self
    {
        $priceInfo = $data['priceInfo'] ?? [];
        $serviceInfo = $data['serviceInfo'] ?? [];

        $legs = array_map(
            fn($leg) => NormalizedLeg::fromArray($leg),
            $serviceInfo['legs'] ?? []
        );

        $validUntil = isset($serviceInfo['searchValidity'])
            ? Carbon::parse($serviceInfo['searchValidity'])
            : null;

        $refundable = $serviceInfo['refundable'] ?? '-';
        $isRefundable = !in_array($refundable, ['-', 'no', 'false', '0']);

        return new self(
            id: self::generateId($data['flightBufferReferenceId'] ?? '', $supplierCode),
            supplierCode: $supplierCode,
            referenceId: $data['flightBufferReferenceId'] ?? '',
            price: NormalizedPrice::fromArray($priceInfo),
            legs: $legs,
            validatingAirline: NormalizedAirline::fromArray($serviceInfo['validatingAirline'] ?? []),
            seatsAvailable: self::extractSeatsAvailable($legs),
            refundable: $isRefundable,
            validUntil: $validUntil,
            passengers: $serviceInfo['passengersCount'] ?? ['adults' => 1, 'children' => 0, 'infants' => 0],
            rawData: $data,
            sellerCode: $data['sellerCode'] ?? null,
            hasBrands: $data['hasBrands'] ?? false,
            onholdable: $data['onholdable'] ?? false,
        );
    }

    private static function generateId(string $referenceId, string $supplierCode): string
    {
        return $supplierCode . '_' . substr(md5($referenceId), 0, 16);
    }

    private static function extractSeatsAvailable(array $legs): int
    {
        $minSeats = PHP_INT_MAX;

        foreach ($legs as $leg) {
            foreach ($leg->segments as $segment) {
                if ($segment->capacity > 0 && $segment->capacity < $minSeats) {
                    $minSeats = $segment->capacity;
                }
            }
        }

        return $minSeats === PHP_INT_MAX ? 0 : $minSeats;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'supplier_code' => $this->supplierCode,
            'reference_id' => $this->referenceId,
            'price' => $this->price->toArray(),
            'legs' => array_map(fn($leg) => $leg->toArray(), $this->legs),
            'validating_airline' => $this->validatingAirline->toArray(),
            'seats_available' => $this->seatsAvailable,
            'refundable' => $this->refundable,
            'valid_until' => $this->validUntil?->toIso8601String(),
            'passengers' => $this->passengers,
            'seller_code' => $this->sellerCode,
            'has_brands' => $this->hasBrands,
            'onholdable' => $this->onholdable,
            // Note: rawData is intentionally excluded from default array output
        ];
    }

    /**
     * Get raw data for booking operations.
     */
    public function getRawData(): array
    {
        return $this->rawData;
    }

    /**
     * Get display summary for the offer.
     */
    public function getSummary(): array
    {
        $firstLeg = $this->legs[0] ?? null;
        $segments = $firstLeg?->segments ?? [];
        $firstSegment = $segments[0] ?? null;
        $lastSegment = !empty($segments) ? $segments[count($segments) - 1] : $firstSegment;

        return [
            'id' => $this->id,
            'price' => $this->price->toArray()['formatted'],
            'airline' => $this->validatingAirline->name,
            'airline_code' => $this->validatingAirline->code,
            // Origin details
            'origin' => $firstLeg?->departure->airportCode,
            'origin_city' => $firstLeg?->departure->city,
            'origin_airport' => $firstLeg?->departure->airportName,
            'departure_terminal' => $firstLeg?->departure->terminal,
            // Destination details
            'destination' => $firstLeg?->arrival->airportCode,
            'destination_city' => $firstLeg?->arrival->city,
            'destination_airport' => $firstLeg?->arrival->airportName,
            'arrival_terminal' => $firstLeg?->arrival->terminal,
            // Full datetime (ISO format for proper parsing)
            'departure_datetime' => $firstLeg?->departure->dateTime?->toIso8601String(),
            'arrival_datetime' => $firstLeg?->arrival->dateTime?->toIso8601String(),
            // Legacy fields for backward compatibility
            'departure' => $firstLeg?->departure->city,
            'arrival' => $firstLeg?->arrival->city,
            'departure_time' => $firstLeg?->departure->time,
            'arrival_time' => $firstLeg?->arrival->time,
            // Flight details
            'flight_number' => $firstSegment?->flightNumber,
            'duration' => $firstLeg?->formatDuration(),
            'stops' => $firstLeg?->stops ?? 0,
            'cabin' => $firstLeg?->cabin,
            // Aircraft and baggage (new fields)
            'aircraft' => $firstSegment?->aircraft,
            'luggage' => $firstSegment?->luggage,
            'booking_class' => $firstSegment?->bookingClass,
        ];
    }
}
