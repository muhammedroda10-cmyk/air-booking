<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Services\FlightSupplierManager;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    public function __construct(
        protected FlightSupplierManager $supplierManager
    ) {}

    /**
     * List all suppliers.
     */
    public function index()
    {
        $suppliers = Supplier::byPriority()->get();

        return response()->json([
            'suppliers' => $suppliers,
            'available_drivers' => $this->supplierManager->getAvailableDrivers(),
        ]);
    }

    /**
     * Create a new supplier.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:suppliers,code',
            'driver' => ['required', 'string', Rule::in($this->supplierManager->getAvailableDrivers())],
            'api_base_url' => 'nullable|url|max:500',
            'api_key' => 'nullable|string|max:500',
            'api_secret' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'priority' => 'integer|min:0',
            'config' => 'nullable|array',
            'timeout' => 'integer|min:1|max:120',
            'retry_times' => 'integer|min:0|max:10',
        ]);

        $supplier = Supplier::create($validated);

        return response()->json($supplier, 201);
    }

    /**
     * Show a supplier.
     */
    public function show(Supplier $supplier)
    {
        return response()->json($supplier);
    }

    /**
     * Update a supplier.
     */
    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('suppliers')->ignore($supplier->id)],
            'driver' => ['sometimes', 'string', Rule::in($this->supplierManager->getAvailableDrivers())],
            'api_base_url' => 'nullable|url|max:500',
            'api_key' => 'nullable|string|max:500',
            'api_secret' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'priority' => 'integer|min:0',
            'config' => 'nullable|array',
            'timeout' => 'integer|min:1|max:120',
            'retry_times' => 'integer|min:0|max:10',
        ]);

        $supplier->update($validated);

        // Clear cached instance
        $this->supplierManager->clearInstances();

        return response()->json($supplier);
    }

    /**
     * Delete a supplier.
     */
    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        $this->supplierManager->clearInstances();

        return response()->noContent();
    }

    /**
     * Toggle supplier active status.
     */
    public function toggleStatus(Supplier $supplier)
    {
        $supplier->update(['is_active' => !$supplier->is_active]);

        return response()->json([
            'message' => $supplier->is_active ? 'Supplier activated' : 'Supplier deactivated',
            'is_active' => $supplier->is_active,
        ]);
    }

    /**
     * Test supplier connection.
     */
    public function testConnection(Supplier $supplier)
    {
        try {
            $driver = $this->supplierManager->driver($supplier->code);
            $result = $driver->testConnection();

            return response()->json([
                'supplier' => $supplier->code,
                'success' => $result['success'],
                'message' => $result['message'],
                'latency_ms' => $result['latency_ms'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'supplier' => $supplier->code,
                'success' => false,
                'message' => 'Failed to test connection: ' . $e->getMessage(),
            ], 500);
        }
    }
}
