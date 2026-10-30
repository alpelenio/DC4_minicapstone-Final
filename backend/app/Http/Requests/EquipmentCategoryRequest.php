<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EquipmentCategoryRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user()?->isAdmin(); }

    public function rules(): array
    {
        $category = $this->route('equipment_category');
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('equipment_categories', 'name')->ignore($category)],
        ];
    }
}
