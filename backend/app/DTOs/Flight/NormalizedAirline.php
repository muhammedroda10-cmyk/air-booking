<?php

namespace App\DTOs\Flight;

class NormalizedAirline
{
    public function __construct(
        public readonly int $id,
        public readonly string $code,
        public readonly string $name,
        public readonly ?string $logo = null,
        public readonly ?array $translations = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? 0,
            code: $data['abb'] ?? $data['code'] ?? '',
            name: $data['en'] ?? $data['title'] ?? $data['name'] ?? '',
            logo: $data['logo'] ?? null,
            translations: [
                'en' => $data['en'] ?? null,
                'ar' => $data['ar'] ?? null,
                'fa' => $data['fa'] ?? null,
                'ku' => $data['ku'] ?? null,
                'tr' => $data['tr'] ?? null,
            ],
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'logo' => $this->logo,
            'translations' => $this->translations,
        ];
    }
}
