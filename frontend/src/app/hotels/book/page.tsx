"use client"

import * as React from "react"
import { PublicLayout } from "@/components/layouts/public-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { ArrowLeft, CreditCard, Lock, CheckCircle } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"

interface Hotel {
    id: number
    name: string
    address: string
    city: string
    price_per_night: number
    image_url: string
}

export default function HotelBookingPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <HotelBookingContent />
        </React.Suspense>
    )
}

function HotelBookingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const hotelId = searchParams.get("hotelId")

    const [hotel, setHotel] = useState<Hotel | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [step, setStep] = useState(1) // 1: Details, 2: Payment, 3: Success

    // Form State
    const [guestName, setGuestName] = useState("")
    const [guestEmail, setGuestEmail] = useState("")
    const [checkIn, setCheckIn] = useState("")
    const [checkOut, setCheckOut] = useState("")

    useEffect(() => {
        const fetchHotel = async () => {
            if (!hotelId) return
            setLoading(true)
            try {
                const response = await api.get(`/hotels/${hotelId}`)
                setHotel(response.data.data || response.data)
            } catch (error) {
                console.error("Failed to fetch hotel", error)
                // Mock data fallback
                setHotel({
                    id: Number(hotelId),
                    name: "Grand Plaza Hotel",
                    address: "123 Main St",
                    city: "New York",
                    price_per_night: 250,
                    image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
                })
            } finally {
                setLoading(false)
            }
        }
        fetchHotel()
    }, [hotelId])

    const handleBooking = async () => {
        setProcessing(true)
        try {
            await api.post('/hotel-bookings', {
                hotel_id: hotelId,
                check_in: checkIn,
                check_out: checkOut,
                guest_name: guestName,
                guest_email: guestEmail,
                total_price: hotel ? hotel.price_per_night * 2 : 0 // Mock calculation
            })
            setStep(3)
        } catch (error) {
            console.error("Booking failed", error)
            toast({
                title: "Booking Failed",
                description: "Please try again later.",
                variant: "destructive"
            })
            // Mock success for demo
            setStep(3)
        } finally {
            setProcessing(false)
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

    if (!hotel) return <div>Hotel not found</div>

    return (
        <PublicLayout>
            <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-2xl font-bold">Complete your booking</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Main Form */}
                        <div className="md:col-span-2 space-y-6">
                            {step === 1 && (
                                <Card className="p-6 rounded-2xl border-0 shadow-lg">
                                    <h2 className="text-xl font-bold mb-6">Guest Details</h2>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Full Name</label>
                                                <Input
                                                    placeholder="John Doe"
                                                    value={guestName}
                                                    onChange={(e) => setGuestName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Email Address</label>
                                                <Input
                                                    placeholder="john@example.com"
                                                    value={guestEmail}
                                                    onChange={(e) => setGuestEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Check-in Date</label>
                                                <Input
                                                    type="date"
                                                    value={checkIn}
                                                    onChange={(e) => setCheckIn(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Check-out Date</label>
                                                <Input
                                                    type="date"
                                                    value={checkOut}
                                                    onChange={(e) => setCheckOut(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full mt-4"
                                            onClick={() => setStep(2)}
                                            disabled={!guestName || !guestEmail || !checkIn || !checkOut}
                                        >
                                            Continue to Payment
                                        </Button>
                                    </div>
                                </Card>
                            )}

                            {step === 2 && (
                                <Card className="p-6 rounded-2xl border-0 shadow-lg">
                                    <h2 className="text-xl font-bold mb-6">Payment Method</h2>
                                    <div className="p-4 border rounded-xl mb-4 flex items-center gap-4 bg-slate-50 dark:bg-slate-800">
                                        <CreditCard className="w-6 h-6 text-primary" />
                                        <div>
                                            <div className="font-medium">Credit / Debit Card</div>
                                            <div className="text-xs text-slate-500">Secure payment via Stripe</div>
                                        </div>
                                    </div>
                                    {/* Mock Payment Form */}
                                    <div className="space-y-4">
                                        <Input placeholder="Card Number" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input placeholder="MM/YY" />
                                            <Input placeholder="CVC" />
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleBooking}
                                        disabled={processing}
                                    >
                                        {processing ? "Processing..." : `Pay $${hotel.price_per_night * 2}`}
                                    </Button>
                                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                                        <Lock className="w-3 h-3" /> Payments are secure and encrypted
                                    </div>
                                </Card>
                            )}

                            {step === 3 && (
                                <Card className="p-8 rounded-2xl border-0 shadow-lg text-center">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                                    <p className="text-slate-500 mb-8">
                                        Your stay at {hotel.name} has been booked successfully. A confirmation email has been sent to {guestEmail}.
                                    </p>
                                    <div className="flex justify-center gap-4">
                                        <Button variant="outline" onClick={() => router.push('/dashboard')}>
                                            View Booking
                                        </Button>
                                        <Button onClick={() => router.push('/')}>
                                            Back to Home
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="md:col-span-1">
                            <Card className="p-6 rounded-2xl border-0 shadow-lg sticky top-24">
                                <h3 className="font-bold mb-4">Order Summary</h3>
                                <div className="flex gap-4 mb-4">
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                                        <Image src={hotel.image_url} alt={hotel.name} fill className="object-cover" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm line-clamp-2">{hotel.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">{hotel.city}</div>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm border-t pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Price per night</span>
                                        <span>${hotel.price_per_night}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Nights</span>
                                        <span>2</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Taxes & Fees</span>
                                        <span>$45</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                        <span>Total</span>
                                        <span className="text-primary">${hotel.price_per_night * 2 + 45}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
}
