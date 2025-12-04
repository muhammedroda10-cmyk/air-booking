"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PublicLayout } from "@/components/layouts/public-layout"
import { StepIndicator } from "@/components/step-indicator"
import { PassengerForm } from "@/components/passenger-form"
import { SeatMap } from "@/components/seat-map"
import { PaymentForm } from "@/components/payment-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Plane, Clock } from "lucide-react"
import { useSearchParams } from "next/navigation"
import api from "@/lib/api"

interface Flight {
    id: number;
    flight_number: string;
    price: number;
    departure_time: string;
    arrival_time: string;
    airline?: { name: string };
    origin?: { code: string; city: string };
    destination?: { code: string; city: string };
}

export default function BookingPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <BookingContent />
        </React.Suspense>
    )
}

import { useLanguage } from "@/context/language-context"

function BookingContent() {
    const searchParams = useSearchParams()
    const { t } = useLanguage()
    const flightId = searchParams.get("flight_id")

    // Get passenger counts from URL
    const adults = parseInt(searchParams.get("adults") || "1")
    const children = parseInt(searchParams.get("children") || "0")
    const infants = parseInt(searchParams.get("infants") || "0")
    const totalPassengers = adults + children + infants

    const [currentStep, setCurrentStep] = React.useState(0)
    const steps = [t.booking.steps.passengers, t.booking.steps.seats, t.booking.steps.payment, t.booking.steps.confirmation]
    const [passengerData, setPassengerData] = React.useState<any[]>([])
    const [selectedSeats, setSelectedSeats] = React.useState<string[]>([])
    const [flight, setFlight] = React.useState<Flight | null>(null)
    const [loading, setLoading] = React.useState(true)

    // Fetch flight data on mount
    React.useEffect(() => {
        const fetchFlight = async () => {
            if (!flightId) return;
            try {
                const response = await api.get(`/flights/${flightId}`);
                setFlight(response.data.data || response.data);
            } catch (error) {
                console.error("Failed to fetch flight", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFlight();
    }, [flightId]);

    // Calculate prices dynamically
    const TAX_RATE = 0.10; // 10% tax
    const baseFare = (flight?.price || 0) * totalPassengers;
    const taxes = baseFare * TAX_RATE;
    const seatFee = 0; // Could be dynamic based on seat class
    const totalPrice = baseFare + taxes + seatFee;

    const nextStep = async () => {
        if (currentStep === 2) {
            // Submit booking
            try {
                const passengersPayload = passengerData.map((p: any, index: number) => ({
                    name: `${p.firstName} ${p.lastName}`,
                    passport_number: p.passportNumber,
                    seat_number: selectedSeats[index] || null
                }))

                await api.post('/bookings', {
                    flight_id: flightId,
                    passengers: passengersPayload
                })
                setCurrentStep(prev => prev + 1)
            } catch (error: any) {
                console.error("Booking failed", error)
                alert(`Booking failed: ${error.response?.data?.message || error.message}`)
            }
        } else {
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
        }
    }

    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <PublicLayout>
            <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-12">
                {/* Header */}
                <div className="bg-slate-900 text-white py-8">
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl font-bold mb-2">{t.booking.title}</h1>
                        {flight && (
                            <div className="flex items-center gap-4 text-slate-300">
                                <span className="flex items-center gap-2">
                                    <Plane className="w-4 h-4" />
                                    {flight.flight_number}
                                </span>
                                <span>
                                    {flight.origin?.code} → {flight.destination?.code}
                                </span>
                                {flight.departure_time && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {formatDate(flight.departure_time)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-8">
                    <Card className="mb-8 border-none shadow-lg">
                        <CardContent>
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
                                    {currentStep === 0 && (
                                        <PassengerForm
                                            onChange={setPassengerData}
                                            adults={adults}
                                            children={children}
                                            infants={infants}
                                        />
                                    )}
                                    {currentStep === 1 && <SeatMap onSelect={(seat) => setSelectedSeats([...selectedSeats, seat])} />}
                                    {currentStep === 2 && <PaymentForm />}
                                    {currentStep === 3 && (
                                        <Card className="text-center py-12">
                                            <CardContent>
                                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                                <h2 className="text-2xl font-bold mb-2">{t.booking.confirmed}</h2>
                                                <p className="text-muted-foreground mb-8">{t.booking.confirmed_desc}</p>
                                                <Button>{t.booking.download_ticket}</Button>
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
                                        <ChevronLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 rtl:rotate-180" /> {t.common.back}
                                    </Button>
                                    <Button
                                        onClick={nextStep}
                                        className="w-32"
                                    >
                                        {currentStep === 2 ? t.booking.pay_now : t.common.next} <ChevronRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Price Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-24">
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-lg mb-4">{t.booking.price_summary}</h3>

                                    {/* Flight Info */}
                                    {flight && (
                                        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="text-sm font-medium">{flight.airline?.name || 'Airline'}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {flight.origin?.city} → {flight.destination?.city}
                                            </div>
                                            {flight.departure_time && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {formatTime(flight.departure_time)} - {formatTime(flight.arrival_time)}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {loading ? (
                                        <div className="flex justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3 text-sm border-b pb-4 mb-4">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t.booking.base_fare}</span>
                                                    <span>${baseFare.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t.booking.taxes} (10%)</span>
                                                    <span>${taxes.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t.booking.seat_selection}</span>
                                                    <span>${seatFee.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between font-bold text-lg">
                                                <span>{t.booking.total}</span>
                                                <span className="text-primary">${totalPrice.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
}

