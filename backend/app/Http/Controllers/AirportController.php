<?php

namespace App\Http\Controllers;

use App\Models\Airport;
use Illuminate\Http\Request;

class AirportController extends Controller
{
    public function index()
    {
        return Airport::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:3|unique:airports,code',
            'city' => 'required|string|max:255',
            'country' => 'required|string|max:255',
        ]);

        return Airport::create($validated);
    }

    public function show(Airport $airport)
    {
        return $airport;
    }

    public function update(Request $request, Airport $airport)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:3|unique:airports,code,' . $airport->id,
            'city' => 'sometimes|string|max:255',
            'country' => 'sometimes|string|max:255',
        ]);

        $airport->update($validated);

        return $airport;
    }

    public function destroy(Airport $airport)
    {
        $airport->delete();

        return response()->noContent();
    }
}
