<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EquipmentRequest;
use App\Http\Resources\EquipmentResource;
use App\Models\Equipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EquipmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Equipment::with('category');
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn ($builder) => $builder->where('name', 'like', "%{$search}%")
                ->orWhereHas('category', fn ($category) => $category->where('name', 'like', "%{$search}%")));
        }
        if ($request->filled('category_id')) $query->where('category_id', $request->query('category_id'));
        return EquipmentResource::collection($query->orderBy('name')->paginate(10)->withQueryString());
    }

    public function options(Request $request)
    {
        $equipment = Equipment::with('category')->orderBy('name')->get();
        if ($request->filled(['event_date', 'start_time', 'end_time'])) {
            $committed = DB::table('equipment_reservation')
                ->join('reservations', 'reservations.id', '=', 'equipment_reservation.reservation_id')
                ->where('reservations.status', 'approved')
                ->whereDate('reservations.event_date', $request->query('event_date'))
                ->where('reservations.start_time', '<', $request->query('end_time'))
                ->where('reservations.end_time', '>', $request->query('start_time'))
                ->groupBy('equipment_reservation.equipment_id')
                ->selectRaw('equipment_reservation.equipment_id, SUM(equipment_reservation.quantity) as reserved_quantity')
                ->pluck('reserved_quantity', 'equipment_id');
            $equipment->each(fn ($item) => $item->setAttribute(
                'available_quantity', max(0, $item->total_quantity - (int) $committed->get($item->id, 0))
            ));
        }
        return EquipmentResource::collection($equipment);
    }

    public function store(EquipmentRequest $request)
    {
        return EquipmentResource::make(Equipment::create($request->validated())->load('category'))->response()->setStatusCode(201);
    }

    public function show(Equipment $equipment)
    {
        return EquipmentResource::make($equipment->load('category'));
    }

    public function update(EquipmentRequest $request, Equipment $equipment)
    {
        $data = $request->validated();
        $committed = $equipment->reservations()->where('status', 'approved')->sum('equipment_reservation.quantity');
        if ($data['total_quantity'] < $committed) {
            throw ValidationException::withMessages(['total_quantity' => 'Quantity cannot be lower than equipment already reserved for approved events.']);
        }
        $equipment->update($data);
        return EquipmentResource::make($equipment->refresh()->load('category'));
    }

    public function destroy(Equipment $equipment)
    {
        if ($equipment->reservations()->exists()) {
            throw ValidationException::withMessages(['equipment' => 'This item has reservation history and cannot be deleted.']);
        }
        $equipment->delete();
        return response()->noContent();
    }
}
