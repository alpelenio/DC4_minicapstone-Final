<?php

namespace App\Http\Requests;

use App\Models\Facility;
use App\Services\ReservationAvailabilityService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ReservationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'event_date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'purpose' => ['required', 'string', 'min:5', 'max:2000'],
            'expected_guests' => ['required', 'integer', 'min:1'],
            'equipment' => ['nullable', 'array'],
            'equipment.*.equipment_id' => ['required_with:equipment', 'integer', 'distinct', 'exists:equipment,id'],
            'equipment.*.quantity' => ['required_with:equipment', 'integer', 'min:1'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $facility = Facility::find($this->input('facility_id'));
            if (!$facility?->is_active) {
                $validator->errors()->add('facility_id', 'This facility is not currently available for reservations.');
                return;
            }

            if ((int) $this->input('expected_guests') > $facility->capacity) {
                $validator->errors()->add('expected_guests', "Guest count cannot exceed the facility capacity of {$facility->capacity}.");
                return;
            }

            try {
                app(ReservationAvailabilityService::class)->ensureAvailable([
                    'facility_id' => (int) $this->input('facility_id'),
                    'event_date' => $this->input('event_date'),
                    'start_time' => $this->input('start_time'),
                    'end_time' => $this->input('end_time'),
                    'equipment' => collect($this->input('equipment', []))->map(fn ($item) => [
                        'equipment_id' => (int) $item['equipment_id'],
                        'quantity' => (int) $item['quantity'],
                    ])->all(),
                ], $this->route('reservation'));
            } catch (\Illuminate\Validation\ValidationException $exception) {
                foreach ($exception->errors() as $field => $messages) {
                    foreach ($messages as $message) {
                        $validator->errors()->add($field, $message);
                    }
                }
            }
        });
    }
}
