<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'role_id',
        'phone',
        'date_of_birth',
        'passport_number',
        'passport_expiry',
        'nationality',
        'address',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'passport_expiry' => 'date',
        ];
    }

    /**
     * Get the user's role.
     */
    public function roleRelation(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Get direct permissions for the user.
     */
    public function directPermissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permission')
            ->withTimestamps();
    }

    /**
     * Check if the user is an admin (any staff role).
     */
    public function isAdmin(): bool
    {
        // Legacy support for 'role' string field
        if ($this->role === 'admin') {
            return true;
        }

        // New role-based check
        if ($this->roleRelation) {
            return $this->roleRelation->isStaffRole();
        }

        return false;
    }

    /**
     * Check if user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        if ($this->roleRelation) {
            return $this->roleRelation->isSuperAdmin();
        }
        return $this->role === 'admin'; // Legacy fallback
    }

    /**
     * Check if user is a staff member (not a customer).
     */
    public function isStaff(): bool
    {
        return $this->isAdmin();
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $roleSlug): bool
    {
        if ($this->roleRelation) {
            return $this->roleRelation->slug === $roleSlug;
        }
        return false;
    }

    /**
     * Check if user has a specific permission.
     * Checks both role permissions and direct user permissions.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        // Super admins have all permissions
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Check direct user permissions first
        if ($this->directPermissions()->where('slug', $permissionSlug)->exists()) {
            return true;
        }

        // Check role permissions
        if ($this->roleRelation && $this->roleRelation->hasPermission($permissionSlug)) {
            return true;
        }

        return false;
    }

    /**
     * Check if user has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get all permissions for the user (role + direct).
     */
    public function getAllPermissions(): \Illuminate\Support\Collection
    {
        $permissions = $this->directPermissions()->get();

        if ($this->roleRelation) {
            $permissions = $permissions->merge($this->roleRelation->permissions);
        }

        return $permissions->unique('id');
    }

    /**
     * Grant a direct permission to the user.
     */
    public function grantPermission(Permission $permission): void
    {
        if (!$this->directPermissions()->where('permission_id', $permission->id)->exists()) {
            $this->directPermissions()->attach($permission->id);
        }
    }

    /**
     * Revoke a direct permission from the user.
     */
    public function revokePermission(Permission $permission): void
    {
        $this->directPermissions()->detach($permission->id);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function hotelBookings(): HasMany
    {
        return $this->hasMany(HotelBooking::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    public function priceAlerts(): HasMany
    {
        return $this->hasMany(PriceAlert::class);
    }

    public function loyaltyPoints(): HasOne
    {
        return $this->hasOne(LoyaltyPoints::class);
    }

    public function unreadNotifications(): HasMany
    {
        return $this->notifications()->unread();
    }

    /**
     * Get user's support tickets.
     */
    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class);
    }

    /**
     * Get tickets assigned to this admin.
     */
    public function assignedTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class, 'assigned_to');
    }
}

