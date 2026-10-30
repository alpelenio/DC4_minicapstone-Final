<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReservationStatusRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user()?->isAdmin(); }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:approved,rejected,completed'],
            'admin_remarks' => ['required_if:status,rejected', 'nullable', 'string', 'max:2000'],
        ];
    }
}
