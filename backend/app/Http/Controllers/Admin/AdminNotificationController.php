<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    /**
     * Get all sent notifications
     */
    public function index(Request $request)
    {
        $notifications = Notification::select('id', 'type', 'data', 'created_at')
            ->orderBy('created_at', 'desc')
            ->take(100)
            ->get()
            ->groupBy(function ($notification) {
                return $notification->created_at->format('Y-m-d H:i');
            })
            ->map(function ($group) {
                $first = $group->first();
                return [
                    'id' => $first->id,
                    'title' => $first->data['title'] ?? 'Notification',
                    'message' => $first->data['message'] ?? '',
                    'type' => $first->data['notification_type'] ?? $first->type ?? 'info',
                    'status' => 'sent',
                    'sent_at' => $first->created_at->toISOString(),
                    'recipients_count' => $group->count(),
                ];
            })
            ->values();

        return response()->json([
            'notifications' => $notifications,
        ]);
    }

    /**
     * Send a notification to users
     */
    public function send(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'type' => 'required|in:info,success,warning,error',
            'target' => 'required|in:all,admins,customers',
        ]);

        // Get target users
        $usersQuery = User::query();
        
        if ($validated['target'] === 'admins') {
            $usersQuery->where('role', 'admin');
        } elseif ($validated['target'] === 'customers') {
            $usersQuery->where('role', '!=', 'admin');
        }

        $users = $usersQuery->get();
        $sentCount = 0;

        foreach ($users as $user) {
            $user->notifications()->create([
                'type' => 'system',
                'data' => [
                    'title' => $validated['title'],
                    'message' => $validated['message'],
                    'notification_type' => $validated['type'],
                ],
            ]);
            $sentCount++;
        }

        return response()->json([
            'message' => 'Notification sent successfully',
            'recipients_count' => $sentCount,
        ]);
    }
}
