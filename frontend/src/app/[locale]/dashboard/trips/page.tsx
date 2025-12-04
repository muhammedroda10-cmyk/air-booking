'use client';

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plane, Calendar, MapPin, X, AlertTriangle } from "lucide-react";
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

interface Booking {
    id: number;
    pnr: string;
    status: string;
    created_at: string;
    total_price: number;
    flight: {
        flight_number: string;
        departure_time: string;
        arrival_time: string;
        airline: { name: string };
        origin_airport: { code: string; city: string };
        destination_airport: { code: string; city: string };
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
            // Filter for upcoming trips
            const upcoming = response.data.filter((b: Booking) =>
                b.flight && new Date(b.flight.departure_time) > new Date() && b.status !== 'cancelled'
            );
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
            fetchBookings(); // Refresh the list
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

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">My Trips</h1>
                <p className="text-muted-foreground">Manage your upcoming travel.</p>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : bookings.length > 0 ? (
                <div className="grid gap-6">
                    {bookings.map((booking) => (
                        <Card key={booking.id}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                booking.status === 'confirmed' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {booking.status}
                                            </span>
                                            <span className="text-sm text-muted-foreground">PNR: {booking.pnr}</span>
                                        </div>

                                        <div className="flex items-center gap-8 mb-4">
                                            <div>
                                                <p className="text-2xl font-bold">{booking.flight.origin_airport.code}</p>
                                                <p className="text-sm text-muted-foreground">{booking.flight.origin_airport.city}</p>
                                            </div>
                                            <Plane className="w-6 h-6 text-muted-foreground rotate-90" />
                                            <div>
                                                <p className="text-2xl font-bold">{booking.flight.destination_airport.code}</p>
                                                <p className="text-sm text-muted-foreground">{booking.flight.destination_airport.city}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-6 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                <span>{new Date(booking.flight.departure_time).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Plane className="w-4 h-4 text-muted-foreground" />
                                                <span>{booking.flight.airline.name} • {booking.flight.flight_number}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center gap-2">
                                        <Link href={`/dashboard/tickets/${booking.id}`}>
                                            <Button variant="outline" className="w-full">View Ticket</Button>
                                        </Link>
                                        <Button className="w-full">Check In</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="w-full" disabled={cancelling === booking.id}>
                                                    {cancelling === booking.id ? 'Cancelling...' : 'Cancel Booking'}
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
                                                        <strong>{booking.flight.destination_airport.city}</strong> (PNR: {booking.pnr})?
                                                        <br /><br />
                                                        If you have already paid, the amount of <strong>${booking.total_price}</strong> will be refunded to your wallet.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Yes, Cancel It
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No upcoming trips</h3>
                        <p className="text-muted-foreground mb-6">You don't have any upcoming flights scheduled.</p>
                        <Link href="/flights">
                            <Button>Book a Flight</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
}
