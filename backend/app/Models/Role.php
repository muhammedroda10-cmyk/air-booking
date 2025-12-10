<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    // Role slugs
    const SUPER_ADMIN = 'super_admin';
    const SALES = 'sales';
    const ACCOUNTING = 'accounting';
    const SUPPORT = 'support';
    const CUSTOMER = 'customer';

    // Staff roles (not customers)
    const STAFF_ROLES = [
        self::SUPER_ADMIN,
        self::SALES,
        self::ACCOUNTING,
        self::SUPPORT,
    ];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    /**
     * Get the permissions for the role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permission')
            ->withTimestamps();
    }

    /**
     * Get the users with this role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Check if role has a specific permission.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        return $this->permissions()->where('slug', $permissionSlug)->exists();
    }

    /**
     * Grant a permission to this role.
     */
    public function grantPermission(Permission $permission): void
    {
        if (!$this->hasPermission($permission->slug)) {
            $this->permissions()->attach($permission->id);
        }
    }

    /**
     * Revoke a permission from this role.
     */
    public function revokePermission(Permission $permission): void
    {
        $this->permissions()->detach($permission->id);
    }

    /**
     * Check if this is a staff role.
     */
    public function isStaffRole(): bool
    {
        return in_array($this->slug, self::STAFF_ROLES);
    }

    /**
     * Check if this is the super admin role.
     */
    public function isSuperAdmin(): bool
    {
        return $this->slug === self::SUPER_ADMIN;
    }

    /**
     * Get role by slug.
     */
    public static function findBySlug(string $slug): ?self
    {
        return static::where('slug', $slug)->first();
    }
}
