<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EquipmentResource;
use App\Http\Resources\ReservationResource;
use App\Models\Equipment;
use App\Models\Facility;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            $reservations = Reservation::where('user_id', $user->id);
            $nextReservation = Reservation::with(['facility', 'equipment.category'])
                ->where('user_id', $user->id)->where('status', 'approved')
                ->whereDate('event_date', '>=', today())
                ->orderBy('event_date')->orderBy('start_time')->first();
            return response()->json([
                'totals' => [
                    'all' => (clone $reservations)->count(),
                    'pending' => (clone $reservations)->where('status', 'pending')->count(),
                    'approved' => (clone $reservations)->where('status', 'approved')->count(),
                    'completed' => (clone $reservations)->where('status', 'completed')->count(),
                    'rejected' => (clone $reservations)->where('status', 'rejected')->count(),
                    'cancelled' => (clone $reservations)->where('status', 'cancelled')->count(),
                ],
                'next_reservation' => $nextReservation ? ReservationResource::make($nextReservation) : null,
            ]);
        }

        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfWeek();
        $lowStock = Equipment::with('category')->where('total_quantity', '<=', config('barangaybook.low_stock_threshold', 5))->get();
        $mostReserved = Facility::query()
            ->withCount(['reservations' => fn ($query) => $query->whereIn('status', ['approved', 'completed'])])
            ->orderByDesc('reservations_count')->first();
        $upcoming = Reservation::with(['user', 'facility', 'equipment.category'])
            ->where('status', 'approved')->whereDate('event_date', '>=', today())
            ->orderBy('event_date')->orderBy('start_time')->limit(5)->get();

        return response()->json([
            'totals' => [
                'reservations' => Reservation::count(),
                'pending' => Reservation::where('status', 'pending')->count(),
                'approved_this_week' => Reservation::where('status', 'approved')
                    ->whereBetween('event_date', [$weekStart->toDateString(), $weekEnd->toDateString()])->count(),
                'low_stock' => $lowStock->count(),
            ],
            'low_stock_equipment' => EquipmentResource::collection($lowStock),
            'most_reserved_facility' => $mostReserved ? [
                'id' => $mostReserved->id,
                'name' => $mostReserved->name,
                'reservations_count' => $mostReserved->reservations_count,
            ] : null,
            'upcoming_events' => ReservationResource::collection($upcoming),
        ]);
    }
}
