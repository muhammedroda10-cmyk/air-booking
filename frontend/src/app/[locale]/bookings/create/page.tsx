'use client';

import { useState, useEffect, Suspense } from 'react';
import api from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plane, Calendar, Clock, User, Armchair, Trash2, Plus, CreditCard, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PublicLayout } from "@/components/layouts/public-layout"
import { motion, AnimatePresence } from "framer-motion"

interface Flight {
    id: number;
    flight_number: string;
    airline: { name: string };
    origin_airport: { city: string; code: string };
    destination_airport: { city: string; code: string };
    departure_time: string;
    arrival_time: string;
    base_price: number;
}

function BookingForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const flightId = searchParams.get('flight_id');

    const [flight, setFlight] = useState<Flight | null>(null);
    const [passengers, setPassengers] = useState([{ name: '', seat_number: '' }]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push(`/login?redirect=/bookings/create?flight_id=${flightId}`);
            return;
        }

        if (flightId) {
            fetchFlight();
        }
    }, [flightId, user, isAuthLoading]);

    const fetchFlight = async () => {
        try {
            const response = await api.get(`/flights/${flightId}`);
            setFlight(response.data);
        } catch (error) {
            console.error('Failed to fetch flight', error);
            setError('Failed to load flight details');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePassengerChange = (index: number, field: string, value: string) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };
        setPassengers(newPassengers);
    };

    const addPassenger = () => {
        setPassengers([...passengers, { name: '', seat_number: '' }]);
    };

    const removePassenger = (index: number) => {
        const newPassengers = passengers.filter((_, i) => i !== index);
        setPassengers(newPassengers);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post(
                '/bookings',
                {
                    flight_id: flightId,
                    passengers: passengers,
                }
            );
            router.push(`/bookings/${response.data.id}/pay`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create booking');
        }
    };

    if (isLoading || isAuthLoading) return (
        <PublicLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
            </div>
        </PublicLayout>
    );

    if (!flight) return (
        <PublicLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Flight Not Found</h2>
                    <p className="text-slate-500">The flight you are looking for does not exist or has expired.</p>
                    <Button onClick={() => router.push('/')} className="mt-4">Back to Home</Button>
                </div>
            </div>
        </PublicLayout>
    );

    const totalPrice = flight.base_price * passengers.length;

    return (
        <PublicLayout>
            <div className="bg-slate-50 dark:bg-slate-950 py-12 min-h-screen">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">Complete Your Booking</h1>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            You're just a few steps away from your trip. Please review your flight details and enter passenger information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left Column: Passenger Details */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-none shadow-lg rounded-[1.5rem] overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Passenger Details</CardTitle>
                                            <CardDescription>Enter the details for all travelers</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <form id="booking-form" onSubmit={handleSubmit} className="space-y-8">
                                        <AnimatePresence>
                                            {passengers.map((passenger, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="relative p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800"
                                                >
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs flex items-center justify-center text-slate-600 dark:text-slate-300">
                                                                {index + 1}
                                                            </span>
                                                            Passenger {index + 1}
                                                        </h3>
                                                        {passengers.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removePassenger(index)}
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-1.5" /> Remove
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`name-${index}`} className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Full Name</Label>
                                                            <div className="relative group">
                                                                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                                <Input
                                                                    id={`name-${index}`}
                                                                    placeholder="e.g. John Doe"
                                                                    className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                                                    required
                                                                    value={passenger.name}
                                                                    onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`seat-${index}`} className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Seat Preference</Label>
                                                            <div className="relative group">
                                                                <Armchair className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                                <Input
                                                                    id={`seat-${index}`}
                                                                    placeholder="e.g. 12A"
                                                                    className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                                                    required
                                                                    value={passenger.seat_number}
                                                                    onChange={(e) => handlePassengerChange(index, 'seat_number', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={addPassenger}
                                            className="w-full border-dashed border-2 py-8 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 rounded-2xl transition-all"
                                        >
                                            <Plus className="w-5 h-5 mr-2" /> Add Another Passenger
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Flight Summary */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden rounded-[1.5rem] relative">
                                    {/* Abstract Background Shapes */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

                                    <CardHeader className="pb-6 border-b border-white/10 relative z-10">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Plane className="w-5 h-5 text-indigo-400" />
                                            Flight Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-8 relative z-10">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-slate-400 text-sm font-medium">Airline</span>
                                                <span className="font-bold text-lg">{flight.airline.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400 text-sm font-medium">Flight No.</span>
                                                <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-none px-3 py-1">
                                                    {flight.flight_number}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="relative py-2">
                                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-500 to-teal-500 opacity-50"></div>
                                            <div className="relative flex gap-5 mb-8">
                                                <div className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900 shrink-0 z-10 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                                <div>
                                                    <p className="font-bold text-2xl leading-none mb-1">{flight.origin_airport.code}</p>
                                                    <p className="text-sm text-slate-400 font-medium">{flight.origin_airport.city}</p>
                                                    <p className="text-xs text-indigo-300 mt-1 font-mono bg-indigo-500/10 px-2 py-0.5 rounded inline-block">
                                                        {new Date(flight.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="relative flex gap-5">
                                                <div className="w-4 h-4 rounded-full bg-teal-500 border-4 border-slate-900 shrink-0 z-10 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                                <div>
                                                    <p className="font-bold text-2xl leading-none mb-1">{flight.destination_airport.code}</p>
                                                    <p className="text-sm text-slate-400 font-medium">{flight.destination_airport.city}</p>
                                                    <p className="text-xs text-teal-300 mt-1 font-mono bg-teal-500/10 px-2 py-0.5 rounded inline-block">
                                                        {new Date(flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/10 space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Price per person</span>
                                                <span className="font-medium">${flight.base_price}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Passengers</span>
                                                <span className="font-medium">x {passengers.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-2xl font-bold pt-2 text-indigo-300">
                                                <span>Total</span>
                                                <span>${totalPrice.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            form="booking-form"
                                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white h-14 text-lg font-bold shadow-lg shadow-indigo-900/50 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Proceed to Payment
                                        </Button>

                                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            <span>Secure Booking Process</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingForm />
        </Suspense>
    );
}
