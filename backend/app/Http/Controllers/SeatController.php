<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use Illuminate\Http\Request;

class SeatController extends Controller
{
    public function index(Flight $flight)
    {
        return $flight->seats;
    }
}
