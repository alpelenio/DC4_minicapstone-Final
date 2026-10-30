<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EquipmentRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user()?->isAdmin(); }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:equipment_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'total_quantity' => ['required', 'integer', 'min:0', 'max:100000'],
            'condition' => ['required', 'in:good,fair,needs_repair'],
        ];
    }
}
