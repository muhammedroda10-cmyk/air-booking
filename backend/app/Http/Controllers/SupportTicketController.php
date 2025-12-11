<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Notification;
use App\Models\SupportTicket;
use App\Models\TicketMessage;
use App\Services\ActivityService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class SupportTicketController extends Controller
{
    /**
     * List user's support tickets.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->supportTickets()->with([
            'booking',
            'messages' => function ($q) {
                $q->latest()->limit(1);
            }
        ]);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        $tickets = $query->orderBy('created_at', 'desc')->paginate(10);

        // Add statistics
        $stats = [
            'total' => $request->user()->supportTickets()->count(),
            'open' => $request->user()->supportTickets()->open()->count(),
            'resolved' => $request->user()->supportTickets()->status('resolved')->count(),
            'closed' => $request->user()->supportTickets()->status('closed')->count(),
        ];

        return response()->json([
            'tickets' => $tickets,
            'stats' => $stats,
        ]);
    }

    /**
     * Create a new support ticket.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'category' => 'required|in:booking_issue,payment_issue,refund_request,flight_change,general_inquiry,complaint',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'message' => 'required|string|min:10',
            'booking_id' => 'nullable|exists:bookings,id',
        ]);

        // Verify booking belongs to user if provided
        if (!empty($validated['booking_id'])) {
            $booking = Booking::find($validated['booking_id']);
            if (!$booking || $booking->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Invalid booking selected'], 422);
            }
        }

        try {
            $ticket = SupportTicket::create([
                'user_id' => $request->user()->id,
                'booking_id' => $validated['booking_id'] ?? null,
                'subject' => $validated['subject'],
                'category' => $validated['category'],
                'priority' => $validated['priority'] ?? 'medium',
                'status' => 'open',
            ]);

            // Create the initial message
            TicketMessage::create([
                'support_ticket_id' => $ticket->id,
                'user_id' => $request->user()->id,
                'message' => $validated['message'],
            ]);

            // Send notification
            Notification::create([
                'user_id' => $request->user()->id,
                'type' => 'support_ticket',
                'title' => 'Support Ticket Created',
                'message' => "Your support ticket #{$ticket->ticket_number} has been created. We'll respond shortly.",
                'data' => ['ticket_id' => $ticket->id],
            ]);

            Log::info('Support ticket created', [
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'user_id' => $request->user()->id,
                'category' => $ticket->category,
            ]);

            // Log activity
            ActivityService::logSupportTicketCreated($ticket);

            return response()->json([
                'ticket' => $ticket->load('messages'),
                'message' => 'Support ticket created successfully',
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create support ticket', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to create support ticket. Please try again.',
            ], 500);
        }
    }

    /**
     * Show a single support ticket with messages.
     */
    public function show(Request $request, SupportTicket $ticket): JsonResponse
    {
        // Ensure user owns this ticket
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $ticket->load(['messages.user', 'booking', 'assignedAdmin']);

        // Filter out internal notes for regular users
        $ticket->messages = $ticket->messages->filter(function ($message) {
            return !$message->is_internal_note;
        })->values();

        return response()->json($ticket);
    }

    /**
     * Add a message to a ticket.
     */
    public function addMessage(Request $request, SupportTicket $ticket): JsonResponse
    {
        // Ensure user owns this ticket
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Cannot add messages to closed tickets
        if ($ticket->status === 'closed') {
            return response()->json(['message' => 'Cannot add messages to closed tickets'], 422);
        }

        $validated = $request->validate([
            'message' => 'required|string|min:1',
        ]);

        try {
            $message = TicketMessage::create([
                'support_ticket_id' => $ticket->id,
                'user_id' => $request->user()->id,
                'message' => $validated['message'],
            ]);

            // Update ticket status if it was awaiting customer
            if ($ticket->status === 'awaiting_customer') {
                $ticket->update(['status' => 'open']);
            }

            return response()->json([
                'message' => $message->load('user'),
                'ticket' => $ticket->fresh(),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to add message to ticket', [
                'ticket_id' => $ticket->id,
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to add message. Please try again.',
            ], 500);
        }
    }

    /**
     * Close a ticket (user can close their own resolved tickets).
     */
    public function close(Request $request, SupportTicket $ticket): JsonResponse
    {
        // Ensure user owns this ticket
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($ticket->status === 'closed') {
            return response()->json(['message' => 'Ticket is already closed'], 422);
        }

        $ticket->close();

        Notification::create([
            'user_id' => $request->user()->id,
            'type' => 'support_ticket',
            'title' => 'Ticket Closed',
            'message' => "Your support ticket #{$ticket->ticket_number} has been closed.",
            'data' => ['ticket_id' => $ticket->id],
        ]);

        return response()->json([
            'ticket' => $ticket,
            'message' => 'Ticket closed successfully',
        ]);
    }

    /**
     * Reopen a closed ticket.
     */
    public function reopen(Request $request, SupportTicket $ticket): JsonResponse
    {
        // Ensure user owns this ticket
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($ticket->status, ['resolved', 'closed'])) {
            return response()->json(['message' => 'Only resolved or closed tickets can be reopened'], 422);
        }

        $ticket->reopen();

        return response()->json([
            'ticket' => $ticket,
            'message' => 'Ticket reopened successfully',
        ]);
    }

    /**
     * Get ticket categories and priorities.
     */
    public function options(): JsonResponse
    {
        return response()->json([
            'categories' => SupportTicket::getCategories(),
            'priorities' => SupportTicket::getPriorities(),
            'statuses' => SupportTicket::getStatuses(),
        ]);
    }
}
