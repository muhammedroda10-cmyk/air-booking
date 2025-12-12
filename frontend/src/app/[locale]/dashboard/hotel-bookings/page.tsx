'use client';

import { useState, useEffect } from 'react';
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
    Building2,
    Search,
    Loader2,
    Calendar,
    Eye,
    RefreshCw,
    AlertCircle,
    DollarSign,
    MapPin,
} from 'lucide-react';

interface HotelBooking {
    id: number;
    uuid: string;
    status: string;
    total_price: number;
    check_in: string;
    check_out: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    hotel: {
        id: number;
        name: string;
        city: string;
    };
    room?: {
        type: string;
    };
}

export default function HotelBookingsPage() {
    const { toast } = useToast();
    const [bookings, setBookings] = useState<HotelBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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
            const { data } = await api.get(`/admin/hotel-bookings?${params.toString()}`);
            const bookingList = data.bookings || data.data || data || [];
            setBookings(Array.isArray(bookingList) ? bookingList : []);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to load hotel bookings';
            setError(message);
            toast({ title: 'Error', description: message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            confirmed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            cancelled: 'bg-red-100 text-red-700',
            completed: 'bg-blue-100 text-blue-700',
        };
        return <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>{status || 'Unknown'}</Badge>;
    };

    const calculateNights = (checkIn: string, checkOut: string) => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    const filteredBookings = bookings.filter(booking => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            booking.uuid?.toLowerCase().includes(query) ||
            booking.hotel?.name?.toLowerCase().includes(query) ||
            booking.user?.name?.toLowerCase().includes(query) ||
            booking.user?.email?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading hotel bookings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-lg font-semibold">Failed to load hotel bookings</h2>
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
                    <h1 className="text-2xl font-bold">Hotel Bookings</h1>
                    <p className="text-muted-foreground">Manage all hotel reservations ({bookings.length} total)</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchBookings} title="Refresh">
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID, hotel, or guest..."
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
                            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Hotel Bookings Found</h3>
                            <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredBookings.map((booking) => (
                        <Card key={booking.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                    {booking.uuid}
                                                </span>
                                                {getStatusBadge(booking.status)}
                                            </div>
                                            <div className="text-sm font-medium mt-1">
                                                {booking.hotel?.name || 'Unknown Hotel'}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {booking.hotel?.city || 'Unknown'} • {booking.user?.name || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                                                <span className="text-primary font-medium">
                                                    ({calculateNights(booking.check_in, booking.check_out)} nights)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="font-semibold flex items-center gap-1">
                                                <DollarSign className="w-4 h-4" />
                                                {Number(booking.total_price || 0).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {booking.room?.type || 'Standard Room'}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon">
                                            <Eye className="w-4 h-4" />
                                        </Button>
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
