<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_date' => $this->event_date?->toDateString(),
            'start_time' => substr((string) $this->start_time, 0, 5),
            'end_time' => substr((string) $this->end_time, 0, 5),
            'purpose' => $this->purpose,
            'expected_guests' => $this->expected_guests,
            'status' => $this->status,
            'admin_remarks' => $this->admin_remarks,
            'user' => UserResource::make($this->whenLoaded('user')),
            'facility' => FacilityResource::make($this->whenLoaded('facility')),
            'reviewer' => UserResource::make($this->whenLoaded('reviewer')),
            'equipment' => EquipmentResource::collection($this->whenLoaded('equipment')),
            'created_at' => $this->created_at,
        ];
    }
}
