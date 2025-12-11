'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Ticket,
    Search,
    Loader2,
    Plane,
    Calendar,
    Eye,
    RefreshCw,
    AlertCircle,
    DollarSign,
    X,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Booking {
    id: number;
    pnr: string;
    status: string;
    payment_status: string;
    total_price: number;
    refund_amount?: number;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    flight?: {
        flight_number: string;
        airline?: { name: string };
    };
}

export default function BookingsPage() {
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }
            const { data } = await api.get(`/admin/bookings?${params.toString()}`);
            const bookingList = data.bookings || data.data || data || [];
            setBookings(Array.isArray(bookingList) ? bookingList : []);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to load bookings';
            setError(message);
            toast({ title: 'Error', description: message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelTarget) return;
        try {
            setCancelling(true);
            await api.post(`/admin/bookings/${cancelTarget.id}/cancel`, { reason: 'Cancelled by admin' });
            toast({ title: 'Success', description: 'Booking cancelled successfully' });
            setCancelTarget(null);
            fetchBookings();
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'Failed to cancel booking',
                variant: 'destructive',
            });
        } finally {
            setCancelling(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            confirmed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            cancelled: 'bg-red-100 text-red-700',
            failed: 'bg-red-100 text-red-700',
            completed: 'bg-blue-100 text-blue-700',
        };
        return <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>{status || 'Unknown'}</Badge>;
    };

    const getPaymentBadge = (status: string) => {
        const styles: Record<string, string> = {
            paid: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            refunded: 'bg-purple-100 text-purple-700',
            partial_refund: 'bg-orange-100 text-orange-700',
        };
        return <Badge variant="outline" className={styles[status] || 'bg-gray-100'}>{status || 'Unknown'}</Badge>;
    };

    const filteredBookings = bookings.filter(booking => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            booking.pnr?.toLowerCase().includes(query) ||
            booking.user?.name?.toLowerCase().includes(query) ||
            booking.user?.email?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading bookings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-lg font-semibold">Failed to load bookings</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={fetchBookings} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Bookings</h1>
                    <p className="text-muted-foreground">View and manage all bookings ({bookings.length} total)</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchBookings} title="Refresh">
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

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
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-3">
                {filteredBookings.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
                            <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredBookings.map((booking) => (
                        <Card key={booking.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Plane className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold">#{booking.pnr}</span>
                                                {getStatusBadge(booking.status)}
                                                {getPaymentBadge(booking.payment_status)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {booking.user?.name || 'Unknown'} • {booking.user?.email || 'No email'}
                                            </div>
                                            {booking.flight && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Flight: {booking.flight.flight_number} ({booking.flight.airline?.name || 'Unknown'})
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="font-semibold flex items-center gap-1">
                                                <DollarSign className="w-4 h-4" />
                                                {Number(booking.total_price || 0).toFixed(2)}
                                            </div>
                                            {booking.refund_amount && Number(booking.refund_amount) > 0 && (
                                                <div className="text-xs text-green-600">-${Number(booking.refund_amount).toFixed(2)} refunded</div>
                                            )}
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(booking.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Link href={`/dashboard/bookings/${booking.id}`}>
                                                <Button variant="outline" size="sm" title="View Details">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            {booking.status !== 'cancelled' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => setCancelTarget(booking)}
                                                    title="Cancel Booking"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel booking <strong>#{cancelTarget?.pnr}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling}>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-red-500 hover:bg-red-600">
                            {cancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Cancel Booking
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
