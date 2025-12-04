'use client';

import React, { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { PublicLayout } from "@/components/layouts/public-layout"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Download, Home, Plane, Calendar, Clock, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import confetti from 'canvas-confetti';
import { useReactToPrint } from 'react-to-print';

export default function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const componentRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Ticket-${booking?.pnr || 'Booking'}`,
    });

    useEffect(() => {
        if (user) {
            fetchBooking();
        }
    }, [id, user]);

    useEffect(() => {
        if (booking) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const random = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [booking]);

    const fetchBooking = async () => {
        try {
            const response = await api.get(`/bookings/${id}`);
            setBooking(response.data);
        } catch (error) {
            console.error('Failed to fetch booking', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <PublicLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
            </div>
        </PublicLayout>
    );

    if (!booking) return (
        <PublicLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Booking Not Found</h2>
                    <Button onClick={() => window.location.href = '/'} className="mt-4">Back to Home</Button>
                </div>
            </div>
        </PublicLayout>
    );

    return (
        <PublicLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-10"
                    >
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">Booking Confirmed!</h1>
                        <p className="text-slate-600 dark:text-slate-400 text-lg">
                            Your flight has been successfully booked. A confirmation email has been sent to your inbox.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <div ref={componentRef}>
                            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 relative print:shadow-none print:rounded-none">
                                {/* Ticket Header */}
                                <div className="bg-slate-900 text-white p-8 relative overflow-hidden print:bg-slate-900 print:text-white">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none print:hidden"></div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                                        <div>
                                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Booking Reference (PNR)</p>
                                            <p className="text-3xl font-mono font-bold text-indigo-400 tracking-widest">{booking.pnr}</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm print:border print:border-white/20">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse print:animate-none" />
                                            <span className="font-medium text-sm">Confirmed</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ticket Body */}
                                <CardContent className="p-0">
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                                        {/* Perforated Line Effect */}
                                        <div className="absolute top-0 bottom-0 left-2/3 w-px border-l-2 border-dashed border-slate-200 dark:border-slate-800 hidden md:block print:hidden" />
                                        <div className="absolute -top-3 left-2/3 w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full -ml-3 hidden md:block print:hidden" />
                                        <div className="absolute -bottom-3 left-2/3 w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full -ml-3 hidden md:block print:hidden" />

                                        {/* Flight Info */}
                                        <div className="md:col-span-2 space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center print:bg-slate-100">
                                                    <Plane className="w-6 h-6 text-slate-600 dark:text-slate-400 print:text-slate-900" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{booking.flight.airline.name}</h3>
                                                    <p className="text-slate-500 text-sm">Flight {booking.flight.flight_number}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row justify-between gap-8">
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-1">From</p>
                                                    <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{booking.flight.origin_airport.code}</p>
                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{booking.flight.origin_airport.city}</p>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center justify-center">
                                                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700 relative print:bg-slate-300">
                                                        <Plane className="w-4 h-4 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-white dark:bg-slate-900 px-0.5 print:text-slate-600" />
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-2">Duration: 2h 30m</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-500 mb-1">To</p>
                                                    <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{booking.flight.destination_airport.code}</p>
                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{booking.flight.destination_airport.city}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                                <div>
                                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className="text-xs font-medium uppercase tracking-wider">Date</span>
                                                    </div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">
                                                        {new Date(booking.flight.departure_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-xs font-medium uppercase tracking-wider">Time</span>
                                                    </div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">
                                                        {new Date(booking.flight.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Passenger Info */}
                                        <div className="md:col-span-1 md:pl-8 flex flex-col justify-center space-y-6 print:border-l print:border-slate-200 print:pl-8">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Passengers</p>
                                                <div className="space-y-3">
                                                    {booking.passengers?.map((p: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 print:bg-slate-100 print:text-slate-900">
                                                                {p.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm text-slate-900 dark:text-white">{p.name}</p>
                                                                <p className="text-xs text-slate-500">Seat {p.seat_number}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center print:bg-slate-50">
                                                    <p className="text-xs text-slate-500 mb-1">Scan to check-in</p>
                                                    {/* Placeholder for QR Code */}
                                                    <div className="w-24 h-24 bg-white dark:bg-slate-900 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center print:border-slate-300">
                                                        <div className="grid grid-cols-4 gap-1 p-2">
                                                            {[...Array(16)].map((_, i) => (
                                                                <div key={i} className={`w-1.5 h-1.5 rounded-sm ${Math.random() > 0.5 ? 'bg-slate-900 dark:bg-white' : 'bg-transparent'} print:bg-slate-900`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-6 flex flex-col sm:flex-row gap-4 justify-center mt-8 rounded-xl">
                            <Button variant="outline" className="w-full sm:w-auto gap-2 h-11" onClick={() => handlePrint()}>
                                <Download className="w-4 h-4" />
                                Download Ticket
                            </Button>
                            <Button className="w-full sm:w-auto gap-2 h-11 bg-primary hover:bg-primary/90" asChild>
                                <Link href="/dashboard">
                                    <Home className="w-4 h-4" />
                                    Go to Dashboard
                                </Link>
                            </Button>
                        </CardFooter>
                    </motion.div>
                </div>
            </div>
        </PublicLayout>
    );
}

