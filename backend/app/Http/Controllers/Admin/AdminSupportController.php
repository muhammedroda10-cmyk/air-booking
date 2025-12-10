<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\SupportTicket;
use App\Models\TicketMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AdminSupportController extends Controller
{
    /**
     * List all support tickets with filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SupportTicket::with([
            'user',
            'booking',
            'assignedAdmin',
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

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by assignment
        if ($request->has('assigned_to')) {
            if ($request->assigned_to === 'unassigned') {
                $query->unassigned();
            } elseif ($request->assigned_to === 'me') {
                $query->assignedTo($request->user()->id);
            } else {
                $query->assignedTo($request->assigned_to);
            }
        }

        // Search by ticket number or subject
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $tickets = $query->paginate($request->get('per_page', 15));

        return response()->json($tickets);
    }

    /**
     * Get support ticket statistics.
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total' => SupportTicket::count(),
            'open' => SupportTicket::status('open')->count(),
            'in_progress' => SupportTicket::status('in_progress')->count(),
            'awaiting_customer' => SupportTicket::status('awaiting_customer')->count(),
            'resolved' => SupportTicket::status('resolved')->count(),
            'closed' => SupportTicket::status('closed')->count(),
            'urgent' => SupportTicket::priority('urgent')->open()->count(),
            'high_priority' => SupportTicket::priority('high')->open()->count(),
            'unassigned' => SupportTicket::unassigned()->open()->count(),
        ];

        // Get recent tickets
        $recentTickets = SupportTicket::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Get admin users for assignment dropdown
        $admins = User::where('role', 'admin')
            ->select('id', 'name', 'email')
            ->get();

        return response()->json([
            'stats' => $stats,
            'recent_tickets' => $recentTickets,
            'admins' => $admins,
        ]);
    }

    /**
     * Show a single ticket with all details.
     */
    public function show(SupportTicket $ticket): JsonResponse
    {
        $ticket->load([
            'user',
            'booking.passengers',
            'booking.flight.airline',
            'assignedAdmin',
            'messages.user',
        ]);

        return response()->json($ticket);
    }

    /**
     * Update ticket status, priority, or assignment.
     */
    public function update(Request $request, SupportTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:open,in_progress,awaiting_customer,resolved,closed',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
        ]);

        try {
            $oldStatus = $ticket->status;
            $changes = [];

            if (isset($validated['status'])) {
                $changes['status'] = $validated['status'];
                if ($validated['status'] === 'resolved' && $ticket->status !== 'resolved') {
                    $changes['resolved_at'] = now();
                }
                if ($validated['status'] === 'closed' && $ticket->status !== 'closed') {
                    $changes['closed_at'] = now();
                }
            }

            if (isset($validated['priority'])) {
                $changes['priority'] = $validated['priority'];
            }

            if (array_key_exists('assigned_to', $validated)) {
                $changes['assigned_to'] = $validated['assigned_to'];
            }

            $ticket->update($changes);

            // Notify user of status change
            if (isset($validated['status']) && $oldStatus !== $validated['status']) {
                Notification::create([
                    'user_id' => $ticket->user_id,
                    'type' => 'support_ticket',
                    'title' => 'Ticket Status Updated',
                    'message' => "Your support ticket #{$ticket->ticket_number} status has been updated to: " . ucfirst(str_replace('_', ' ', $validated['status'])),
                    'data' => ['ticket_id' => $ticket->id, 'status' => $validated['status']],
                ]);
            }

            Log::info('Support ticket updated by admin', [
                'ticket_id' => $ticket->id,
                'admin_id' => $request->user()->id,
                'changes' => $validated,
            ]);

            return response()->json([
                'ticket' => $ticket->fresh(['user', 'assignedAdmin']),
                'message' => 'Ticket updated successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update support ticket', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to update ticket. Please try again.',
            ], 500);
        }
    }

    /**
     * Add an admin reply to a ticket.
     */
    public function reply(Request $request, SupportTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|min:1',
            'is_internal_note' => 'boolean',
            'status' => 'sometimes|in:open,in_progress,awaiting_customer,resolved',
        ]);

        try {
            $message = TicketMessage::create([
                'support_ticket_id' => $ticket->id,
                'user_id' => $request->user()->id,
                'message' => $validated['message'],
                'is_internal_note' => $validated['is_internal_note'] ?? false,
            ]);

            // Update status if provided
            $statusUpdate = [];
            if (isset($validated['status'])) {
                $statusUpdate['status'] = $validated['status'];
                if ($validated['status'] === 'resolved') {
                    $statusUpdate['resolved_at'] = now();
                }
            } elseif (!($validated['is_internal_note'] ?? false)) {
                // Auto-update to await customer response (unless internal note)
                $statusUpdate['status'] = 'awaiting_customer';
            }

            // Auto-assign if not assigned
            if (empty($ticket->assigned_to)) {
                $statusUpdate['assigned_to'] = $request->user()->id;
            }

            if (!empty($statusUpdate)) {
                $ticket->update($statusUpdate);
            }

            // Notify user of reply (unless internal note)
            if (!($validated['is_internal_note'] ?? false)) {
                Notification::create([
                    'user_id' => $ticket->user_id,
                    'type' => 'support_ticket',
                    'title' => 'New Reply on Your Ticket',
                    'message' => "You have a new reply on support ticket #{$ticket->ticket_number}.",
                    'data' => ['ticket_id' => $ticket->id, 'message_id' => $message->id],
                ]);
            }

            Log::info('Admin replied to support ticket', [
                'ticket_id' => $ticket->id,
                'admin_id' => $request->user()->id,
                'is_internal' => $validated['is_internal_note'] ?? false,
            ]);

            return response()->json([
                'message' => $message->load('user'),
                'ticket' => $ticket->fresh(),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to add admin reply', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to add reply. Please try again.',
            ], 500);
        }
    }

    /**
     * Bulk update tickets.
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ticket_ids' => 'required|array|min:1',
            'ticket_ids.*' => 'exists:support_tickets,id',
            'action' => 'required|in:assign,change_status,change_priority',
            'value' => 'required',
        ]);

        try {
            $tickets = SupportTicket::whereIn('id', $validated['ticket_ids']);

            switch ($validated['action']) {
                case 'assign':
                    $tickets->update(['assigned_to' => $validated['value'] ?: null]);
                    break;
                case 'change_status':
                    $updates = ['status' => $validated['value']];
                    if ($validated['value'] === 'resolved') {
                        $updates['resolved_at'] = now();
                    } elseif ($validated['value'] === 'closed') {
                        $updates['closed_at'] = now();
                    }
                    $tickets->update($updates);
                    break;
                case 'change_priority':
                    $tickets->update(['priority' => $validated['value']]);
                    break;
            }

            return response()->json([
                'message' => 'Tickets updated successfully',
                'updated_count' => count($validated['ticket_ids']),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed bulk update', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to update tickets.',
            ], 500);
        }
    }
}
