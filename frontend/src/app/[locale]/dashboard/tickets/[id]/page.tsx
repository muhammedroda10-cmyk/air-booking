'use client';

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plane, Calendar, MapPin, Printer, Download, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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
        origin_airport: { code: string; city: string; name: string };
        destination_airport: { code: string; city: string; name: string };
        aircraft_type: string;
    };
    passengers: {
        name: string;
        seat_number: string;
        passport_number: string;
    }[];
}

export default function TicketPage() {
    const params = useParams();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const response = await api.get(`/bookings/${params.id}`);
                setBooking(response.data);
            } catch (error) {
                console.error("Failed to fetch booking", error);
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

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-3xl mx-auto space-y-6">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-[600px] w-full rounded-xl" />
                </div>
            </DashboardLayout>
        );
    }

    if (!booking) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold">Booking not found</h2>
                    <p className="text-muted-foreground">The requested ticket could not be loaded.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto print:max-w-none print:mx-0">
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">E-Ticket</h1>
                        <p className="text-muted-foreground">Booking Reference: <span className="font-mono font-bold text-primary">{booking.pnr}</span></p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                        <Button>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </div>

                <Card className="overflow-hidden print:shadow-none print:border-none">
                    <div className="bg-slate-900 text-white p-6 flex justify-between items-center print:bg-slate-900 print:text-white print-color-adjust-exact">
                        <div>
                            <h2 className="text-2xl font-bold">Boarding Pass</h2>
                            <p className="text-slate-400">SkyWings Airlines</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400">Class</p>
                            <p className="font-bold">Economy</p>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        {/* Flight Info */}
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                                <div className="text-center md:text-left">
                                    <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{booking.flight.origin_airport.code}</p>
                                    <p className="text-sm text-muted-foreground">{booking.flight.origin_airport.city}</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(booking.flight.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>

                                <div className="flex-1 flex flex-col items-center w-full px-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <Plane className="w-4 h-4" />
                                        <span>{booking.flight.airline.name} {booking.flight.flight_number}</span>
                                    </div>
                                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700 relative flex items-center justify-center">
                                        <div className="absolute w-2 h-2 bg-slate-300 rounded-full left-0" />
                                        <div className="absolute w-2 h-2 bg-slate-300 rounded-full right-0" />
                                        <Plane className="w-5 h-5 text-slate-300 rotate-90 absolute" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">Duration: 2h 30m</p>
                                </div>

                                <div className="text-center md:text-right">
                                    <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{booking.flight.destination_airport.code}</p>
                                    <p className="text-sm text-muted-foreground">{booking.flight.destination_airport.city}</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(booking.flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                                    <p className="font-semibold">{new Date(booking.flight.departure_time).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Flight</p>
                                    <p className="font-semibold">{booking.flight.flight_number}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gate</p>
                                    <p className="font-semibold">TBD</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Boarding</p>
                                    <p className="font-semibold">{new Date(new Date(booking.flight.departure_time).getTime() - 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Passenger Info */}
                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Passengers
                            </h3>
                            <div className="space-y-4">
                                {booking.passengers.map((passenger, index) => (
                                    <div key={index} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="font-bold">{passenger.name}</p>
                                            <p className="text-xs text-muted-foreground">Passport: {passenger.passport_number || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Seat</p>
                                            <Badge variant="secondary" className="text-lg px-3 py-1">{passenger.seat_number}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-slate-900 text-white text-center text-xs text-slate-400 print:bg-slate-900 print:text-white print-color-adjust-exact">
                            <p>Please arrive at the airport at least 2 hours before departure.</p>
                            <p className="mt-1">This is an electronic ticket. You can show this on your mobile device.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
