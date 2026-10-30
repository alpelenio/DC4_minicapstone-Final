<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\EquipmentCategory;
use App\Models\Facility;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Maria Santos', 'email' => 'admin@barangaybook.test',
            'password' => Hash::make('password'), 'role' => 'admin', 'phone' => '0917-555-0101',
            'purok' => 'Barangay Hall',
        ]);
        $residents = collect([
            ['Juan Dela Cruz', 'Purok 1'], ['Ana Reyes', 'Purok 2'], ['Roberto Garcia', 'Purok 3'],
            ['Lourdes Mendoza', 'Purok 4'], ['Jose Bautista', 'Purok 5'], ['Carmela Flores', 'Purok 6'],
            ['Ramon Villanueva', 'Purok 7'], ['Elena Navarro', 'Purok 8'], ['Miguel Ramos', 'Purok 2'],
            ['Teresa Aquino', 'Purok 5'],
        ])->map(fn ($resident, $index) => User::create([
            'name' => $resident[0],
            'email' => $index === 0 ? 'resident@barangaybook.test' : 'resident'.($index + 1).'@barangaybook.test',
            'password' => Hash::make('password'),
            'role' => 'resident',
            'phone' => '09'.(17 + $index).'-555-'.str_pad((string) (1100 + $index), 4, '0', STR_PAD_LEFT),
            'purok' => $resident[1],
        ]));

        $facilities = collect([
            ['Barangay Multipurpose Hall', 'Airy indoor venue for assemblies and family celebrations.', 250, 1500],
            ['Covered Court', 'Open-sided court for sports leagues and community programs.', 500, 0],
            ['Conference Room', 'Meeting room for small group workshops and consultations.', 40, 300],
        ])->map(fn ($item) => Facility::create([
            'name' => $item[0], 'description' => $item[1], 'capacity' => $item[2], 'fee' => $item[3], 'is_active' => true,
        ]));

        $categories = collect(['Furniture', 'Audio', 'Shelter', 'Electrical'])
            ->mapWithKeys(fn ($name) => [$name => EquipmentCategory::create(['name' => $name])]);
        $inventory = collect([
            ['Plastic Chairs', 'Furniture', 200, 'good'], ['Folding Tables', 'Furniture', 30, 'good'],
            ['Long Tables', 'Furniture', 15, 'fair'], ['Sound System', 'Audio', 2, 'good'],
            ['Wireless Microphones', 'Audio', 6, 'good'], ['Pop-up Tents', 'Shelter', 6, 'fair'],
            ['Extension Cords', 'Electrical', 12, 'good'], ['Stand Fans', 'Electrical', 8, 'fair'],
            ['Portable Projector', 'Electrical', 3, 'good'],
        ])->map(fn ($item) => Equipment::create([
            'name' => $item[0], 'category_id' => $categories[$item[1]]->id,
            'total_quantity' => $item[2], 'condition' => $item[3],
        ]));

        $purposes = [
            'Barangay assembly', 'Birthday celebration', 'Inter-purok basketball league',
            'Wedding reception', 'Community zumba session', 'Senior citizens meeting',
            'Youth skills workshop', 'Family reunion', 'Health and wellness seminar',
            'School recognition program',
        ];
        for ($index = 0; $index < 30; $index++) {
            $status = match (true) {
                $index < 4 => 'completed',
                $index === 4 => 'rejected',
                $index === 5 => 'cancelled',
                $index % 3 === 0 => 'approved',
                $index % 3 === 1 => 'pending',
                default => 'rejected',
            };
            $date = $index < 4
                ? today()->subDays(4 - $index)
                : today()->addDays(1 + (($index - 4) % 14));
            $reservation = Reservation::create([
                'user_id' => $residents[$index % $residents->count()]->id,
                'facility_id' => $facilities[$index % $facilities->count()]->id,
                'reviewed_by' => in_array($status, ['approved', 'rejected'], true) ? $admin->id : null,
                'event_date' => $date,
                'start_time' => $index % 2 === 0 ? '09:00' : '14:00',
                'end_time' => $index % 2 === 0 ? '12:00' : '17:00',
                'purpose' => $purposes[$index % count($purposes)],
                'expected_guests' => 25 + ($index * 7 % 120),
                'status' => $status,
                'admin_remarks' => $status === 'rejected' ? 'The venue is unavailable for the requested schedule.' : null,
            ]);
            $reservation->equipment()->attach([
                $inventory[0]->id => ['quantity' => 20 + ($index % 10)],
                $inventory[$index % 3 === 0 ? 1 : 3]->id => ['quantity' => $index % 3 === 0 ? 2 : 1],
            ]);
        }
    }
}
