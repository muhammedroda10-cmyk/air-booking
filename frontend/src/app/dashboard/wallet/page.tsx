'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Transaction {
    id: number;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    created_at: string;
}

interface WalletData {
    balance: number;
    transactions: Transaction[];
}

export default function WalletPage() {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (user) {
            fetchWallet();
        }
    }, [user]);

    const fetchWallet = async () => {
        try {
            const response = await api.get('/wallet');
            setWallet(response.data);
        } catch (error) {
            console.error('Failed to fetch wallet', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await api.post('/wallet/deposit', {
                amount: parseFloat(amount)
            });
            setAmount('');
            fetchWallet();
            // Ideally show a toast here
        } catch (error) {
            console.error('Deposit failed', error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
                    <p className="text-muted-foreground">Manage your funds and view transaction history.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Balance Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-0 shadow-xl overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <CardContent className="relative z-10 p-8 text-white">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <p className="text-blue-100 font-medium mb-1">Total Balance</p>
                                        <h2 className="text-5xl font-bold tracking-tight">
                                            ${wallet?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                                        </h2>
                                    </div>
                                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                                        <Wallet className="w-8 h-8 text-white" />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                                        <div className="flex items-center gap-2 mb-1 text-blue-100">
                                            <ArrowDownLeft className="w-4 h-4" />
                                            <span className="text-sm">Total Deposited</span>
                                        </div>
                                        <p className="text-xl font-bold">$2,450.00</p>
                                    </div>
                                    <div className="flex-1 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                                        <div className="flex items-center gap-2 mb-1 text-blue-100">
                                            <ArrowUpRight className="w-4 h-4" />
                                            <span className="text-sm">Total Spent</span>
                                        </div>
                                        <p className="text-xl font-bold">$1,230.50</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    Add Funds
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleDeposit} className="flex gap-4 items-end">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                            <Input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="pl-7"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={processing || !amount}>
                                        {processing ? 'Processing...' : 'Deposit Funds'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transactions History */}
                    <div className="lg:col-span-1">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="w-5 h-5 text-primary" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {loading ? (
                                        <div className="p-8 text-center text-muted-foreground">Loading...</div>
                                    ) : wallet?.transactions?.length && wallet.transactions.length > 0 ? (
                                        wallet.transactions.map((tx) => (
                                            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'credit'
                                                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20'
                                                            : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                                                        }`}>
                                                        {tx.type === 'credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium line-clamp-1">{tx.description}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-900 dark:text-slate-100'
                                                    }`}>
                                                    {tx.type === 'credit' ? '+' : '-'}${tx.amount}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No transactions yet.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
