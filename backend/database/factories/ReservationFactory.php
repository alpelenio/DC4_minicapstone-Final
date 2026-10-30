<?php

namespace Database\Factories;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReservationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'facility_id' => Facility::factory(),
            'event_date' => fake()->dateTimeBetween('today', '+30 days')->format('Y-m-d'),
            'start_time' => '09:00',
            'end_time' => '12:00',
            'purpose' => fake()->sentence(),
            'expected_guests' => fake()->numberBetween(1, 100),
            'status' => 'pending',
        ];
    }
}
