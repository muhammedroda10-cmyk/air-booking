<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'support_ticket_id',
        'user_id',
        'message',
        'is_internal_note',
        'attachments',
    ];

    protected $casts = [
        'is_internal_note' => 'boolean',
        'attachments' => 'array',
    ];

    /**
     * Get the ticket this message belongs to.
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }

    /**
     * Get the user who wrote this message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if this message is from an admin.
     */
    public function isFromAdmin(): bool
    {
        return $this->user && $this->user->isAdmin();
    }

    /**
     * Check if this message is from the ticket owner.
     */
    public function isFromCustomer(): bool
    {
        return $this->user_id === $this->ticket->user_id;
    }

    /**
     * Scope: Only public messages (exclude internal notes).
     */
    public function scopePublic($query)
    {
        return $query->where('is_internal_note', false);
    }

    /**
     * Scope: Only internal notes.
     */
    public function scopeInternalNotes($query)
    {
        return $query->where('is_internal_note', true);
    }
}
