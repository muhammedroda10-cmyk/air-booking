<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    /**
     * Get the authenticated user's wallet with transactions
     */
    public function show(Request $request)
    {
        $wallet = $this->getOrCreateWallet($request->user());

        // Load recent transactions
        $wallet->load([
            'transactions' => function ($query) {
                $query->orderBy('created_at', 'desc')->limit(20);
            }
        ]);

        // Calculate stats from transactions
        $stats = $this->calculateStats($wallet);

        return response()->json([
            'id' => $wallet->id,
            'balance' => round((float) $wallet->balance, 2),
            'currency' => 'USD', // Default currency
            'transactions' => $wallet->transactions,
            'stats' => $stats,
        ]);
    }

    /**
     * Deposit funds to wallet
     */
    public function deposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1|max:10000',
        ]);

        $wallet = $this->getOrCreateWallet($request->user());
        $amount = round((float) $request->amount, 2);

        DB::transaction(function () use ($wallet, $amount) {
            $wallet->increment('balance', $amount);

            $wallet->transactions()->create([
                'amount' => $amount,
                'type' => 'credit',
                'description' => 'Wallet Deposit',
                'reference' => 'DEP_' . strtoupper(uniqid()),
            ]);
        });

        $wallet->refresh();
        $wallet->load(['transactions' => fn($q) => $q->orderBy('created_at', 'desc')->limit(20)]);

        return response()->json([
            'id' => $wallet->id,
            'balance' => round((float) $wallet->balance, 2),
            'currency' => 'USD', // Default currency
            'transactions' => $wallet->transactions,
            'stats' => $this->calculateStats($wallet),
        ]);
    }

    /**
     * Get wallet statistics
     */
    public function stats(Request $request)
    {
        $wallet = $this->getOrCreateWallet($request->user());
        return response()->json($this->calculateStats($wallet));
    }

    /**
     * Get or create wallet for user
     */
    private function getOrCreateWallet($user): Wallet
    {
        return $user->wallet()->firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );
    }

    /**
     * Calculate wallet statistics from transactions
     */
    private function calculateStats(Wallet $wallet): array
    {
        $transactions = Transaction::where('wallet_id', $wallet->id)->get();

        $totalDeposited = $transactions
            ->where('type', 'credit')
            ->sum('amount');

        $totalSpent = $transactions
            ->where('type', 'debit')
            ->sum('amount');

        return [
            'total_deposited' => round((float) $totalDeposited, 2),
            'total_spent' => round((float) $totalSpent, 2),
            'transaction_count' => $transactions->count(),
        ];
    }
}

