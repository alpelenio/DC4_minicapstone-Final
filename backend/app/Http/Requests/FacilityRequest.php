<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FacilityRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user()?->isAdmin(); }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:2000'],
            'capacity' => ['required', 'integer', 'min:1', 'max:5000'],
            'fee' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
