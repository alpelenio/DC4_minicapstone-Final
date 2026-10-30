<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FacilityRequest;
use App\Http\Resources\FacilityResource;
use App\Models\Facility;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FacilityController extends Controller
{
    public function index(Request $request)
    {
        $query = Facility::withCount('reservations');
        if (!$request->user()->isAdmin()) $query->where('is_active', true);
        if ($search = trim((string) $request->query('search'))) $query->where('name', 'like', "%{$search}%");
        return FacilityResource::collection($query->orderBy('name')->paginate(10)->withQueryString());
    }

    public function options()
    {
        return FacilityResource::collection(Facility::where('is_active', true)->orderBy('name')->get());
    }

    public function store(FacilityRequest $request)
    {
        return FacilityResource::make(Facility::create($request->validated()))->response()->setStatusCode(201);
    }

    public function show(Facility $facility)
    {
        abort_if(!$facility->is_active && !request()->user()->isAdmin(), 404);
        return FacilityResource::make($facility->loadCount('reservations'));
    }

    public function update(FacilityRequest $request, Facility $facility)
    {
        $facility->update($request->validated());
        return FacilityResource::make($facility->refresh()->loadCount('reservations'));
    }

    public function destroy(Facility $facility)
    {
        if ($facility->reservations()->exists()) {
            throw ValidationException::withMessages(['facility' => 'This facility has reservation history and cannot be deleted. Deactivate it instead.']);
        }
        $facility->delete();
        return response()->noContent();
    }
}
