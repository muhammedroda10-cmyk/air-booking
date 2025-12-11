'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    Search,
    Loader2,
    RefreshCw,
    AlertCircle,
    Plus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    User,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface TransactionItem {
    id: number;
    wallet_id: number;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    reference: string;
    created_at: string;
    wallet?: {
        id: number;
        balance: number;
        user?: {
            id: number;
            name: string;
            email: string;
        };
    };
}

interface Stats {
    total_credits: number;
    total_debits: number;
    total_transactions: number;
    today_transactions: number;
}

interface WalletOption {
    id: number;
    balance: number;
    user: { name: string; email: string };
}

export default function TransactionsPage() {
    const { toast } = useToast();
    const { hasPermission } = useAuth();
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    // Add transaction dialog
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [wallets, setWallets] = useState<WalletOption[]>([]);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        wallet_id: '',
        type: 'credit',
        amount: '',
        description: '',
    });

    useEffect(() => {
        fetchTransactions();
    }, [typeFilter]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (typeFilter !== 'all') {
                params.append('type', typeFilter);
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }
            const { data } = await api.get(`/admin/transactions?${params.toString()}`);
            setTransactions(data.transactions || []);
            setStats(data.stats || null);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to load transactions';
            setError(message);
            toast({ title: 'Error', description: message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const fetchWallets = async () => {
        try {
            const { data } = await api.get('/admin/users');
            // Create wallet options from users (assuming each user has a wallet)
            const users = data.users?.data || data.users || data || [];
            setWallets(users.map((u: any) => ({
                id: u.wallet?.id || u.id,
                balance: u.wallet?.balance || 0,
                user: { name: u.name, email: u.email }
            })).filter((w: WalletOption) => w.id));
        } catch { /* ignore */ }
    };

    const openAddDialog = () => {
        setFormData({ wallet_id: '', type: 'credit', amount: '', description: '' });
        fetchWallets();
        setIsAddDialogOpen(true);
    };

    const handleAddTransaction = async () => {
        if (!formData.wallet_id || !formData.amount || !formData.description) {
            toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' });
            return;
        }

        try {
            setSaving(true);
            await api.post('/admin/transactions', {
                wallet_id: Number(formData.wallet_id),
                type: formData.type,
                amount: Number(formData.amount),
                description: formData.description,
            });

            toast({ title: 'Success', description: 'Transaction created successfully' });
            setIsAddDialogOpen(false);
            fetchTransactions();
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'Failed to create transaction',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTransactions();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTypeBadge = (type: string) => {
        if (type === 'credit') {
            return (
                <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                    <ArrowUpCircle className="w-3 h-3" />
                    Credit
                </Badge>
            );
        }
        return (
            <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                <ArrowDownCircle className="w-3 h-3" />
                Debit
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading transactions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-lg font-semibold">Failed to load transactions</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={fetchTransactions} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Transactions</h1>
                    <p className="text-muted-foreground">View and manage all wallet transactions</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchTransactions} title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    {hasPermission('transactions.create') && (
                        <Button onClick={openAddDialog}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Transaction
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Credits</p>
                                    <p className="text-xl font-bold text-green-600">
                                        ${Number(stats.total_credits || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <TrendingDown className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Debits</p>
                                    <p className="text-xl font-bold text-red-600">
                                        ${Number(stats.total_debits || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                                    <p className="text-xl font-bold">{stats.total_transactions}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Today</p>
                                    <p className="text-xl font-bold">{stats.today_transactions}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by description, user..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="debit">Debit</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Transactions ({transactions.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No transactions found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-mono text-sm">#{tx.id}</TableCell>
                                            <TableCell>{getTypeBadge(tx.type)}</TableCell>
                                            <TableCell>
                                                <span className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.type === 'credit' ? '+' : '-'}${Number(tx.amount || 0).toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {tx.wallet?.user ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="font-medium">{tx.wallet.user.name}</div>
                                                            <div className="text-xs text-muted-foreground">{tx.wallet.user.email}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-[250px] truncate" title={tx.description}>
                                                {tx.description || '—'}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {tx.reference || '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                {formatDate(tx.created_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Transaction Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add Manual Transaction
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>User/Wallet *</Label>
                            <Select
                                value={formData.wallet_id}
                                onValueChange={(v) => setFormData({ ...formData, wallet_id: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a user wallet" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets.map((w) => (
                                        <SelectItem key={w.id} value={String(w.id)}>
                                            {w.user.name} ({w.user.email}) - ${Number(w.balance || 0).toFixed(2)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="credit">Credit (+)</SelectItem>
                                        <SelectItem value="debit">Debit (-)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Amount ($) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description *</Label>
                            <Textarea
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Reason for this transaction..."
                            />
                        </div>

                        <div className={`p-3 rounded-lg text-sm ${formData.type === 'credit' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                            {formData.type === 'credit' ? (
                                <span className="text-green-700">
                                    <ArrowUpCircle className="w-4 h-4 inline mr-2" />
                                    This will ADD ${formData.amount || '0.00'} to the user's wallet.
                                </span>
                            ) : (
                                <span className="text-red-700">
                                    <ArrowDownCircle className="w-4 h-4 inline mr-2" />
                                    This will DEDUCT ${formData.amount || '0.00'} from the user's wallet.
                                </span>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddTransaction} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Transaction
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
