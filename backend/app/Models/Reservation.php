<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'facility_id', 'reviewed_by', 'event_date', 'start_time', 'end_time',
        'purpose', 'expected_guests', 'status', 'admin_remarks',
    ];

    protected function casts(): array
    {
        return ['event_date' => 'date', 'expected_guests' => 'integer'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function equipment()
    {
        return $this->belongsToMany(Equipment::class)->withPivot('quantity');
    }
}
