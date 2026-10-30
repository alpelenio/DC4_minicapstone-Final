<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReservationRequest;
use App\Http\Requests\ReservationStatusRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Equipment;
use App\Models\Reservation;
use App\Services\ReservationAvailabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReservationController extends Controller
{
    public function index(Request $request)
    {
        $query = Reservation::with(['user', 'facility', 'reviewer', 'equipment.category']);
        if (!$request->user()->isAdmin()) {
            $query->where('user_id', $request->user()->id);
        }
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn ($builder) => $builder
                ->where('purpose', 'like', "%{$search}%")
                ->orWhereHas('facility', fn ($facility) => $facility->where('name', 'like', "%{$search}%"))
                ->orWhereHas('user', fn ($resident) => $resident->where('name', 'like', "%{$search}%")));
        }
        foreach (['status', 'facility_id'] as $filter) {
            if ($request->filled($filter)) $query->where($filter, $request->query($filter));
        }
        if ($request->filled('date_from')) $query->whereDate('event_date', '>=', $request->query('date_from'));
        if ($request->filled('date_to')) $query->whereDate('event_date', '<=', $request->query('date_to'));

        return ReservationResource::collection($query->orderByDesc('event_date')->orderByDesc('start_time')->paginate(10)->withQueryString());
    }

    public function store(ReservationRequest $request)
    {
        $data = $request->validated();
        $reservation = DB::transaction(function () use ($data, $request) {
            $reservation = Reservation::create(collect($data)->except('equipment')->all() + [
                'user_id' => $request->user()->id,
                'status' => 'pending',
            ]);
            $this->syncEquipment($reservation, $data['equipment'] ?? []);
            return $reservation;
        });

        return ReservationResource::make($reservation->load(['user', 'facility', 'equipment.category']))
            ->response()->setStatusCode(201);
    }

    public function show(Reservation $reservation)
    {
        $this->authorize('view', $reservation);
        return ReservationResource::make($reservation->load(['user', 'facility', 'reviewer', 'equipment.category']));
    }

    public function update(ReservationRequest $request, Reservation $reservation)
    {
        $this->authorize('update', $reservation);
        $data = $request->validated();
        DB::transaction(function () use ($reservation, $data) {
            $reservation->update(collect($data)->except('equipment')->all());
            $this->syncEquipment($reservation, $data['equipment'] ?? []);
        });

        return ReservationResource::make($reservation->refresh()->load(['user', 'facility', 'equipment.category']));
    }

    public function destroy(Request $request, Reservation $reservation)
    {
        $this->authorize('delete', $reservation);
        if ($reservation->status !== 'pending') {
            throw ValidationException::withMessages(['status' => 'Only pending reservations can be cancelled or removed.']);
        }
        if ($request->user()->isAdmin()) {
            $reservation->delete();
            return response()->noContent();
        }

        $reservation->update(['status' => 'cancelled']);
        return response()->noContent();
    }

    public function changeStatus(ReservationStatusRequest $request, Reservation $reservation, ReservationAvailabilityService $availability)
    {
        $this->authorize('review', Reservation::class);
        $data = $request->validated();
        $allowed = match ($reservation->status) {
            'pending' => ['approved', 'rejected'],
            'approved' => ['completed'],
            default => [],
        };
        if (!in_array($data['status'], $allowed, true)) {
            throw ValidationException::withMessages(['status' => "Cannot move a {$reservation->status} reservation to {$data['status']}."]);
        }

        DB::transaction(function () use ($reservation, $request, $data, $availability) {
            if ($data['status'] === 'approved') {
                $reservation->facility()->lockForUpdate()->first();
                $equipmentIds = $reservation->equipment()->orderBy('equipment.id')->pluck('equipment.id');
                Equipment::whereIn('id', $equipmentIds)->orderBy('id')->lockForUpdate()->get();
                $equipment = $reservation->equipment()->get()->map(fn ($item) => [
                    'equipment_id' => $item->id,
                    'quantity' => $item->pivot->quantity,
                ])->all();
                $availability->ensureAvailable([
                    'facility_id' => $reservation->facility_id,
                    'event_date' => $reservation->event_date->toDateString(),
                    'start_time' => substr((string) $reservation->start_time, 0, 5),
                    'end_time' => substr((string) $reservation->end_time, 0, 5),
                    'equipment' => $equipment,
                ], $reservation);
            }
            $reservation->update([
                'status' => $data['status'],
                'admin_remarks' => $data['admin_remarks'] ?? $reservation->admin_remarks,
                'reviewed_by' => in_array($data['status'], ['approved', 'rejected'], true)
                    ? $request->user()->id : $reservation->reviewed_by,
            ]);
        });

        return ReservationResource::make($reservation->refresh()->load(['user', 'facility', 'reviewer', 'equipment.category']));
    }

    private function syncEquipment(Reservation $reservation, array $equipment): void
    {
        $reservation->equipment()->sync(collect($equipment)->mapWithKeys(fn ($item) => [
            $item['equipment_id'] => ['quantity' => $item['quantity']],
        ])->all());
    }
}
