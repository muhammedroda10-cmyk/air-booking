<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityService
{
    /**
     * Log an activity.
     *
     * @param string $action Action type (e.g., 'auth.login', 'booking.created')
     * @param string $description Human-readable description
     * @param Model|null $subject The subject of the activity (optional)
     * @param array $properties Additional data (old values, new values, etc.)
     * @param int|null $userId Override the user ID (defaults to authenticated user)
     */
    public static function log(
        string $action,
        string $description,
        ?Model $subject = null,
        array $properties = [],
        ?int $userId = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => $userId ?? Auth::id(),
            'action' => $action,
            'description' => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject?->getKey(),
            'properties' => !empty($properties) ? $properties : null,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'created_at' => now(),
        ]);
    }

    /**
     * Log an activity for a specific user.
     */
    public static function logForUser(
        int $userId,
        string $action,
        string $description,
        ?Model $subject = null,
        array $properties = []
    ): ActivityLog {
        return self::log($action, $description, $subject, $properties, $userId);
    }

    /**
     * Log a model creation.
     */
    public static function logCreated(Model $model, string $description = null): ActivityLog
    {
        $modelName = class_basename($model);
        return self::log(
            strtolower($modelName) . '.created',
            $description ?? "$modelName created",
            $model,
            ['new' => $model->toArray()]
        );
    }

    /**
     * Log a model update with old and new values.
     */
    public static function logUpdated(Model $model, array $oldValues, string $description = null): ActivityLog
    {
        $modelName = class_basename($model);
        $changes = $model->getChanges();
        
        return self::log(
            strtolower($modelName) . '.updated',
            $description ?? "$modelName updated",
            $model,
            [
                'old' => array_intersect_key($oldValues, $changes),
                'new' => $changes,
            ]
        );
    }

    /**
     * Log a model deletion.
     */
    public static function logDeleted(Model $model, string $description = null): ActivityLog
    {
        $modelName = class_basename($model);
        return self::log(
            strtolower($modelName) . '.deleted',
            $description ?? "$modelName deleted",
            null, // Subject is null since it's deleted
            ['deleted' => $model->toArray()]
        );
    }

    // ==========================================
    // Common Action Helpers
    // ==========================================

    /**
     * Log user login.
     */
    public static function logLogin(int $userId): ActivityLog
    {
        return self::logForUser($userId, 'auth.login', 'User logged in');
    }

    /**
     * Log user logout.
     */
    public static function logLogout(): ActivityLog
    {
        return self::log('auth.logout', 'User logged out');
    }

    /**
     * Log user registration.
     */
    public static function logRegistration(Model $user): ActivityLog
    {
        return self::log('auth.register', 'User registered', $user);
    }

    /**
     * Log password change.
     */
    public static function logPasswordChange(): ActivityLog
    {
        return self::log('auth.password_changed', 'Password changed');
    }

    /**
     * Log booking creation.
     */
    public static function logBookingCreated(Model $booking): ActivityLog
    {
        return self::log(
            'booking.created',
            "Booking #{$booking->pnr} created",
            $booking,
            ['total_price' => $booking->total_price, 'status' => $booking->status]
        );
    }

    /**
     * Log booking cancellation.
     */
    public static function logBookingCancelled(Model $booking, string $reason = null): ActivityLog
    {
        return self::log(
            'booking.cancelled',
            "Booking #{$booking->pnr} cancelled",
            $booking,
            ['reason' => $reason, 'refund_amount' => $booking->refund_amount ?? 0]
        );
    }

    /**
     * Log wallet deposit.
     */
    public static function logWalletDeposit(Model $transaction, float $amount): ActivityLog
    {
        return self::log(
            'wallet.deposit',
            "Wallet deposit of \${$amount}",
            $transaction,
            ['amount' => $amount, 'balance_after' => $transaction->balance_after ?? null]
        );
    }

    /**
     * Log wallet withdrawal.
     */
    public static function logWalletWithdraw(Model $transaction, float $amount): ActivityLog
    {
        return self::log(
            'wallet.withdraw',
            "Wallet withdrawal of \${$amount}",
            $transaction,
            ['amount' => $amount, 'balance_after' => $transaction->balance_after ?? null]
        );
    }

    /**
     * Log payment completion.
     */
    public static function logPaymentCompleted(Model $booking, float $amount): ActivityLog
    {
        return self::log(
            'payment.completed',
            "Payment of \${$amount} completed for booking #{$booking->pnr}",
            $booking,
            ['amount' => $amount, 'payment_method' => 'wallet']
        );
    }

    /**
     * Log support ticket creation.
     */
    public static function logSupportTicketCreated(Model $ticket): ActivityLog
    {
        return self::log(
            'support.created',
            "Support ticket #{$ticket->ticket_number} created",
            $ticket,
            ['category' => $ticket->category, 'priority' => $ticket->priority]
        );
    }

    /**
     * Log profile update.
     */
    public static function logProfileUpdated(array $changedFields): ActivityLog
    {
        return self::log(
            'profile.updated',
            'Profile information updated',
            null,
            ['fields_changed' => array_keys($changedFields)]
        );
    }

    // ==========================================
    // Admin Action Helpers
    // ==========================================

    /**
     * Log admin action on a user.
     */
    public static function logAdminUserAction(string $action, Model $targetUser, string $description = null): ActivityLog
    {
        return self::log(
            "admin.user.{$action}",
            $description ?? "Admin action: {$action} on user #{$targetUser->id}",
            $targetUser
        );
    }

    /**
     * Log admin action with custom details.
     */
    public static function logAdminAction(string $action, string $description, ?Model $subject = null, array $properties = []): ActivityLog
    {
        return self::log("admin.{$action}", $description, $subject, $properties);
    }
}
