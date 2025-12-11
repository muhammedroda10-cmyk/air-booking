<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    // Modules
    const MODULE_BOOKINGS = 'bookings';
    const MODULE_REFUNDS = 'refunds';
    const MODULE_PASSENGERS = 'passengers';
    const MODULE_SUPPORT = 'support';
    const MODULE_USERS = 'users';
    const MODULE_ROLES = 'roles';
    const MODULE_FLIGHTS = 'flights';
    const MODULE_HOTELS = 'hotels';
    const MODULE_REPORTS = 'reports';
    const MODULE_SETTINGS = 'settings';
    const MODULE_PROMO_CODES = 'promo_codes';
    const MODULE_REVIEWS = 'reviews';
    const MODULE_SUPPLIERS = 'suppliers';
    const MODULE_TRANSACTIONS = 'transactions';

    protected $fillable = [
        'name',
        'slug',
        'module',
        'description',
    ];

    /**
     * Get the roles that have this permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permission')
            ->withTimestamps();
    }

    /**
     * Get the users that have this permission directly.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_permission')
            ->withTimestamps();
    }

    /**
     * Get permission by slug.
     */
    public static function findBySlug(string $slug): ?self
    {
        return static::where('slug', $slug)->first();
    }

    /**
     * Get all permissions for a module.
     */
    public static function forModule(string $module): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('module', $module)->get();
    }

    /**
     * Get all available modules.
     */
    public static function getModules(): array
    {
        return [
            self::MODULE_BOOKINGS,
            self::MODULE_REFUNDS,
            self::MODULE_PASSENGERS,
            self::MODULE_SUPPORT,
            self::MODULE_USERS,
            self::MODULE_ROLES,
            self::MODULE_FLIGHTS,
            self::MODULE_HOTELS,
            self::MODULE_REPORTS,
            self::MODULE_SETTINGS,
            self::MODULE_PROMO_CODES,
            self::MODULE_REVIEWS,
            self::MODULE_SUPPLIERS,
            self::MODULE_TRANSACTIONS,
        ];
    }

    /**
     * Get all permission definitions grouped by module.
     */
    public static function getPermissionDefinitions(): array
    {
        return [
            self::MODULE_BOOKINGS => [
                'bookings.view' => 'View Bookings',
                'bookings.create' => 'Create Bookings',
                'bookings.edit' => 'Edit Bookings',
                'bookings.cancel' => 'Cancel Bookings',
                'bookings.view_all' => 'View All Bookings',
            ],
            self::MODULE_REFUNDS => [
                'refunds.view' => 'View Refunds',
                'refunds.process' => 'Process Refunds',
                'refunds.full' => 'Full Refunds (No Penalty)',
                'refunds.approve' => 'Approve Refunds',
            ],
            self::MODULE_PASSENGERS => [
                'passengers.view' => 'View Passengers',
                'passengers.edit' => 'Edit Passenger Details',
                'passengers.correct_name' => 'Correct Passenger Name',
                'passengers.correct_passport' => 'Correct Passport Details',
            ],
            self::MODULE_SUPPORT => [
                'support.view' => 'View Support Tickets',
                'support.respond' => 'Respond to Tickets',
                'support.assign' => 'Assign Tickets',
                'support.close' => 'Close Tickets',
                'support.view_all' => 'View All Tickets',
            ],
            self::MODULE_USERS => [
                'users.view' => 'View Users',
                'users.create' => 'Create Users',
                'users.edit' => 'Edit Users',
                'users.delete' => 'Delete Users',
                'users.assign_roles' => 'Assign Roles to Users',
                'users.assign_permissions' => 'Assign Direct Permissions',
            ],
            self::MODULE_ROLES => [
                'roles.view' => 'View Roles',
                'roles.create' => 'Create Roles',
                'roles.edit' => 'Edit Roles',
                'roles.delete' => 'Delete Roles',
                'roles.assign_permissions' => 'Assign Permissions to Roles',
            ],
            self::MODULE_FLIGHTS => [
                'flights.view' => 'View Flights',
                'flights.create' => 'Create Flights',
                'flights.edit' => 'Edit Flights',
                'flights.delete' => 'Delete Flights',
            ],
            self::MODULE_HOTELS => [
                'hotels.view' => 'View Hotels',
                'hotels.create' => 'Create Hotels',
                'hotels.edit' => 'Edit Hotels',
                'hotels.delete' => 'Delete Hotels',
            ],
            self::MODULE_REPORTS => [
                'reports.view_sales' => 'View Sales Reports',
                'reports.view_financial' => 'View Financial Reports',
                'reports.export' => 'Export Reports',
            ],
            self::MODULE_SETTINGS => [
                'settings.view' => 'View Settings',
                'settings.edit' => 'Edit Settings',
            ],
            self::MODULE_PROMO_CODES => [
                'promo_codes.view' => 'View Promo Codes',
                'promo_codes.create' => 'Create Promo Codes',
                'promo_codes.edit' => 'Edit Promo Codes',
                'promo_codes.delete' => 'Delete Promo Codes',
            ],
            self::MODULE_REVIEWS => [
                'reviews.view' => 'View Reviews',
                'reviews.moderate' => 'Moderate Reviews',
                'reviews.delete' => 'Delete Reviews',
            ],
            self::MODULE_SUPPLIERS => [
                'suppliers.view' => 'View Suppliers',
                'suppliers.create' => 'Create Suppliers',
                'suppliers.edit' => 'Edit Suppliers',
                'suppliers.delete' => 'Delete Suppliers',
            ],
            self::MODULE_TRANSACTIONS => [
                'transactions.view' => 'View Transactions',
                'transactions.create' => 'Create Transactions',
            ],
        ];
    }
}
