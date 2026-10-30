<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    use HasFactory;

    protected $fillable = ['category_id', 'name', 'total_quantity', 'condition'];

    protected function casts(): array
    {
        return ['total_quantity' => 'integer'];
    }

    public function category()
    {
        return $this->belongsTo(EquipmentCategory::class, 'category_id');
    }

    public function reservations()
    {
        return $this->belongsToMany(Reservation::class)->withPivot('quantity');
    }
}
