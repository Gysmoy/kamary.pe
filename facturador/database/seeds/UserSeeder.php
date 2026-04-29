<?php

use Illuminate\Database\Seeder;
use App\Models\Billing\User;
use App\Models\Billing\Establishment;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $adminEmail = env('SEED_ADMIN_EMAIL', 'admin@gmail.com');
        $adminPassword = env('SEED_ADMIN_PASSWORD', '123456');

        if (!$adminEmail) {
            $adminEmail = 'admin@gmail.com';
        }
        if (!$adminPassword) {
            $adminPassword = '123456';
        }

        // 1. Ensure an establishment exists.
        $establishment = Establishment::firstOrCreate(
            ['code' => '0000'],
            [
                'description' => 'Oficina Principal',
                'country_id' => 'PE',
                'department_id' => '15',
                'province_id' => '1501',
                'district_id' => '150101',
                'address' => 'Dirección de la Empresa',
                'email' => 'admin@gmail.com',
                'telephone' => '999999999',
            ]
        );

        // 2. Create admin user only when missing; avoid overriding existing credentials/config.
        $user = User::where('email', $adminEmail)->first();
        if (!$user) {
            $user = new User();
            $user->email = $adminEmail;
            $user->name = 'Administrador';
            $user->password = Hash::make($adminPassword);
            $user->establishment_id = $establishment->id;
            $user->type = 'admin';
            $user->locked = false;
            $user->api_token = Str::random(60);
            $user->save();
            return;
        }

        $dirty = false;

        if (empty($user->establishment_id)) {
            $user->establishment_id = $establishment->id;
            $dirty = true;
        }

        if (empty($user->type)) {
            $user->type = 'admin';
            $dirty = true;
        }

        if (empty($user->api_token)) {
            $user->api_token = Str::random(60);
            $dirty = true;
        }

        if ($dirty) {
            $user->save();
        }
    }
}
