<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    /**
     * Get all transactions (admin view)
     */
    public function index(Request $request)
    {
        $query = Transaction::with(['wallet.user']);

        // Search by description or reference
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhereHas('wallet.user', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $transactions = $query->latest()->paginate(20);

        // Calculate statistics
        $stats = [
            'total_credits' => Transaction::where('type', 'credit')->sum('amount'),
            'total_debits' => Transaction::where('type', 'debit')->sum('amount'),
            'total_transactions' => Transaction::count(),
            'today_transactions' => Transaction::whereDate('created_at', today())->count(),
        ];

        return response()->json([
            'transactions' => $transactions->items(),
            'total' => $transactions->total(),
            'current_page' => $transactions->currentPage(),
            'last_page' => $transactions->lastPage(),
            'stats' => $stats,
        ]);
    }

    /**
     * Get single transaction details
     */
    public function show(Transaction $transaction)
    {
        $transaction->load(['wallet.user']);
        return response()->json(['transaction' => $transaction]);
    }

    /**
     * Get transactions for a specific wallet
     */
    public function walletTransactions(Wallet $wallet, Request $request)
    {
        $query = $wallet->transactions();

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        $transactions = $query->latest()->paginate(20);

        return response()->json([
            'transactions' => $transactions->items(),
            'total' => $transactions->total(),
            'wallet' => $wallet->load('user'),
        ]);
    }

    /**
     * Add manual transaction (admin only)
     */
    public function store(Request $request)
    {
        $request->validate([
            'wallet_id' => 'required|exists:wallets,id',
            'type' => 'required|in:credit,debit',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:500',
        ]);

        $wallet = Wallet::findOrFail($request->wallet_id);

        // For debit, check if wallet has sufficient balance
        if ($request->type === 'debit' && $wallet->balance < $request->amount) {
            return response()->json([
                'message' => 'Insufficient wallet balance',
                'current_balance' => $wallet->balance,
            ], 422);
        }

        // Update wallet balance
        if ($request->type === 'credit') {
            $wallet->increment('balance', $request->amount);
        } else {
            $wallet->decrement('balance', $request->amount);
        }

        // Create transaction record
        $transaction = Transaction::create([
            'wallet_id' => $wallet->id,
            'type' => $request->type,
            'amount' => $request->amount,
            'description' => $request->description,
            'reference' => 'manual_' . time(),
        ]);

        return response()->json([
            'message' => 'Transaction created successfully',
            'transaction' => $transaction->load('wallet.user'),
            'new_balance' => $wallet->fresh()->balance,
        ], 201);
    }
}
