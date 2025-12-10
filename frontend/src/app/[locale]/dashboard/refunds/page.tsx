'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DollarSign,
    Search,
    Loader2,
    AlertCircle,
    CheckCircle,
    Clock,
} from 'lucide-react';

interface Booking {
    id: number;
    pnr: string;
    status: string;
    payment_status: string;
    total_price: number;
    refund_amount: number | null;
    penalty_amount: number | null;
    user: {
        id: number;
        name: string;
        email: string;
    };
    created_at: string;
}

export default function RefundsPage() {
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Refund dialog state
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [penaltyAmount, setPenaltyAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') {
                params.append('payment_status', statusFilter);
            }
            const { data } = await api.get(`/admin/bookings?${params.toString()}`);
            setBookings(data.bookings?.data || data.bookings || []);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load bookings',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const openRefundDialog = (booking: Booking) => {
        setSelectedBooking(booking);
        const maxRefund = booking.total_price - (booking.refund_amount || 0);
        setRefundAmount(maxRefund.toFixed(2));
        setPenaltyAmount('0');
        setRefundReason('');
    };

    const processRefund = async () => {
        if (!selectedBooking) return;

        const amount = parseFloat(refundAmount);
        const penalty = parseFloat(penaltyAmount) || 0;

        if (isNaN(amount) || amount <= 0) {
            toast({
                title: 'Invalid amount',
                description: 'Please enter a valid refund amount',
                variant: 'destructive',
            });
            return;
        }

        if (!refundReason.trim()) {
            toast({
                title: 'Reason required',
                description: 'Please provide a reason for the refund',
                variant: 'destructive',
            });
            return;
        }

        setProcessing(true);
        try {
            await api.post(`/dashboard/bookings/${selectedBooking.id}/refund`, {
                refund_amount: amount,
                penalty_amount: penalty,
                reason: refundReason,
            });

            toast({
                title: 'Refund Processed',
                description: `Successfully refunded $${amount.toFixed(2)}`,
            });

            setSelectedBooking(null);
            fetchBookings();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to process refund',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
            case 'refunded':
                return <Badge className="bg-purple-100 text-purple-700">Refunded</Badge>;
            case 'partial_refund':
                return <Badge className="bg-orange-100 text-orange-700">Partial Refund</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const filteredBookings = bookings.filter(booking => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            booking.pnr.toLowerCase().includes(query) ||
            booking.user.name.toLowerCase().includes(query) ||
            booking.user.email.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Refund Management</h1>
                <p className="text-muted-foreground">Process refunds with optional penalties</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by PNR, name, or email..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial_refund">Partial Refund</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
                            <p className="text-muted-foreground">
                                No bookings match your current filters.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredBookings.map((booking) => {
                        const maxRefundable = booking.total_price - (booking.refund_amount || 0);
                        const canRefund = booking.payment_status === 'paid' ||
                            (booking.payment_status === 'partial_refund' && maxRefundable > 0);

                        return (
                            <Card key={booking.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <DollarSign className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">#{booking.pnr}</span>
                                                    {getStatusBadge(booking.payment_status)}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {booking.user.name} • {booking.user.email}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="font-semibold">${booking.total_price.toFixed(2)}</div>
                                                {booking.refund_amount > 0 && (
                                                    <div className="text-sm text-green-600">
                                                        -${booking.refund_amount.toFixed(2)} refunded
                                                    </div>
                                                )}
                                                {booking.penalty_amount > 0 && (
                                                    <div className="text-sm text-orange-600">
                                                        ${booking.penalty_amount.toFixed(2)} penalty
                                                    </div>
                                                )}
                                            </div>

                                            {canRefund ? (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => openRefundDialog(booking)}
                                                >
                                                    Process Refund
                                                </Button>
                                            ) : (
                                                <Button variant="outline" disabled>
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Fully Refunded
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Refund Dialog */}
            <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Refund</DialogTitle>
                    </DialogHeader>
                    {selectedBooking && (
                        <div className="space-y-4 py-4">
                            <div className="bg-muted p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span>Booking #{selectedBooking.pnr}</span>
                                    <span className="font-bold">${selectedBooking.total_price.toFixed(2)}</span>
                                </div>
                                {selectedBooking.refund_amount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                                        <span>Already Refunded</span>
                                        <span>-${selectedBooking.refund_amount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm font-medium mt-2 pt-2 border-t">
                                    <span>Max Refundable</span>
                                    <span>${(selectedBooking.total_price - (selectedBooking.refund_amount || 0)).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Refund Amount ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Penalty Amount ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={penaltyAmount}
                                        onChange={(e) => setPenaltyAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Reason for Refund</Label>
                                <textarea
                                    className="w-full mt-1 p-3 border rounded-lg text-sm"
                                    rows={3}
                                    placeholder="Enter the reason for this refund..."
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                />
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                                <AlertCircle className="w-4 h-4 inline mr-2 text-yellow-600" />
                                Customer will receive <strong>${parseFloat(refundAmount || '0').toFixed(2)}</strong> to their wallet.
                                {parseFloat(penaltyAmount || '0') > 0 && (
                                    <span> A penalty of <strong>${parseFloat(penaltyAmount).toFixed(2)}</strong> will be recorded.</span>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                                    Cancel
                                </Button>
                                <Button onClick={processRefund} disabled={processing}>
                                    {processing ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <DollarSign className="w-4 h-4 mr-2" />
                                    )}
                                    Process Refund
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
