'use client';

import { useState, useEffect, Suspense } from 'react';
import api from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plane, Calendar, Clock, User, Armchair, Trash2, Plus, CreditCard, CheckCircle2, ChevronRight, ChevronLeft, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PublicLayout } from "@/components/layouts/public-layout"
import { motion, AnimatePresence } from "framer-motion"
import { StepIndicator } from "@/components/step-indicator"
import { SeatMap } from "@/components/seat-map"
import { useLanguage } from "@/context/language-context"

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

interface Passenger {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    passport_number: string;
    passport_expiry: string;
    seat_number: string;
    email: string;
    phone_number: string;
}

function BookingForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const { t } = useLanguage();
    const flightId = searchParams.get('flight_id');
    const packageId = searchParams.get('package'); // Get selected package from URL

    // Get passenger counts from URL
    const adults = parseInt(searchParams.get('adults') || '1');
    const children = parseInt(searchParams.get('children') || '0');
    const infants = parseInt(searchParams.get('infants') || '0');
    const totalPassengerCount = Math.max(1, adults + children + infants);

    const [flight, setFlight] = useState<Flight | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [bookingId, setBookingId] = useState<number | null>(null);

    const steps = [
        t?.booking?.steps?.passengers || "Passengers",
        t?.booking?.steps?.seats || "Seats",
        t?.booking?.steps?.payment || "Payment",
        t?.booking?.steps?.confirmation || "Confirmation"
    ];

    // Initialize passengers from URL params
    useEffect(() => {
        const initialPassengers = Array(totalPassengerCount).fill(null).map((_, i) => ({
            first_name: '',
            last_name: '',
            date_of_birth: '',
            passport_number: '',
            passport_expiry: '',
            seat_number: '',
            email: '',
            phone_number: ''
        }));
        setPassengers(initialPassengers);
    }, [totalPassengerCount]);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push(`/login?redirect=/bookings/create?flight_id=${flightId}&adults=${adults}&children=${children}&infants=${infants}`);
            return;
        }

        if (flightId) {
            fetchFlight();
        }
    }, [flightId, user, isAuthLoading, router, adults, children, infants]);

    const fetchFlight = async () => {
        try {
            const response = await api.get(`/flights/${flightId}`);
            setFlight(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch flight', error);
            setError('Failed to load flight details');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };
        setPassengers(newPassengers);
    };

    const handleSeatSelect = (seat: string) => {
        if (selectedSeats.includes(seat)) {
            setSelectedSeats(selectedSeats.filter(s => s !== seat));
        } else if (selectedSeats.length < passengers.length) {
            setSelectedSeats([...selectedSeats, seat]);
        }
    };

    const nextStep = async () => {
        if (currentStep === 0) {
            // Validate passengers
            const isValid = passengers.every(p => p.first_name.trim() !== '' && p.last_name.trim() !== '');
            if (!isValid) {
                setError('Please fill in first and last name for all passengers');
                return;
            }
            setError('');
        }

        if (currentStep === 2) {
            // Submit booking
            await handleSubmit();
        } else {
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
        }
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
        setError('');
    };

    const handleSubmit = async () => {
        setError('');
        try {
            const passengersPayload = passengers.map((p, index) => ({
                first_name: p.first_name,
                last_name: p.last_name,
                name: `${p.first_name} ${p.last_name}`,
                date_of_birth: p.date_of_birth || null,
                passport_number: p.passport_number || null,
                passport_expiry: p.passport_expiry || null,
                seat_number: selectedSeats[index] || null,
                email: p.email || null,
                phone_number: p.phone_number || null
            }));

            const response = await api.post('/bookings', {
                flight_id: flightId,
                package_id: packageId || null,
                passengers: passengersPayload,
            });

            const newBookingId = response.data.booking?.id || response.data.id;

            // Redirect directly to payment page instead of showing confirmation
            router.push(`/bookings/${newBookingId}/pay`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create booking');
        }
    };

    // Calculate prices
    const TAX_RATE = 0.10;
    const baseFare = (flight?.base_price || 0) * passengers.length;
    const taxes = baseFare * TAX_RATE;
    const totalPrice = baseFare + taxes;

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
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

    return (
        <PublicLayout>
            <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-12">
                {/* Header */}
                <div className="bg-slate-900 text-white py-8 pt-24">
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl font-bold mb-2">{t?.booking?.title || 'Complete Your Booking'}</h1>
                        <div className="flex items-center gap-4 text-slate-300">
                            <span className="flex items-center gap-2">
                                <Plane className="w-4 h-4" />
                                {flight.flight_number}
                            </span>
                            <span>
                                {flight.origin_airport?.code} → {flight.destination_airport?.code}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(flight.departure_time)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-4">
                    {/* Step Indicator */}
                    <Card className="mb-8 border-none shadow-lg" hoverEffect={false}>
                        <CardContent className="py-6">
                            <StepIndicator currentStep={currentStep} steps={steps} />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Step 0: Passenger Details */}
                                    {currentStep === 0 && (
                                        <Card className="border-none shadow-lg rounded-[1.5rem] overflow-hidden bg-white dark:bg-slate-900" hoverEffect={false}>
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

                                                <div className="space-y-6">
                                                    {passengers.map((passenger, index) => (
                                                        <motion.div
                                                            key={index}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800"
                                                        >
                                                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                                                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                                                                    {index + 1}
                                                                </span>
                                                                Passenger {index + 1}
                                                                {index < adults && <Badge variant="secondary" className="ml-2">Adult</Badge>}
                                                                {index >= adults && index < adults + children && <Badge variant="outline" className="ml-2">Child</Badge>}
                                                                {index >= adults + children && <Badge variant="outline" className="ml-2">Infant</Badge>}
                                                            </h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`first_name-${index}`} className="text-xs font-semibold uppercase text-slate-500 tracking-wider">First Name *</Label>
                                                                    <div className="relative group">
                                                                        <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                                        <Input
                                                                            id={`first_name-${index}`}
                                                                            placeholder="e.g. John"
                                                                            className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                                                            required
                                                                            value={passenger.first_name}
                                                                            onChange={(e) => handlePassengerChange(index, 'first_name', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`last_name-${index}`} className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Last Name *</Label>
                                                                    <div className="relative group">
                                                                        <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                                        <Input
                                                                            id={`last_name-${index}`}
                                                                            placeholder="e.g. Doe"
                                                                            className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                                                            required
                                                                            value={passenger.last_name}
                                                                            onChange={(e) => handlePassengerChange(index, 'last_name', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`dob-${index}`} className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Date of Birth</Label>
                                                                    <div className="relative group">
                                                                        <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                                        <Input
                                                                            id={`dob-${index}`}
                                                                            type="date"
                                                                            className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                                                            value={passenger.date_of_birth}
                                                                            onChange={(e) => handlePassengerChange(index, 'date_of_birth', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`passport-${index}`} className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Passport Number</Label>
                                                                    <div className="relative group">
                                                                        <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                                        <Input
                                                                            id={`passport-${index}`}
                                                                            placeholder="e.g. AB1234567"
                                                                            className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                                                            value={passenger.passport_number}
                                                                            onChange={(e) => handlePassengerChange(index, 'passport_number', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="md:col-span-2 space-y-2">
                                                                    <Label htmlFor={`passport_expiry-${index}`} className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Passport Expiry Date</Label>
                                                                    <div className="relative group">
                                                                        <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                                        <Input
                                                                            id={`passport_expiry-${index}`}
                                                                            type="date"
                                                                            className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                                                            value={passenger.passport_expiry}
                                                                            onChange={(e) => handlePassengerChange(index, 'passport_expiry', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {/* Email and Phone for first passenger (contact) */}
                                                                {index === 0 && (
                                                                    <>
                                                                        <div className="space-y-2">
                                                                            <Label htmlFor="email" className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Email *</Label>
                                                                            <Input
                                                                                id="email"
                                                                                type="email"
                                                                                placeholder="e.g. john@example.com"
                                                                                className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                                                                required
                                                                                value={passenger.email}
                                                                                onChange={(e) => handlePassengerChange(index, 'email', e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label htmlFor="phone" className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Phone *</Label>
                                                                            <Input
                                                                                id="phone"
                                                                                type="tel"
                                                                                placeholder="e.g. +1 555 123 4567"
                                                                                className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                                                                required
                                                                                value={passenger.phone_number}
                                                                                onChange={(e) => handlePassengerChange(index, 'phone_number', e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Step 1: Seat Selection */}
                                    {currentStep === 1 && (
                                        <Card className="border-none shadow-lg rounded-[1.5rem] overflow-hidden bg-white dark:bg-slate-900" hoverEffect={false}>
                                            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Armchair className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl">Select Your Seats</CardTitle>
                                                        <CardDescription>Choose {passengers.length} seat(s) for your passengers</CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-6">
                                                <div className="mb-4">
                                                    <p className="text-sm text-slate-500">
                                                        Selected: <span className="font-bold text-primary">{selectedSeats.length}/{passengers.length}</span>
                                                        {selectedSeats.length > 0 && (
                                                            <span className="ml-2">
                                                                ({selectedSeats.join(', ')})
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <SeatMap
                                                    flightId={parseInt(flightId || '0')}
                                                    selectedSeats={selectedSeats}
                                                    onSelect={handleSeatSelect}
                                                    maxSeats={passengers.length}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Step 2: Payment */}
                                    {currentStep === 2 && (
                                        <Card className="border-none shadow-lg rounded-[1.5rem] overflow-hidden bg-white dark:bg-slate-900" hoverEffect={false}>
                                            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Wallet className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl">Confirm & Pay</CardTitle>
                                                        <CardDescription>Review your booking and proceed to payment</CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-6">
                                                {error && (
                                                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2 text-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                                        {error}
                                                    </div>
                                                )}

                                                {/* Booking Summary */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="font-semibold mb-3">Passengers</h4>
                                                        <div className="space-y-2">
                                                            {passengers.map((p, i) => (
                                                                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                                    <span>{`${p.first_name} ${p.last_name}`.trim() || `Passenger ${i + 1}`}</span>
                                                                    <Badge>{selectedSeats[i] || 'No seat'}</Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                                        <p className="text-sm text-indigo-600 dark:text-indigo-400">
                                                            💳 Payment will be processed from your wallet balance after confirming the booking.
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Step 3: Confirmation */}
                                    {currentStep === 3 && (
                                        <Card className="text-center py-12 border-none shadow-lg rounded-[1.5rem]" hoverEffect={false}>
                                            <CardContent>
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 200 }}
                                                    className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                                                >
                                                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                                                </motion.div>
                                                <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                                                <p className="text-muted-foreground mb-8">
                                                    Your booking has been successfully created. You will receive a confirmation email shortly.
                                                </p>
                                                <div className="flex gap-4 justify-center">
                                                    {bookingId && (
                                                        <Button onClick={() => router.push(`/bookings/${bookingId}/pay`)}>
                                                            Proceed to Payment
                                                        </Button>
                                                    )}
                                                    <Button variant="outline" onClick={() => router.push('/dashboard/trips')}>
                                                        View My Trips
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            {currentStep < 3 && (
                                <div className="flex justify-between mt-8">
                                    <Button
                                        variant="outline"
                                        onClick={prevStep}
                                        disabled={currentStep === 0}
                                        className="w-32"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>
                                    <Button
                                        onClick={nextStep}
                                        className="w-32"
                                    >
                                        {currentStep === 2 ? 'Confirm' : 'Next'} <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Price Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-24 border-none shadow-xl bg-slate-900 text-white overflow-hidden rounded-[1.5rem] relative" hoverEffect={false}>
                                {/* Abstract Background */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

                                <CardHeader className="pb-6 border-b border-white/10 relative z-10">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Plane className="w-5 h-5 text-indigo-400" />
                                        Flight Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6 relative z-10">
                                    {/* Flight Info */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-slate-400 text-sm">Airline</span>
                                            <span className="font-bold">{flight.airline?.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 text-sm">Flight</span>
                                            <Badge className="bg-white/10 text-white border-none">{flight.flight_number}</Badge>
                                        </div>
                                    </div>

                                    {/* Route */}
                                    <div className="relative py-4">
                                        <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500 to-teal-500 opacity-50"></div>
                                        <div className="relative flex gap-5 mb-6">
                                            <div className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900 shrink-0 z-10"></div>
                                            <div>
                                                <p className="font-bold text-lg">{flight.origin_airport?.code}</p>
                                                <p className="text-sm text-slate-400">{flight.origin_airport?.city}</p>
                                                <p className="text-xs text-indigo-300 mt-1">{formatTime(flight.departure_time)}</p>
                                            </div>
                                        </div>
                                        <div className="relative flex gap-5">
                                            <div className="w-4 h-4 rounded-full bg-teal-500 border-4 border-slate-900 shrink-0 z-10"></div>
                                            <div>
                                                <p className="font-bold text-lg">{flight.destination_airport?.code}</p>
                                                <p className="text-sm text-slate-400">{flight.destination_airport?.city}</p>
                                                <p className="text-xs text-teal-300 mt-1">{formatTime(flight.arrival_time)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="pt-4 border-t border-white/10 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Base fare × {passengers.length}</span>
                                            <span>${baseFare.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Taxes & fees</span>
                                            <span>${taxes.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xl font-bold pt-2 text-indigo-300">
                                            <span>Total</span>
                                            <span>${totalPrice.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
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
