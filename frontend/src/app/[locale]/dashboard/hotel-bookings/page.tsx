'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, MapPin, Users, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HotelBooking {
    id: number;
    check_in_date: string;
    check_out_date: string;
    guests: number;
    total_price: number;
    status: string;
    created_at: string;
    hotel: {
        id: number;
        name: string;
        address: string;
        city: string;
        image_url: string;
    };
    room: {
        id: number;
        type: string;
        price_per_night: number;
    };
}

export default function HotelBookingsPage() {
    const [bookings, setBookings] = useState<HotelBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchBookings = async () => {
        try {
            const response = await api.get('/hotel-bookings');
            setBookings(response.data);
        } catch (error) {
            console.error('Failed to fetch hotel bookings', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            confirmed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            cancelled: 'bg-red-100 text-red-700',
            completed: 'bg-blue-100 text-blue-700',
        };
        return styles[status] || 'bg-slate-100 text-slate-700';
    };

    const calculateNights = (checkIn: string, checkOut: string) => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Hotel Bookings</h1>
                <p className="text-muted-foreground">Manage your hotel reservations.</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : bookings.length > 0 ? (
                <div className="grid gap-6">
                    {bookings.map((booking) => (
                        <Card key={booking.id} className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    {/* Hotel Image */}
                                    <div className="w-full md:w-48 h-48 md:h-auto bg-slate-200 relative">
                                        {booking.hotel.image_url ? (
                                            <img
                                                src={booking.hotel.image_url}
                                                alt={booking.hotel.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Building2 className="w-12 h-12 text-slate-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Booking Details */}
                                    <div className="flex-1 p-6">
                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className={getStatusBadge(booking.status)}>
                                                        {booking.status.toUpperCase()}
                                                    </Badge>
                                                </div>

                                                <h3 className="text-xl font-bold mb-1">{booking.hotel.name}</h3>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                                                    <MapPin className="w-4 h-4" />
                                                    {booking.hotel.address}, {booking.hotel.city}
                                                </p>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground">Check-in</p>
                                                        <p className="font-medium flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(booking.check_in_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Check-out</p>
                                                        <p className="font-medium flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(booking.check_out_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Nights</p>
                                                        <p className="font-medium">
                                                            {calculateNights(booking.check_in_date, booking.check_out_date)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Guests</p>
                                                        <p className="font-medium flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            {booking.guests}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end justify-between gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm text-muted-foreground">Total</p>
                                                    <p className="text-2xl font-bold text-primary">
                                                        ${booking.total_price.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {booking.room?.type || 'Standard Room'}
                                                    </p>
                                                </div>

                                                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                    <Button variant="outline" size="sm">
                                                        View Details
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No hotel bookings</h3>
                        <p className="text-muted-foreground mb-6">You haven't booked any hotels yet.</p>
                        <Link href="/hotels">
                            <Button>Browse Hotels</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
}
