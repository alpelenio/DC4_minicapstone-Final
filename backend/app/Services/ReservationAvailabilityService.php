<?php

namespace App\Services;

use App\Models\Equipment;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReservationAvailabilityService
{
    public function ensureAvailable(array $data, ?Reservation $ignore = null): void
    {
        $conflict = Reservation::query()
            ->where('facility_id', $data['facility_id'])
            ->whereDate('event_date', $data['event_date'])
            ->where('status', 'approved')
            ->when($ignore, fn ($query) => $query->where('id', '!=', $ignore->id))
            ->where('start_time', '<', $data['end_time'])
            ->where('end_time', '>', $data['start_time'])
            ->exists();

        if ($conflict) {
            throw ValidationException::withMessages([
                'event_date' => 'This facility already has an approved reservation during that time.',
            ]);
        }

        foreach ($data['equipment'] ?? [] as $requested) {
            $equipmentId = $requested['equipment_id'];
            $quantity = (int) $requested['quantity'];
            $equipment = Equipment::query()->lockForUpdate()->find($equipmentId);

            if (!$equipment) {
                throw ValidationException::withMessages(['equipment' => 'One selected equipment item no longer exists.']);
            }

            $committed = DB::table('equipment_reservation')
                ->join('reservations', 'reservations.id', '=', 'equipment_reservation.reservation_id')
                ->where('equipment_reservation.equipment_id', $equipmentId)
                ->where('reservations.status', 'approved')
                ->whereDate('reservations.event_date', $data['event_date'])
                ->where('reservations.start_time', '<', $data['end_time'])
                ->where('reservations.end_time', '>', $data['start_time'])
                ->when($ignore, fn ($query) => $query->where('reservations.id', '!=', $ignore->id))
                ->sum('equipment_reservation.quantity');

            if ($quantity + $committed > $equipment->total_quantity) {
                throw ValidationException::withMessages([
                    'equipment' => "Only ".max(0, $equipment->total_quantity - $committed)." {$equipment->name} available for that time.",
                ]);
            }
        }
    }
}
