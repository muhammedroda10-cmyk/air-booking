<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions first
        $this->createPermissions();

        // Create roles
        $this->createRoles();

        // Assign permissions to roles
        $this->assignPermissionsToRoles();
    }

    /**
     * Create all permissions from definitions.
     */
    protected function createPermissions(): void
    {
        $definitions = Permission::getPermissionDefinitions();

        foreach ($definitions as $module => $permissions) {
            foreach ($permissions as $slug => $name) {
                Permission::firstOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $name,
                        'module' => $module,
                        'description' => $name,
                    ]
                );
            }
        }

        $this->command->info('Permissions created successfully.');
    }

    /**
     * Create default roles.
     */
    protected function createRoles(): void
    {
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => Role::SUPER_ADMIN,
                'description' => 'Full access to all features and settings',
                'is_system' => true,
            ],
            [
                'name' => 'Sales',
                'slug' => Role::SALES,
                'description' => 'Manage bookings, view reports, process refunds',
                'is_system' => true,
            ],
            [
                'name' => 'Accounting',
                'slug' => Role::ACCOUNTING,
                'description' => 'Financial reports, refunds, invoices',
                'is_system' => true,
            ],
            [
                'name' => 'Support',
                'slug' => Role::SUPPORT,
                'description' => 'Support tickets, passenger corrections, basic bookings',
                'is_system' => true,
            ],
            [
                'name' => 'Customer',
                'slug' => Role::CUSTOMER,
                'description' => 'Regular user account',
                'is_system' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['slug' => $role['slug']], $role);
        }

        $this->command->info('Roles created successfully.');
    }

    /**
     * Assign permissions to roles.
     */
    protected function assignPermissionsToRoles(): void
    {
        // Sales permissions
        $salesRole = Role::findBySlug(Role::SALES);
        if ($salesRole) {
            $salesPermissions = [
                'bookings.view',
                'bookings.create',
                'bookings.edit',
                'bookings.cancel',
                'bookings.view_all',
                'refunds.view',
                'refunds.process',
                'passengers.view',
                'passengers.edit',
                'support.view',
                'support.respond',
                'flights.view',
                'hotels.view',
                'promo_codes.view',
                'promo_codes.create',
                'promo_codes.edit',
                'reports.view_sales',
            ];
            $this->assignPermissions($salesRole, $salesPermissions);
        }

        // Accounting permissions
        $accountingRole = Role::findBySlug(Role::ACCOUNTING);
        if ($accountingRole) {
            $accountingPermissions = [
                'bookings.view',
                'bookings.view_all',
                'refunds.view',
                'refunds.process',
                'refunds.full',
                'refunds.approve',
                'reports.view_sales',
                'reports.view_financial',
                'reports.export',
                'passengers.view',
            ];
            $this->assignPermissions($accountingRole, $accountingPermissions);
        }

        // Support permissions
        $supportRole = Role::findBySlug(Role::SUPPORT);
        if ($supportRole) {
            $supportPermissions = [
                'bookings.view',
                'bookings.view_all',
                'passengers.view',
                'passengers.edit',
                'passengers.correct_name',
                'passengers.correct_passport',
                'support.view',
                'support.respond',
                'support.assign',
                'support.close',
                'support.view_all',
                'refunds.view',
            ];
            $this->assignPermissions($supportRole, $supportPermissions);
        }

        // Customer has no special permissions - they access their own data only

        $this->command->info('Permissions assigned to roles successfully.');
    }

    /**
     * Helper to assign permissions to a role.
     */
    protected function assignPermissions(Role $role, array $permissionSlugs): void
    {
        $permissions = Permission::whereIn('slug', $permissionSlugs)->get();
        $role->permissions()->sync($permissions->pluck('id')->toArray());
    }
}
