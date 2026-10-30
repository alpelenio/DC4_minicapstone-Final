<?php

namespace Database\Factories;

use App\Models\EquipmentCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class EquipmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => EquipmentCategory::factory(),
            'name' => fake()->unique()->word(),
            'total_quantity' => fake()->numberBetween(2, 100),
            'condition' => fake()->randomElement(['good', 'fair', 'needs_repair']),
        ];
    }
}
