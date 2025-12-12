<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Booking $booking;

    /**
     * Create a new event instance.
     */
    public function __construct(Booking $booking)
    {
        $this->booking = $booking->load(['user', 'flight.airline']);
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('bookings'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'booking.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'booking' => [
                'id' => $this->booking->id,
                'uuid' => $this->booking->uuid,
                'pnr' => $this->booking->pnr,
                'status' => $this->booking->status,
                'payment_status' => $this->booking->payment_status,
                'total_price' => $this->booking->total_price,
                'created_at' => $this->booking->created_at->toISOString(),
                'updated_at' => $this->booking->updated_at->toISOString(),
                'user' => $this->booking->user ? [
                    'id' => $this->booking->user->id,
                    'name' => $this->booking->user->name,
                    'email' => $this->booking->user->email,
                ] : null,
            ],
        ];
    }
}
