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
} from 'lucide-react';

interface Booking {
    id: number;
    pnr: string;
    status: string;
    payment_status: string;
    total_price: number;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export default function BookingsPage() {
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
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

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            confirmed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            cancelled: 'bg-red-100 text-red-700',
            failed: 'bg-red-100 text-red-700',
        };
        return <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>{status}</Badge>;
    };

    const getPaymentBadge = (status: string) => {
        const styles: Record<string, string> = {
            paid: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            refunded: 'bg-purple-100 text-purple-700',
            partial_refund: 'bg-orange-100 text-orange-700',
        };
        return <Badge variant="outline" className={styles[status]}>{status}</Badge>;
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
                <h1 className="text-2xl font-bold">Bookings</h1>
                <p className="text-muted-foreground">View and manage all bookings</p>
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
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Bookings List */}
            <div className="space-y-3">
                {filteredBookings.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
                        </CardContent>
                    </Card>
                ) : (
                    filteredBookings.map((booking) => (
                        <Card key={booking.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Plane className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">#{booking.pnr}</span>
                                                {getStatusBadge(booking.status)}
                                                {getPaymentBadge(booking.payment_status)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {booking.user.name} • {booking.user.email}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="font-semibold">${booking.total_price.toFixed(2)}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(booking.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Link href={`/admin/bookings/${booking.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
