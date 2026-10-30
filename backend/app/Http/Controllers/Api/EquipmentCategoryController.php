<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EquipmentCategoryRequest;
use App\Http\Resources\EquipmentCategoryResource;
use App\Models\EquipmentCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EquipmentCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = EquipmentCategory::withCount('equipment');
        if ($search = trim((string) $request->query('search'))) $query->where('name', 'like', "%{$search}%");
        return EquipmentCategoryResource::collection($query->orderBy('name')->paginate(10)->withQueryString());
    }

    public function options()
    {
        return EquipmentCategoryResource::collection(EquipmentCategory::orderBy('name')->get());
    }

    public function store(EquipmentCategoryRequest $request)
    {
        return EquipmentCategoryResource::make(EquipmentCategory::create($request->validated()))->response()->setStatusCode(201);
    }

    public function show(EquipmentCategory $equipment_category)
    {
        return EquipmentCategoryResource::make($equipment_category->loadCount('equipment'));
    }

    public function update(EquipmentCategoryRequest $request, EquipmentCategory $equipment_category)
    {
        $equipment_category->update($request->validated());
        return EquipmentCategoryResource::make($equipment_category->refresh()->loadCount('equipment'));
    }

    public function destroy(EquipmentCategory $equipment_category)
    {
        if ($equipment_category->equipment()->exists()) {
            throw ValidationException::withMessages(['category' => 'This category still contains equipment and cannot be deleted.']);
        }
        $equipment_category->delete();
        return response()->noContent();
    }
}
