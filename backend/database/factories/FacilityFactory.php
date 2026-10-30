<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class FacilityFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->streetName().' Hall',
            'description' => fake()->sentence(),
            'capacity' => fake()->numberBetween(30, 250),
            'fee' => fake()->randomElement([0, 250, 500, 1000]),
            'is_active' => true,
        ];
    }
}
