<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'driver',
        'api_base_url',
        'api_key',
        'api_secret',
        'is_active',
        'priority',
        'config',
        'timeout',
        'retry_times',
        'last_health_check',
        'is_healthy',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_healthy' => 'boolean',
        'config' => 'array',
        'last_health_check' => 'datetime',
    ];

    protected $hidden = [
        'api_key',
        'api_secret',
    ];

    /**
     * Encrypt the API key when setting.
     */
    public function setApiKeyAttribute($value)
    {
        $this->attributes['api_key'] = $value ? encrypt($value) : null;
    }

    /**
     * Decrypt the API key when getting.
     */
    public function getApiKeyAttribute($value)
    {
        return $value ? decrypt($value) : null;
    }

    /**
     * Encrypt the API secret when setting.
     */
    public function setApiSecretAttribute($value)
    {
        $this->attributes['api_secret'] = $value ? encrypt($value) : null;
    }

    /**
     * Decrypt the API secret when getting.
     */
    public function getApiSecretAttribute($value)
    {
        return $value ? decrypt($value) : null;
    }

    /**
     * Scope a query to only include active suppliers.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include healthy suppliers.
     */
    public function scopeHealthy($query)
    {
        return $query->where('is_healthy', true);
    }

    /**
     * Scope to order by priority (highest first).
     */
    public function scopeByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }

    /**
     * Get a configuration value.
     */
    public function getConfig(string $key, $default = null)
    {
        return data_get($this->config, $key, $default);
    }

    /**
     * Set a configuration value.
     */
    public function setConfig(string $key, $value): self
    {
        $config = $this->config ?? [];
        data_set($config, $key, $value);
        $this->config = $config;
        return $this;
    }

    /**
     * Mark supplier as healthy.
     */
    public function markHealthy(): void
    {
        $this->update([
            'is_healthy' => true,
            'last_health_check' => now(),
        ]);
    }

    /**
     * Mark supplier as unhealthy.
     */
    public function markUnhealthy(): void
    {
        $this->update([
            'is_healthy' => false,
            'last_health_check' => now(),
        ]);
    }
}
