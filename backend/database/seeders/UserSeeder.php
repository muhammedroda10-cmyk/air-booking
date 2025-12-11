<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@voyager.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'active',
            ]
        );
        $this->command->info("Super Admin: admin@voyager.com / password");

        // Get all staff roles
        $salesRole = Role::findBySlug(Role::SALES);
        $accountingRole = Role::findBySlug(Role::ACCOUNTING);
        $supportRole = Role::findBySlug(Role::SUPPORT);

        // Create Sales Manager
        if ($salesRole) {
            $salesUser = User::firstOrCreate(
                ['email' => 'sales@voyager.com'],
                [
                    'name' => 'Sarah Sales',
                    'password' => Hash::make('password'),
                    'role' => 'user',
                    'role_id' => $salesRole->id,
                    'status' => 'active',
                ]
            );
            $this->command->info("Sales Manager: sales@voyager.com / password");
        }

        // Create Accounting Manager
        if ($accountingRole) {
            $accountingUser = User::firstOrCreate(
                ['email' => 'accounting@voyager.com'],
                [
                    'name' => 'Alex Accounting',
                    'password' => Hash::make('password'),
                    'role' => 'user',
                    'role_id' => $accountingRole->id,
                    'status' => 'active',
                ]
            );
            $this->command->info("Accounting Manager: accounting@voyager.com / password");
        }

        // Create Support Agent
        if ($supportRole) {
            $supportUser = User::firstOrCreate(
                ['email' => 'support@voyager.com'],
                [
                    'name' => 'Sam Support',
                    'password' => Hash::make('password'),
                    'role' => 'user',
                    'role_id' => $supportRole->id,
                    'status' => 'active',
                ]
            );
            $this->command->info("Support Agent: support@voyager.com / password");
        }

        // Create Regular Customers
        $customers = [
            ['name' => 'John Customer', 'email' => 'john@example.com'],
            ['name' => 'Jane Traveler', 'email' => 'jane@example.com'],
            ['name' => 'Mike Explorer', 'email' => 'mike@example.com'],
            ['name' => 'Emily Journey', 'email' => 'emily@example.com'],
            ['name' => 'David Flyer', 'email' => 'david@example.com'],
        ];

        foreach ($customers as $customer) {
            User::firstOrCreate(
                ['email' => $customer['email']],
                [
                    'name' => $customer['name'],
                    'password' => Hash::make('password'),
                    'role' => 'user',
                    'status' => 'active',
                ]
            );
        }

        $this->command->info("Created 5 customer accounts (password: password)");
    }
}
