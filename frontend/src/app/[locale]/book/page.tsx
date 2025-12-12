"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PublicLayout } from "@/components/layouts/public-layout"
import { StepIndicator } from "@/components/step-indicator"
import { PassengerForm, PassengerFormRef } from "@/components/passenger-form"
import { SeatMap, SeatMapRef } from "@/components/seat-map"
import { PaymentForm, PaymentMethod, PaymentFormRef } from "@/components/payment-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Plane, Clock, Tag, Loader2, AlertCircle } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { PromoCodeInput } from "@/components/promo-code-input"

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
    const router = useRouter()
    const { t, dir } = useLanguage()
    const flightId = searchParams.get("flight_id")

    // Get passenger counts from URL
    const adults = parseInt(searchParams.get("adults") || "1")
    const children = parseInt(searchParams.get("children") || "0")
    const infants = parseInt(searchParams.get("infants") || "0")
    const totalPassengers = adults + children + infants

    const [currentStep, setCurrentStep] = React.useState(0)
    const steps = [t.booking.steps.passengers, t.booking.steps.seats, t.booking.steps.payment, t.booking.steps.confirmation]
    const [passengerData, setPassengerData] = React.useState<any[]>([])
    const [contactInfo, setContactInfo] = React.useState({ email: "", phone: "" })
    const [selectedSeats, setSelectedSeats] = React.useState<string[]>([])
    const [flight, setFlight] = React.useState<Flight | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [paymentProcessing, setPaymentProcessing] = React.useState(false)
    const [paymentError, setPaymentError] = React.useState<string | null>(null)
    const [stepError, setStepError] = React.useState<string | null>(null)
    const [bookingId, setBookingId] = React.useState<number | null>(null)
    const [bookingPNR, setBookingPNR] = React.useState<string | null>(null)

    // Refs for validation
    const passengerFormRef = React.useRef<PassengerFormRef>(null)
    const seatMapRef = React.useRef<SeatMapRef>(null)
    const paymentFormRef = React.useRef<PaymentFormRef>(null)

    // Promo code state
    const [appliedPromoCode, setAppliedPromoCode] = React.useState<string | null>(null)
    const [promoDiscount, setPromoDiscount] = React.useState(0)

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
    const subtotal = baseFare + taxes + seatFee;
    const totalPrice = subtotal - promoDiscount;

    const handlePromoApply = (code: string, discount: number) => {
        setAppliedPromoCode(code);
        setPromoDiscount(discount);
    };

    const handlePromoRemove = () => {
        setAppliedPromoCode(null);
        setPromoDiscount(0);
    };

    const handlePassengerChange = (passengers: any[], contact: { email: string; phone: string }) => {
        setPassengerData(passengers)
        setContactInfo(contact)
    }

    const handleSeatSelect = (seatId: string) => {
        if (selectedSeats.length < totalPassengers) {
            setSelectedSeats(prev => [...prev, seatId])
        }
    }

    const handleSeatDeselect = (seatId: string) => {
        setSelectedSeats(prev => prev.filter(s => s !== seatId))
    }

    const handlePayment = async (paymentMethod: PaymentMethod, cardDetails?: { cardNumber: string; expiryDate: string; cvc: string; cardholderName: string }) => {
        setPaymentProcessing(true)
        setPaymentError(null)

        try {
            // Step 1: Create the booking
            const passengersPayload = passengerData.map((p: any, index: number) => ({
                name: `${p.firstName} ${p.lastName}`,
                first_name: p.firstName,
                last_name: p.lastName,
                date_of_birth: p.dob,
                passport_number: p.passportNumber,
                passport_expiry: p.passportExpiry,
                nationality: p.nationality,
                passenger_type: p.type || 'adult',
                meal_preference: p.mealPreference,
                special_requests: p.specialAssistance !== 'none' ? p.specialAssistance : null,
                seat_number: selectedSeats[index] || null
            }))

            const bookingResponse = await api.post('/bookings', {
                flight_id: flightId,
                passengers: passengersPayload,
                promo_code: appliedPromoCode,
                contact_email: contactInfo.email,
                contact_phone: contactInfo.phone
            })

            const newBookingId = bookingResponse.data.booking.id
            const pnr = bookingResponse.data.booking.pnr
            setBookingId(newBookingId)
            setBookingPNR(pnr)

            // Step 2: Process payment based on method
            if (paymentMethod === 'wallet') {
                // Pay with wallet
                await api.post('/wallet/pay', {
                    booking_id: newBookingId,
                    amount: totalPrice
                })
            } else {
                // For credit card, we simulate payment processing
                // In production, this would integrate with a payment gateway like Stripe
                await api.post('/payments/process', {
                    booking_id: newBookingId,
                    payment_method: 'credit_card',
                    amount: totalPrice,
                    card_last_four: cardDetails?.cardNumber.slice(-4)
                })
            }

            // Payment successful - move to confirmation
            setCurrentStep(3)
        } catch (error: any) {
            console.error("Payment failed", error)
            setPaymentError(error.response?.data?.message || 'Payment failed. Please try again.')
        } finally {
            setPaymentProcessing(false)
        }
    }

    const nextStep = async () => {
        setStepError(null)

        if (currentStep === 0) {
            // Validate passenger form
            const validation = passengerFormRef.current?.validate()
            if (validation && !validation.isValid) {
                setStepError(validation.error || 'Please complete all required fields')
                return
            }
        } else if (currentStep === 1) {
            // Validate seat selection (optional but check if any selected)
            // Seats are optional, so we just proceed
            // But you could make it required like this:
            // const validation = seatMapRef.current?.validate()
            // if (validation && !validation.isValid) {
            //     setStepError(validation.error)
            //     return
            // }
        } else if (currentStep === 2) {
            // Trigger payment form submission
            if (paymentFormRef.current) {
                paymentFormRef.current.submit()
            } else {
                setStepError('Payment form not ready. Please try again.')
            }
            return // Don't advance step here, payment handler will do it
        }

        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }

    const prevStep = () => {
        setStepError(null)
        setCurrentStep((prev) => Math.max(prev - 1, 0))
    }

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const handleDownloadTicket = async () => {
        if (!bookingId) return
        try {
            const response = await api.get(`/bookings/${bookingId}/download`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `ticket-${bookingPNR}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error('Failed to download ticket', error)
        }
    }

    return (
        <PublicLayout>
            <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-12">
                {/* Header */}
                <div className="bg-slate-900 text-white py-8">
                    <div className="container mx-auto px-4 lg:px-8 xl:px-16">
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

                <div className="container mx-auto px-4 lg:px-8 xl:px-16 max-w-7xl -mt-8">
                    <Card className="mb-8 border-none shadow-lg">
                        <CardContent className="pt-6">
                            <StepIndicator currentStep={currentStep} steps={steps} />
                        </CardContent>
                    </Card>

                    {/* Step Error Alert */}
                    {stepError && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <span className="text-sm text-red-600 dark:text-red-400">{stepError}</span>
                        </div>
                    )}

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
                                            ref={passengerFormRef}
                                            onChange={handlePassengerChange}
                                            adults={adults}
                                            children={children}
                                            infants={infants}
                                        />
                                    )}
                                    {currentStep === 1 && (
                                        <SeatMap
                                            ref={seatMapRef}
                                            flightId={parseInt(flightId || '0')}
                                            selectedSeats={selectedSeats}
                                            onSelect={handleSeatSelect}
                                            onDeselect={handleSeatDeselect}
                                            maxSeats={totalPassengers}
                                            required={false}
                                        />
                                    )}
                                    {currentStep === 2 && (
                                        <PaymentForm
                                            ref={paymentFormRef}
                                            totalAmount={totalPrice}
                                            onSubmit={handlePayment}
                                            isProcessing={paymentProcessing}
                                            error={paymentError}
                                        />
                                    )}
                                    {currentStep === 3 && (
                                        <Card className="text-center py-12">
                                            <CardContent>
                                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                                <h2 className="text-2xl font-bold mb-2">{t.booking.confirmed}</h2>
                                                <p className="text-muted-foreground mb-4">{t.booking.confirmed_desc}</p>
                                                {bookingPNR && (
                                                    <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg inline-block">
                                                        <div className="text-sm text-muted-foreground mb-1">
                                                            {dir === 'rtl' ? 'رقم الحجز' : 'Booking Reference'}
                                                        </div>
                                                        <div className="text-2xl font-mono font-bold tracking-wider text-primary">
                                                            {bookingPNR}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                                    <Button onClick={handleDownloadTicket}>
                                                        {t.booking.download_ticket}
                                                    </Button>
                                                    <Button variant="outline" onClick={() => router.push('/account/bookings/flight')}>
                                                        {dir === 'rtl' ? 'عرض رحلاتي' : 'View My Trips'}
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
                                        <ChevronLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 rtl:rotate-180" /> {t.common.back}
                                    </Button>
                                    <Button
                                        onClick={nextStep}
                                        className="w-40"
                                        disabled={paymentProcessing}
                                    >
                                        {paymentProcessing ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {dir === 'rtl' ? 'جاري المعالجة...' : 'Processing...'}</>
                                        ) : (
                                            <>{currentStep === 2 ? t.booking.pay_now : t.common.next} <ChevronRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180" /></>
                                        )}
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

                                    {/* Passengers Summary */}
                                    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div className="text-sm font-medium mb-2">
                                            {dir === 'rtl' ? 'المسافرون' : 'Passengers'}
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            {adults > 0 && <div>{adults} {dir === 'rtl' ? 'بالغ' : `Adult${adults > 1 ? 's' : ''}`}</div>}
                                            {children > 0 && <div>{children} {dir === 'rtl' ? 'طفل' : `Child${children > 1 ? 'ren' : ''}`}</div>}
                                            {infants > 0 && <div>{infants} {dir === 'rtl' ? 'رضيع' : `Infant${infants > 1 ? 's' : ''}`}</div>}
                                        </div>
                                    </div>

                                    {/* Selected Seats */}
                                    {selectedSeats.length > 0 && (
                                        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="text-sm font-medium mb-2">
                                                {dir === 'rtl' ? 'المقاعد المختارة' : 'Selected Seats'}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedSeats.map(seat => (
                                                    <span key={seat} className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                                                        {seat}
                                                    </span>
                                                ))}
                                            </div>
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
                                                {promoDiscount > 0 && (
                                                    <div className="flex justify-between text-green-600">
                                                        <span className="flex items-center gap-1">
                                                            <Tag className="w-3 h-3" />
                                                            {dir === 'rtl' ? 'خصم الرمز الترويجي' : 'Promo Discount'}
                                                        </span>
                                                        <span>-${promoDiscount.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Promo Code Input */}
                                            <div className="mb-4">
                                                <PromoCodeInput
                                                    amount={subtotal}
                                                    type="flight"
                                                    onApply={handlePromoApply}
                                                    onRemove={handlePromoRemove}
                                                    appliedCode={appliedPromoCode || undefined}
                                                    appliedDiscount={promoDiscount}
                                                />
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
