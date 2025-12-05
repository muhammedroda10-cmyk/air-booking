<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * Get user's notifications
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->notifications();

        if ($request->has('unread') && $request->unread === 'true') {
            $query->unread();
        }

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        $unreadCount = $request->user()->notifications()->unread()->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Get unread notification count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $request->user()->notifications()->unread()->count();

        return response()->json([
            'unread_count' => $count,
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        // Ensure user owns this notification
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->notifications()
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        // Ensure user owns this notification
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted',
        ]);
    }

    /**
     * Clear all notifications
     */
    public function clearAll(Request $request): JsonResponse
    {
        $request->user()->notifications()->delete();

        return response()->json([
            'message' => 'All notifications cleared',
        ]);
    }

    /**
     * Send a notification to a user (admin use or internal)
     */
    public static function sendNotification(
        int $userId,
        string $type,
        string $title,
        string $message,
        array $data = []
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'sent_via' => 'in_app',
        ]);
    }

    /**
     * Notification types helper
     */
    public static function notifyBookingConfirmed(int $userId, array $bookingData): Notification
    {
        return self::sendNotification(
            $userId,
            'booking_confirmed',
            'Booking Confirmed!',
            "Your booking {$bookingData['pnr']} has been confirmed. Have a great trip!",
            $bookingData
        );
    }

    public static function notifyBookingCancelled(int $userId, array $bookingData): Notification
    {
        return self::sendNotification(
            $userId,
            'booking_cancelled',
            'Booking Cancelled',
            "Your booking {$bookingData['pnr']} has been cancelled. Refund of \${$bookingData['refund_amount']} will be processed.",
            $bookingData
        );
    }

    public static function notifyPaymentReceived(int $userId, array $paymentData): Notification
    {
        return self::sendNotification(
            $userId,
            'payment_received',
            'Payment Received',
            "Payment of \${$paymentData['amount']} has been received for booking {$paymentData['pnr']}.",
            $paymentData
        );
    }

    public static function notifyRefundProcessed(int $userId, array $refundData): Notification
    {
        return self::sendNotification(
            $userId,
            'refund_processed',
            'Refund Processed',
            "A refund of \${$refundData['amount']} has been processed and credited to your wallet.",
            $refundData
        );
    }
}
