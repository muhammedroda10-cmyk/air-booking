'use client';

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Plane, Calendar, Clock, User, Download, Printer, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Booking {
    id: number;
    pnr: string;
    status: string;
    payment_status: string;
    created_at: string;
    total_price: number;
    currency: string;
    flight?: {
        flight_number: string;
        departure_time: string;
        arrival_time: string;
        airline: { name: string };
        origin_airport: { code: string; city: string; name: string };
        destination_airport: { code: string; city: string; name: string };
        aircraft_type: string;
    };
    flight_details?: {
        airline: string;
        airline_code: string;
        origin: string;
        origin_city: string;
        destination: string;
        destination_city: string;
        departure_datetime: string;
        arrival_datetime: string;
        departure_time: string;
        arrival_time: string;
        flight_number: string;
        duration: string;
        cabin: string;
    };
    passengers: {
        name: string;
        first_name: string;
        last_name: string;
        seat_number: string;
        passport_number: string;
        ticket_number: string;
    }[];
}

export default function TicketPage() {
    const params = useParams();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const ticketRef = useRef<HTMLDivElement>(null);

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

    const handleDownload = async () => {
        try {
            const response = await api.get(`/bookings/${params.id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ticket-${booking?.pnr || 'booking'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            // Fallback to print if download fails
            console.error('Download failed, using print fallback', error);
            window.print();
        }
    };

    // Helper functions for getting flight data
    const getOriginCode = () => booking?.flight?.origin_airport?.code || booking?.flight_details?.origin || 'DEP';
    const getOriginCity = () => booking?.flight?.origin_airport?.city || booking?.flight_details?.origin_city || '';
    const getDestCode = () => booking?.flight?.destination_airport?.code || booking?.flight_details?.destination || 'ARR';
    const getDestCity = () => booking?.flight?.destination_airport?.city || booking?.flight_details?.destination_city || '';
    const getAirline = () => booking?.flight?.airline?.name || booking?.flight_details?.airline || 'Airline';
    const getFlightNumber = () => booking?.flight?.flight_number || booking?.flight_details?.flight_number || booking?.pnr || '';
    const getDuration = () => booking?.flight_details?.duration || '—';
    const getCabin = () => booking?.flight_details?.cabin || 'Economy';

    const getDepartureDate = () => {
        const dt = booking?.flight?.departure_time || booking?.flight_details?.departure_datetime;
        if (!dt) return 'TBD';
        try {
            return new Date(dt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        } catch { return 'TBD'; }
    };

    const getDepartureTime = () => {
        const dt = booking?.flight?.departure_time || booking?.flight_details?.departure_datetime || booking?.flight_details?.departure_time;
        if (!dt) return 'TBD';
        try {
            // If it's just a time string like "14:30"
            if (dt.length <= 5) return dt;
            return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return 'TBD'; }
    };

    const getArrivalTime = () => {
        const dt = booking?.flight?.arrival_time || booking?.flight_details?.arrival_datetime || booking?.flight_details?.arrival_time;
        if (!dt) return 'TBD';
        try {
            if (dt.length <= 5) return dt;
            return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return 'TBD'; }
    };

    const getBoardingTime = () => {
        const dt = booking?.flight?.departure_time || booking?.flight_details?.departure_datetime;
        if (!dt) return 'TBD';
        try {
            const depTime = new Date(dt);
            return new Date(depTime.getTime() - 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return 'TBD'; }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-[700px] w-full rounded-2xl" />
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
            <div className="max-w-4xl mx-auto print:max-w-none print:mx-0">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-8 print:hidden">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                            E-Ticket
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Booking Reference: <span className="font-mono font-bold text-primary">{booking.pnr}</span>
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
                        <Button onClick={handleDownload} className="gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90">
                            <Download className="w-4 h-4" />
                            Download PDF
                        </Button>
                    </motion.div>
                </div>

                {/* Ticket Card */}
                <motion.div
                    ref={ticketRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="overflow-hidden rounded-[2rem] border-none shadow-2xl print:shadow-none print:rounded-none">
                        {/* Ticket Header */}
                        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-8 print:bg-slate-900 print-color-adjust-exact overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32 print:hidden" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -ml-24 -mb-24 print:hidden" />

                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                            <Plane className="w-6 h-6 text-indigo-300" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">Boarding Pass</h2>
                                            <p className="text-indigo-300 text-sm">{getAirline()}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Booking Reference</p>
                                        <p className="text-3xl font-mono font-bold tracking-widest text-indigo-400">{booking.pnr}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30 mb-4">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span className="text-sm font-medium text-emerald-300">Confirmed</span>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Class</p>
                                        <Badge className="bg-white/10 text-white border-none text-base px-3 py-1">{getCabin()}</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-0">
                            {/* Flight Route */}
                            <div className="p-8 bg-white dark:bg-slate-900">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                    {/* Departure */}
                                    <div className="text-center md:text-left flex-1">
                                        <p className="text-5xl font-bold text-slate-900 dark:text-white mb-2">{getOriginCode()}</p>
                                        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">{getOriginCity()}</p>
                                        <div className="mt-4 space-y-1">
                                            <p className="text-2xl font-bold text-primary">{getDepartureTime()}</p>
                                            <p className="text-sm text-muted-foreground">{getDepartureDate()}</p>
                                        </div>
                                    </div>

                                    {/* Flight Path */}
                                    <div className="flex-1 w-full md:max-w-xs flex flex-col items-center py-4">
                                        <div className="text-center mb-3">
                                            <Badge variant="secondary" className="text-xs">{getFlightNumber()}</Badge>
                                        </div>
                                        <div className="w-full flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20" />
                                            <div className="flex-1 h-0.5 bg-gradient-to-r from-primary via-slate-300 to-indigo-500 dark:via-slate-700 relative">
                                                <Plane className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-white dark:bg-slate-900 rounded-full p-0.5" />
                                            </div>
                                            <div className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-3">Duration: {getDuration()}</p>
                                    </div>

                                    {/* Arrival */}
                                    <div className="text-center md:text-right flex-1">
                                        <p className="text-5xl font-bold text-slate-900 dark:text-white mb-2">{getDestCode()}</p>
                                        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">{getDestCity()}</p>
                                        <div className="mt-4 space-y-1">
                                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{getArrivalTime()}</p>
                                            <p className="text-sm text-muted-foreground">{getDepartureDate()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Flight Info Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-xs font-medium uppercase tracking-wider">Date</span>
                                        </div>
                                        <p className="font-bold text-slate-900 dark:text-white">{getDepartureDate()}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                            <Plane className="w-4 h-4" />
                                            <span className="text-xs font-medium uppercase tracking-wider">Flight</span>
                                        </div>
                                        <p className="font-bold text-slate-900 dark:text-white">{getFlightNumber()}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                            <span className="text-xs font-medium uppercase tracking-wider">🚪 Gate</span>
                                        </div>
                                        <p className="font-bold text-slate-900 dark:text-white">TBD</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30">
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-xs font-medium uppercase tracking-wider">Boarding</span>
                                        </div>
                                        <p className="font-bold text-amber-700 dark:text-amber-300">{getBoardingTime()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tear line effect */}
                            <div className="relative h-8 bg-slate-100 dark:bg-slate-800">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-white dark:bg-slate-950 rounded-r-full" />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-white dark:bg-slate-950 rounded-l-full" />
                                <div className="absolute inset-x-8 top-1/2 border-t-2 border-dashed border-slate-300 dark:border-slate-600" />
                            </div>

                            {/* Passengers Section */}
                            <div className="p-8 bg-white dark:bg-slate-900">
                                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                    Passengers
                                </h3>
                                <div className="grid gap-4">
                                    {booking.passengers.map((passenger, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                            className="flex justify-between items-center p-5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {(passenger.first_name || passenger.name || 'P').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg text-slate-900 dark:text-white">
                                                        {passenger.first_name && passenger.last_name
                                                            ? `${passenger.first_name} ${passenger.last_name}`.toUpperCase()
                                                            : (passenger.name || 'Passenger').toUpperCase()}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {passenger.passport_number ? `Passport: ${passenger.passport_number}` : 'Passport: N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Seat</p>
                                                <Badge className="text-xl px-4 py-2 font-mono font-bold bg-primary/10 text-primary border-primary hover:bg-primary/20">
                                                    {passenger.seat_number || 'TBD'}
                                                </Badge>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* QR Code & Footer */}
                            <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white print-color-adjust-exact">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 bg-white rounded-xl p-2 flex items-center justify-center">
                                            <QrCode className="w-16 h-16 text-slate-900" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-slate-300 mb-1">Scan for mobile check-in</p>
                                            <p className="text-xs text-slate-500">Present this code at the gate</p>
                                        </div>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <p className="text-sm text-slate-300">Please arrive at the airport at least <span className="font-bold text-white">2 hours</span> before departure.</p>
                                        <p className="text-xs text-slate-500 mt-1">This is an electronic ticket. You can show this on your mobile device.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
