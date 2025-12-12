'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { UserLayout } from '@/components/layouts/user-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, MapPin, Users, Star, Phone, Mail, Clock, Printer, Download, Headphones } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface HotelBooking {
    id: number;
    uuid: string;
    check_in: string;
    check_out: string;
    guests?: number;
    total_price: number;
    status: string;
    created_at: string;
    confirmation_number?: string;
    special_requests?: string;
    hotel: {
        id: number;
        name: string;
        address: string;
        city: string;
        country?: string;
        image_url: string;
        rating?: number;
        phone?: string;
        email?: string;
    };
    room: {
        id: number;
        type: string;
        price_per_night: number;
        description?: string;
    };
}

export default function HotelBookingPage() {
    const params = useParams();
    const router = useRouter();
    const [booking, setBooking] = useState<HotelBooking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const response = await api.get(`/hotel-bookings/${params.id}`);
                setBooking(response.data);
            } catch (error) {
                console.error('Failed to fetch hotel booking', error);
            } finally {
                setLoading(false);
            }
        };
        if (params.id) {
            fetchBooking();
        }
    }, [params.id]);

    const handlePrint = () => {
        window.print();
    };

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <UserLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-[500px] w-full rounded-2xl" />
                </div>
            </UserLayout>
        );
    }

    if (!booking) {
        return (
            <UserLayout>
                <div className="text-center py-12">
                    <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold">Booking not found</h2>
                    <p className="text-muted-foreground">The requested hotel booking could not be loaded.</p>
                </div>
            </UserLayout>
        );
    }

    const nights = calculateNights(booking.check_in, booking.check_out);

    return (
        <UserLayout>
            <div className="max-w-4xl mx-auto print:max-w-none print:mx-0">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-8 print:hidden">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-3xl font-bold tracking-tight">Hotel Reservation</h1>
                        <p className="text-muted-foreground mt-1">
                            Booking ID: <span className="font-mono text-sm">{booking.uuid}</span>
                        </p>
                        <p className="text-muted-foreground">
                            Confirmation: <span className="font-mono font-bold text-primary">{booking.confirmation_number || `HTL-${booking.id}`}</span>
                        </p>
                    </motion.div>
                    <motion.div
                        className="flex gap-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Button variant="outline" onClick={handlePrint} className="gap-2">
                            <Printer className="w-4 h-4" />
                            Print
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/account/support/new?hotel_booking=${booking.id}&category=booking_issue`)}
                            className="gap-2"
                        >
                            <Headphones className="w-4 h-4" />
                            Get Support
                        </Button>
                    </motion.div>
                </div>

                {/* Booking Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="overflow-hidden rounded-2xl shadow-xl">
                        {/* Hotel Header with Image */}
                        <div className="relative h-64">
                            {booking.hotel.image_url ? (
                                <img
                                    src={booking.hotel.image_url}
                                    alt={booking.hotel.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                    <Building2 className="w-24 h-24 text-slate-400" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <Badge className={getStatusBadge(booking.status)}>
                                            {booking.status.toUpperCase()}
                                        </Badge>
                                        <h2 className="text-3xl font-bold mt-2">{booking.hotel.name}</h2>
                                        <p className="flex items-center gap-1 text-white/80 mt-1">
                                            <MapPin className="w-4 h-4" />
                                            {booking.hotel.address}, {booking.hotel.city}
                                        </p>
                                    </div>
                                    {booking.hotel.rating && (
                                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="font-medium">{booking.hotel.rating}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-8">
                            {/* Stay Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase tracking-wider">Check-in</span>
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white">{formatDate(booking.check_in)}</p>
                                    <p className="text-sm text-muted-foreground">From 3:00 PM</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase tracking-wider">Check-out</span>
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white">{formatDate(booking.check_out)}</p>
                                    <p className="text-sm text-muted-foreground">Until 11:00 AM</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase tracking-wider">Duration</span>
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white">{nights} {nights === 1 ? 'Night' : 'Nights'}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <Users className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase tracking-wider">Guests</span>
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white">{booking.guests || 2} Guests</p>
                                </div>
                            </div>

                            {/* Room Details */}
                            <div className="border-t pt-6 mb-6">
                                <h3 className="font-bold text-lg mb-4">Room Details</h3>
                                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-lg">{booking.room?.type || 'Standard Room'}</p>
                                        {booking.room?.description && (
                                            <p className="text-sm text-muted-foreground">{booking.room.description}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Price per night</p>
                                        <p className="font-bold text-lg">${booking.room?.price_per_night || (booking.total_price / nights).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Special Requests */}
                            {booking.special_requests && (
                                <div className="border-t pt-6 mb-6">
                                    <h3 className="font-bold text-lg mb-4">Special Requests</h3>
                                    <p className="text-muted-foreground p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        {booking.special_requests}
                                    </p>
                                </div>
                            )}

                            {/* Contact Info */}
                            {(booking.hotel.phone || booking.hotel.email) && (
                                <div className="border-t pt-6 mb-6">
                                    <h3 className="font-bold text-lg mb-4">Hotel Contact</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {booking.hotel.phone && (
                                            <a href={`tel:${booking.hotel.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                                                <Phone className="w-4 h-4" />
                                                {booking.hotel.phone}
                                            </a>
                                        )}
                                        {booking.hotel.email && (
                                            <a href={`mailto:${booking.hotel.email}`} className="flex items-center gap-2 text-primary hover:underline">
                                                <Mail className="w-4 h-4" />
                                                {booking.hotel.email}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Price Summary */}
                            <div className="border-t pt-6">
                                <h3 className="font-bold text-lg mb-4">Price Summary</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            ${booking.room?.price_per_night || (booking.total_price / nights).toFixed(2)} × {nights} nights
                                        </span>
                                        <span>${booking.total_price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                        <span>Total</span>
                                        <span className="text-primary">${booking.total_price.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </UserLayout>
    );
}
