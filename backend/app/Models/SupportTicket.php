<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SupportTicket extends Model
{
    use HasFactory;

    // Ticket categories
    public const CATEGORY_BOOKING_ISSUE = 'booking_issue';
    public const CATEGORY_PAYMENT_ISSUE = 'payment_issue';
    public const CATEGORY_REFUND_REQUEST = 'refund_request';
    public const CATEGORY_FLIGHT_CHANGE = 'flight_change';
    public const CATEGORY_GENERAL_INQUIRY = 'general_inquiry';
    public const CATEGORY_COMPLAINT = 'complaint';

    // Priority levels
    public const PRIORITY_LOW = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH = 'high';
    public const PRIORITY_URGENT = 'urgent';

    // Status types
    public const STATUS_OPEN = 'open';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_AWAITING_CUSTOMER = 'awaiting_customer';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_CLOSED = 'closed';

    protected $fillable = [
        'user_id',
        'booking_id',
        'ticket_number',
        'subject',
        'category',
        'priority',
        'status',
        'assigned_to',
        'resolved_at',
        'closed_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    /**
     * Generate a unique ticket number.
     */
    public static function generateTicketNumber(): string
    {
        do {
            $number = 'TKT-' . strtoupper(Str::random(8));
        } while (self::where('ticket_number', $number)->exists());

        return $number;
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($ticket) {
            if (empty($ticket->ticket_number)) {
                $ticket->ticket_number = self::generateTicketNumber();
            }
        });
    }

    /**
     * Get the user who created the ticket.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the booking associated with this ticket.
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Get the admin assigned to this ticket.
     */
    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get all messages for this ticket.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(TicketMessage::class)->orderBy('created_at', 'asc');
    }

    /**
     * Get the initial message (first message in the thread).
     */
    public function initialMessage()
    {
        return $this->messages()->oldest()->first();
    }

    /**
     * Get the last message in the thread.
     */
    public function lastMessage()
    {
        return $this->messages()->latest()->first();
    }

    /**
     * Check if ticket is open.
     */
    public function isOpen(): bool
    {
        return in_array($this->status, [self::STATUS_OPEN, self::STATUS_IN_PROGRESS, self::STATUS_AWAITING_CUSTOMER]);
    }

    /**
     * Check if ticket is closed.
     */
    public function isClosed(): bool
    {
        return in_array($this->status, [self::STATUS_RESOLVED, self::STATUS_CLOSED]);
    }

    /**
     * Mark ticket as resolved.
     */
    public function markAsResolved(): void
    {
        $this->update([
            'status' => self::STATUS_RESOLVED,
            'resolved_at' => now(),
        ]);
    }

    /**
     * Close the ticket.
     */
    public function close(): void
    {
        $this->update([
            'status' => self::STATUS_CLOSED,
            'closed_at' => now(),
        ]);
    }

    /**
     * Reopen the ticket.
     */
    public function reopen(): void
    {
        $this->update([
            'status' => self::STATUS_OPEN,
            'resolved_at' => null,
            'closed_at' => null,
        ]);
    }

    /**
     * Scope: Filter by status.
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Only open tickets.
     */
    public function scopeOpen($query)
    {
        return $query->whereIn('status', [self::STATUS_OPEN, self::STATUS_IN_PROGRESS, self::STATUS_AWAITING_CUSTOMER]);
    }

    /**
     * Scope: Only closed/resolved tickets.
     */
    public function scopeClosed($query)
    {
        return $query->whereIn('status', [self::STATUS_RESOLVED, self::STATUS_CLOSED]);
    }

    /**
     * Scope: Filter by priority.
     */
    public function scopePriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope: Tickets assigned to a specific admin.
     */
    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    /**
     * Scope: Unassigned tickets.
     */
    public function scopeUnassigned($query)
    {
        return $query->whereNull('assigned_to');
    }

    /**
     * Get category label.
     */
    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            self::CATEGORY_BOOKING_ISSUE => 'Booking Issue',
            self::CATEGORY_PAYMENT_ISSUE => 'Payment Issue',
            self::CATEGORY_REFUND_REQUEST => 'Refund Request',
            self::CATEGORY_FLIGHT_CHANGE => 'Flight Change',
            self::CATEGORY_GENERAL_INQUIRY => 'General Inquiry',
            self::CATEGORY_COMPLAINT => 'Complaint',
            default => ucfirst(str_replace('_', ' ', $this->category)),
        };
    }

    /**
     * Get priority label.
     */
    public function getPriorityLabelAttribute(): string
    {
        return ucfirst($this->priority);
    }

    /**
     * Get status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_OPEN => 'Open',
            self::STATUS_IN_PROGRESS => 'In Progress',
            self::STATUS_AWAITING_CUSTOMER => 'Awaiting Customer',
            self::STATUS_RESOLVED => 'Resolved',
            self::STATUS_CLOSED => 'Closed',
            default => ucfirst(str_replace('_', ' ', $this->status)),
        };
    }

    /**
     * Get all available categories.
     */
    public static function getCategories(): array
    {
        return [
            self::CATEGORY_BOOKING_ISSUE => 'Booking Issue',
            self::CATEGORY_PAYMENT_ISSUE => 'Payment Issue',
            self::CATEGORY_REFUND_REQUEST => 'Refund Request',
            self::CATEGORY_FLIGHT_CHANGE => 'Flight Change',
            self::CATEGORY_GENERAL_INQUIRY => 'General Inquiry',
            self::CATEGORY_COMPLAINT => 'Complaint',
        ];
    }

    /**
     * Get all available priorities.
     */
    public static function getPriorities(): array
    {
        return [
            self::PRIORITY_LOW => 'Low',
            self::PRIORITY_MEDIUM => 'Medium',
            self::PRIORITY_HIGH => 'High',
            self::PRIORITY_URGENT => 'Urgent',
        ];
    }

    /**
     * Get all available statuses.
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_OPEN => 'Open',
            self::STATUS_IN_PROGRESS => 'In Progress',
            self::STATUS_AWAITING_CUSTOMER => 'Awaiting Customer',
            self::STATUS_RESOLVED => 'Resolved',
            self::STATUS_CLOSED => 'Closed',
        ];
    }
}
