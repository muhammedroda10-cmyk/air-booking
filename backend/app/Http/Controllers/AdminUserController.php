<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    /**
     * Get all users with pagination
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->withCount(['bookings', 'hotelBookings'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($users);
    }

    /**
     * Get a single user with details
     */
    public function show(User $user)
    {
        $user->load(['wallet', 'bookings.flight', 'hotelBookings.hotel']);
        $user->loadCount(['bookings', 'hotelBookings']);

        return response()->json($user);
    }

    /**
     * Update user details
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:user,admin',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Toggle user active status (soft ban)
     */
    public function toggleStatus(User $user)
    {
        // Prevent self-deactivation
        if ($user->id === request()->user()->id) {
            return response()->json([
                'message' => 'You cannot deactivate your own account'
            ], 422);
        }

        $user->is_active = !($user->is_active ?? true);
        $user->save();

        return response()->json([
            'message' => $user->is_active ? 'User activated' : 'User deactivated',
            'user' => $user
        ]);
    }

    /**
     * Delete a user
     */
    public function destroy(User $user)
    {
        // Prevent self-deletion
        if ($user->id === request()->user()->id) {
            return response()->json([
                'message' => 'You cannot delete your own account'
            ], 422);
        }

        // Check for active bookings
        $activeBookings = $user->bookings()
            ->whereIn('status', ['pending', 'confirmed'])
            ->count();

        if ($activeBookings > 0) {
            return response()->json([
                'message' => 'Cannot delete user with active bookings'
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }
}
