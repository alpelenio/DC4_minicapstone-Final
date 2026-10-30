<?php

namespace Tests\Feature;

use App\Models\Equipment;
use App\Models\EquipmentCategory;
use App\Models\Facility;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BarangayBookApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_login_and_logout_issue_and_revoke_tokens(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Ana Reyes', 'email' => 'ana@example.test', 'password' => 'password123',
            'password_confirmation' => 'password123', 'role' => 'admin',
        ]);
        $response->assertCreated()->assertJsonPath('user.role', 'resident')->assertJsonStructure(['token', 'user' => ['id', 'name']]);
        $login = $this->postJson('/api/login', ['email' => 'ana@example.test', 'password' => 'password123']);
        $login->assertOk()->assertJsonStructure(['token', 'user']);
        $this->withToken($login->json('token'))->postJson('/api/logout')->assertNoContent();
    }

    public function test_private_routes_return_json_401_and_admin_writes_are_forbidden_to_residents(): void
    {
        $this->getJson('/api/reservations')->assertUnauthorized();
        $resident = User::factory()->create();
        $reservation = Reservation::factory()->create(['user_id' => $resident->id]);
        Sanctum::actingAs($resident);
        $this->postJson('/api/facilities', [])->assertForbidden();
        $this->patchJson("/api/reservations/{$reservation->id}/status", ['status' => 'approved'])->assertForbidden();
    }

    public function test_reservation_validates_capacity_and_approved_facility_overlap(): void
    {
        $resident = User::factory()->create();
        $facility = Facility::factory()->create(['capacity' => 40]);
        Sanctum::actingAs($resident);
        $payload = $this->reservationPayload($facility, ['expected_guests' => 41]);
        $this->postJson('/api/reservations', $payload)->assertUnprocessable()->assertJsonValidationErrors('expected_guests');

        Reservation::factory()->create([
            'facility_id' => $facility->id, 'event_date' => today()->addDays(3),
            'start_time' => '10:00', 'end_time' => '13:00', 'status' => 'approved',
        ]);
        $this->postJson('/api/reservations', $this->reservationPayload($facility, [
            'event_date' => today()->addDays(3)->toDateString(), 'start_time' => '12:00', 'end_time' => '14:00',
        ]))->assertUnprocessable()->assertJsonValidationErrors('event_date');
    }

    public function test_overlapping_approved_equipment_stock_is_enforced(): void
    {
        $resident = User::factory()->create();
        $category = EquipmentCategory::factory()->create();
        $equipment = Equipment::factory()->create(['category_id' => $category->id, 'total_quantity' => 5]);
        $existing = Reservation::factory()->create([
            'event_date' => today()->addDays(4), 'start_time' => '09:00', 'end_time' => '12:00', 'status' => 'approved',
        ]);
        $existing->equipment()->attach($equipment, ['quantity' => 4]);
        Sanctum::actingAs($resident);

        $this->postJson('/api/reservations', $this->reservationPayload(Facility::factory()->create(), [
            'event_date' => today()->addDays(4)->toDateString(),
            'equipment' => [['equipment_id' => $equipment->id, 'quantity' => 2]],
        ]))->assertUnprocessable()->assertJsonValidationErrors('equipment');
    }

    public function test_approval_rechecks_facility_overlap_and_equipment_stock(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $facility = Facility::factory()->create();
        Reservation::factory()->create([
            'facility_id' => $facility->id, 'event_date' => today()->addDays(6),
            'start_time' => '09:00', 'end_time' => '12:00', 'status' => 'approved',
        ]);
        $overlapping = Reservation::factory()->create([
            'facility_id' => $facility->id, 'event_date' => today()->addDays(6),
            'start_time' => '11:00', 'end_time' => '13:00', 'status' => 'pending',
        ]);
        Sanctum::actingAs($admin);
        $this->patchJson("/api/reservations/{$overlapping->id}/status", ['status' => 'approved'])
            ->assertUnprocessable()->assertJsonValidationErrors('event_date');

        $category = EquipmentCategory::factory()->create();
        $equipment = Equipment::factory()->create(['category_id' => $category->id, 'total_quantity' => 5]);
        $committed = Reservation::factory()->create([
            'event_date' => today()->addDays(7), 'start_time' => '09:00', 'end_time' => '12:00', 'status' => 'approved',
        ]);
        $committed->equipment()->attach($equipment, ['quantity' => 4]);
        $waiting = Reservation::factory()->create([
            'event_date' => today()->addDays(7), 'start_time' => '10:00', 'end_time' => '11:00', 'status' => 'pending',
        ]);
        $waiting->equipment()->attach($equipment, ['quantity' => 2]);
        $this->patchJson("/api/reservations/{$waiting->id}/status", ['status' => 'approved'])
            ->assertUnprocessable()->assertJsonValidationErrors('equipment');
    }

    public function test_status_workflow_requires_admin_and_rejects_invalid_transitions(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $reservation = Reservation::factory()->create(['status' => 'pending']);
        Sanctum::actingAs($admin);
        $this->patchJson("/api/reservations/{$reservation->id}/status", ['status' => 'rejected'])
            ->assertUnprocessable()->assertJsonValidationErrors('admin_remarks');
        $this->patchJson("/api/reservations/{$reservation->id}/status", [
            'status' => 'approved', 'admin_remarks' => 'Schedule confirmed.',
        ])->assertOk()->assertJsonPath('data.status', 'approved');
        $this->patchJson("/api/reservations/{$reservation->id}/status", ['status' => 'rejected', 'admin_remarks' => 'Too late.'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_reservations_are_filtered_paginated_and_dashboard_is_role_specific(): void
    {
        $resident = User::factory()->create();
        $facility = Facility::factory()->create();
        Reservation::factory(10)->create(['user_id' => $resident->id, 'facility_id' => $facility->id]);
        Reservation::factory()->create([
            'user_id' => $resident->id, 'facility_id' => $facility->id,
            'purpose' => 'Purok assembly planning', 'status' => 'pending',
        ]);
        Reservation::factory(2)->create();
        Sanctum::actingAs($resident);

        $this->getJson('/api/reservations?search=')->assertOk()->assertJsonPath('meta.total', 11)->assertJsonPath('meta.per_page', 10);
        $this->getJson("/api/reservations?search=assembly&status=pending&facility_id={$facility->id}")
            ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.purpose', 'Purok assembly planning');
        $this->getJson('/api/dashboard')->assertOk()->assertJsonStructure(['totals' => ['all', 'pending', 'approved'], 'next_reservation']);
    }

    private function reservationPayload(Facility $facility, array $overrides = []): array
    {
        return array_replace([
            'facility_id' => $facility->id,
            'event_date' => today()->addDays(5)->toDateString(),
            'start_time' => '09:00',
            'end_time' => '12:00',
            'purpose' => 'Community gathering',
            'expected_guests' => 25,
            'equipment' => [],
        ], $overrides);
    }
}
