<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RoleController extends Controller
{
    /**
     * List all roles
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->hasPermission('roles.view')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $roles = Role::withCount('users')
            ->with('permissions:id,name,slug,module')
            ->get();

        return response()->json([
            'roles' => $roles,
        ]);
    }

    /**
     * Get a specific role with its permissions
     */
    public function show(Request $request, Role $role)
    {
        $user = $request->user();

        if (!$user->hasPermission('roles.view')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $role->load(['permissions', 'users:id,name,email']);

        return response()->json($role);
    }

    /**
     * Create a new role
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->hasPermission('roles.create')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:roles,slug',
            'description' => 'nullable|string|max:500',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        try {
            $role = DB::transaction(function () use ($request) {
                $role = Role::create([
                    'name' => $request->name,
                    'slug' => $request->slug,
                    'description' => $request->description,
                    'is_system' => false,
                ]);

                if ($request->has('permissions')) {
                    $role->permissions()->sync($request->permissions);
                }

                return $role;
            });

            return response()->json([
                'message' => 'Role created successfully',
                'role' => $role->load('permissions'),
            ], 201);

        } catch (\Exception $e) {
            Log::error("Role creation failed", ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to create role'], 500);
        }
    }

    /**
     * Update a role
     */
    public function update(Request $request, Role $role)
    {
        $user = $request->user();

        if (!$user->hasPermission('roles.edit')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        // Prevent editing system roles' slug
        if ($role->is_system && $request->has('slug') && $request->slug !== $role->slug) {
            return response()->json([
                'message' => 'Cannot change slug of system roles',
            ], 400);
        }

        $request->validate([
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string|max:500',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        try {
            DB::transaction(function () use ($role, $request) {
                $role->update($request->only(['name', 'description']));

                if ($request->has('permissions')) {
                    $role->permissions()->sync($request->permissions);
                }
            });

            return response()->json([
                'message' => 'Role updated successfully',
                'role' => $role->fresh()->load('permissions'),
            ]);

        } catch (\Exception $e) {
            Log::error("Role update failed", ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to update role'], 500);
        }
    }

    /**
     * Delete a role
     */
    public function destroy(Request $request, Role $role)
    {
        $user = $request->user();

        if (!$user->hasPermission('roles.delete')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        if ($role->is_system) {
            return response()->json([
                'message' => 'Cannot delete system roles',
            ], 400);
        }

        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete role with assigned users',
            ], 400);
        }

        $role->permissions()->detach();
        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully',
        ]);
    }

    /**
     * Get all available permissions grouped by module
     */
    public function permissions(Request $request)
    {
        $user = $request->user();

        if (!$user->hasPermission('roles.view')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $permissions = Permission::all()->groupBy('module');

        return response()->json([
            'permissions' => $permissions,
            'modules' => Permission::getModules(),
        ]);
    }

    /**
     * Assign role to user
     */
    public function assignToUser(Request $request, User $targetUser)
    {
        $user = $request->user();

        if (!$user->hasPermission('users.assign_roles')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $targetUser->update(['role_id' => $request->role_id]);

        return response()->json([
            'message' => 'Role assigned successfully',
            'user' => $targetUser->load('roleRelation'),
        ]);
    }

    /**
     * Assign direct permissions to user
     */
    public function assignPermissionsToUser(Request $request, User $targetUser)
    {
        $user = $request->user();

        if (!$user->hasPermission('users.assign_permissions')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $targetUser->directPermissions()->sync($request->permissions);

        return response()->json([
            'message' => 'Permissions assigned successfully',
            'user' => $targetUser->load('directPermissions'),
        ]);
    }
}
