<?php

namespace App\Http\Controllers;

use App\Models\Airline;
use Illuminate\Http\Request;

class AirlineController extends Controller
{
    public function index()
    {
        return Airline::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:airlines,name',
            'code' => 'required|string|max:3|unique:airlines,code',
        ]);

        return Airline::create($validated);
    }

    public function show(Airline $airline)
    {
        return $airline;
    }

    public function update(Request $request, Airline $airline)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:airlines,name,' . $airline->id,
            'code' => 'sometimes|string|max:3|unique:airlines,code,' . $airline->id,
        ]);

        $airline->update($validated);

        return $airline;
    }

    public function destroy(Airline $airline)
    {
        $airline->delete();

        return response()->noContent();
    }
}
