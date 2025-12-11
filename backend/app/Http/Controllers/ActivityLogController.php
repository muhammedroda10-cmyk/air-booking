<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Get current user's activity history.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::forUser($request->user()->id)
            ->with('subject')
            ->orderBy('created_at', 'desc');

        // Filter by action type
        if ($request->has('action_type') && $request->action_type !== 'all') {
            $query->ofActionType($request->action_type);
        }

        // Filter by date range
        if ($request->has('from') && $request->has('to')) {
            $query->betweenDates($request->from, $request->to);
        }

        $activities = $query->paginate($request->get('per_page', 20));

        return response()->json($activities);
    }

    /**
     * Admin: Get all activity logs with filtering.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = ActivityLog::with(['user', 'subject'])
            ->orderBy('created_at', 'desc');

        // Filter by user
        if ($request->has('user_id') && $request->user_id) {
            $query->forUser($request->user_id);
        }

        // Filter by action
        if ($request->has('action') && $request->action !== 'all') {
            $query->ofAction($request->action);
        }

        // Filter by action type (category)
        if ($request->has('action_type') && $request->action_type !== 'all') {
            $query->ofActionType($request->action_type);
        }

        // Filter by date range
        if ($request->has('from') && $request->has('to')) {
            $query->betweenDates($request->from, $request->to);
        }

        // Search in description
        if ($request->has('search') && $request->search) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        $activities = $query->paginate($request->get('per_page', 25));

        return response()->json($activities);
    }

    /**
     * Admin: Get activity statistics.
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total' => ActivityLog::count(),
            'today' => ActivityLog::whereDate('created_at', today())->count(),
            'this_week' => ActivityLog::where('created_at', '>=', now()->startOfWeek())->count(),
            'by_type' => ActivityLog::selectRaw('SUBSTRING_INDEX(action, ".", 1) as type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type'),
            'recent_logins' => ActivityLog::ofAction('auth.login')
                ->with('user:id,name,email')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Get list of unique action types for filtering.
     */
    public function actionTypes(): JsonResponse
    {
        $types = ActivityLog::selectRaw('DISTINCT action')
            ->orderBy('action')
            ->pluck('action');

        // Group by category
        $grouped = [];
        foreach ($types as $action) {
            $parts = explode('.', $action);
            $category = $parts[0];
            if (!isset($grouped[$category])) {
                $grouped[$category] = [];
            }
            $grouped[$category][] = $action;
        }

        return response()->json([
            'actions' => $types,
            'grouped' => $grouped,
            'categories' => array_keys($grouped),
        ]);
    }
}
