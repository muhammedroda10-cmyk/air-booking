'use client';

import { UserLayout } from "@/components/layouts/user-layout";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plane, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
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
import { LoadingSpinner } from "@/components/ui/loading";

interface Booking {
    id: number;
    pnr: string;
    status: string;
    created_at: string;
    total_price: number;
    flight?: {
        flight_number: string;
        departure_time: string;
        arrival_time: string;
        airline: { name: string };
        origin_airport: { code: string; city: string };
        destination_airport: { code: string; city: string };
    };
    flight_details?: {
        airline?: string;
        flight_number?: string;
        origin?: string;
        destination?: string;
        origin_city?: string;
        destination_city?: string;
        departure_datetime?: string;
        departure_time?: string;
        duration?: string;
    };
}

export default function TripsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState<number | null>(null);
    const { toast } = useToast();

    const fetchBookings = async () => {
        try {
            const response = await api.get('/bookings');
            // Include both local flights (with future departure) and external bookings
            const upcoming = response.data.filter((b: Booking) => {
                if (b.status === 'cancelled') return false;
                // For local flights, check departure time
                if (b.flight?.departure_time) {
                    return new Date(b.flight.departure_time) > new Date();
                }
                // For external bookings, check flight_details datetime
                if (b.flight_details?.departure_datetime) {
                    return new Date(b.flight_details.departure_datetime) > new Date();
                }
                // Include external bookings without date info (can't determine if past)
                return b.flight_details !== undefined;
            });
            setBookings(upcoming);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancelBooking = async (bookingId: number) => {
        setCancelling(bookingId);
        try {
            await api.post(`/bookings/${bookingId}/cancel`);
            toast({
                title: "Booking Cancelled",
                description: "Your booking has been cancelled. Refund will be credited to your wallet.",
            });
            fetchBookings();
        } catch (error: any) {
            toast({
                title: "Cancellation Failed",
                description: error.response?.data?.message || "Failed to cancel booking",
                variant: "destructive"
            });
        } finally {
            setCancelling(null);
        }
    };

    if (loading) {
        return (
            <UserLayout>
                <div className="flex items-center justify-center min-h-[40vh]">
                    <LoadingSpinner size="lg" />
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">My Trips</h2>
                    <p className="text-muted-foreground">Manage your upcoming travel.</p>
                </div>

                {bookings.length > 0 ? (
                    <div className="grid gap-4">
                        {bookings.map((booking) => (
                            <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${booking.status === 'confirmed'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                                <span className="text-sm text-muted-foreground">PNR: {booking.pnr}</span>
                                            </div>

                                            <div className="flex items-center gap-6 mb-3">
                                                <div>
                                                    <p className="text-xl font-bold">
                                                        {booking.flight?.origin_airport?.code || booking.flight_details?.origin || '—'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {booking.flight?.origin_airport?.city || booking.flight_details?.origin_city || ''}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-px bg-slate-300 dark:bg-slate-700" />
                                                    <Plane className="w-4 h-4 text-muted-foreground rotate-90" />
                                                    <div className="w-8 h-px bg-slate-300 dark:bg-slate-700" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-bold">
                                                        {booking.flight?.destination_airport?.code || booking.flight_details?.destination || '—'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {booking.flight?.destination_airport?.city || booking.flight_details?.destination_city || ''}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>
                                                        {(() => {
                                                            const dt = booking.flight?.departure_time || booking.flight_details?.departure_datetime;
                                                            if (!dt) return 'TBD';
                                                            try {
                                                                const d = new Date(dt);
                                                                if (isNaN(d.getTime())) return 'TBD';
                                                                return d.toLocaleDateString();
                                                            } catch { return 'TBD'; }
                                                        })()}
                                                    </span>
                                                </div>
                                                <span>•</span>
                                                <span>
                                                    {booking.flight?.airline?.name || booking.flight_details?.airline || 'Flight'} {booking.flight?.flight_number || booking.flight_details?.flight_number || booking.pnr}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2">
                                            <p className="text-lg font-bold">${booking.total_price}</p>
                                            <div className="flex gap-2">
                                                <Link href={`/account/tickets/${booking.id}`}>
                                                    <Button variant="outline" size="sm">Ticket</Button>
                                                </Link>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm" disabled={cancelling === booking.id}>
                                                            {cancelling === booking.id ? '...' : 'Cancel'}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="flex items-center gap-2">
                                                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                                                Cancel Booking?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to cancel your booking to{' '}
                                                                <strong>{booking.flight?.destination_airport?.city || booking.flight_details?.destination_city || 'your destination'}</strong>?
                                                                <br /><br />
                                                                Amount of <strong>${booking.total_price}</strong> will be refunded to your wallet.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleCancelBooking(booking.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Yes, Cancel
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="p-10 text-center">
                            <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No upcoming trips</h3>
                            <p className="text-muted-foreground mb-4">You don't have any upcoming flights scheduled.</p>
                            <Link href="/flights">
                                <Button>Book a Flight</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </UserLayout>
    );
}
