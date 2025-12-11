<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'description',
        'subject_type',
        'subject_id',
        'properties',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * User who performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The subject of the activity (polymorphic).
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope by user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope by action type.
     */
    public function scopeOfAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope by action prefix (e.g., 'auth' for auth.login, auth.logout).
     */
    public function scopeOfActionType($query, $type)
    {
        return $query->where('action', 'like', $type . '.%');
    }

    /**
     * Scope by date range.
     */
    public function scopeBetweenDates($query, $from, $to)
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }

    /**
     * Scope for recent activities.
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Get the action category (first part before dot).
     */
    public function getActionCategoryAttribute(): string
    {
        return explode('.', $this->action)[0] ?? $this->action;
    }

    /**
     * Get the action name (second part after dot).
     */
    public function getActionNameAttribute(): string
    {
        $parts = explode('.', $this->action);
        return $parts[1] ?? $this->action;
    }

    /**
     * Get old values from properties.
     */
    public function getOldValuesAttribute(): ?array
    {
        return $this->properties['old'] ?? null;
    }

    /**
     * Get new values from properties.
     */
    public function getNewValuesAttribute(): ?array
    {
        return $this->properties['new'] ?? null;
    }
}
