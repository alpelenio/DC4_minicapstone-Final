<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category_id' => $this->category_id,
            'category' => EquipmentCategoryResource::make($this->whenLoaded('category')),
            'total_quantity' => $this->total_quantity,
            'condition' => $this->condition,
            'is_low_stock' => $this->total_quantity <= config('barangaybook.low_stock_threshold', 5),
            'available_quantity' => $this->when(isset($this->available_quantity), (int) $this->available_quantity),
            'pivot' => $this->whenPivotLoaded('equipment_reservation', fn () => [
                'quantity' => $this->pivot->quantity,
            ]),
        ];
    }
}
