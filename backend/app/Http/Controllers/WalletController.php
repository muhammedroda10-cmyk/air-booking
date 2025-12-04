<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function show(Request $request)
    {
        $wallet = $request->user()->wallet()->with('transactions')->firstOrCreate([
            'user_id' => $request->user()->id
        ]);

        return $wallet;
    }

    public function deposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $wallet = $request->user()->wallet()->firstOrCreate([
            'user_id' => $request->user()->id
        ]);

        DB::transaction(function () use ($wallet, $request) {
            $wallet->increment('balance', $request->amount);
            $wallet->transactions()->create([
                'amount' => $request->amount,
                'type' => 'credit',
                'description' => 'Deposit',
            ]);
        });

        return $wallet->load('transactions');
    }
}
