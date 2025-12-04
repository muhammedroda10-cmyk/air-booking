'use client';

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plane, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Booking {
    id: number;
    pnr: string;
    status: string;
    created_at: string;
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

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await api.get('/bookings');
                // Filter for upcoming trips (simplified logic)
                const upcoming = response.data.filter((b: Booking) =>
                    b.flight && new Date(b.flight.departure_time) > new Date()
                );
                setBookings(upcoming);
            } catch (error) {
                console.error("Failed to fetch bookings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

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
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">
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
                                        <Button>Check In</Button>
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
