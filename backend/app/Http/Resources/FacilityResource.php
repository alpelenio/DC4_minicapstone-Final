<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FacilityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'capacity' => $this->capacity,
            'fee' => (float) $this->fee,
            'is_active' => $this->is_active,
            'reservations_count' => $this->whenCounted('reservations'),
        ];
    }
}
