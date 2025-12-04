"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { PublicLayout } from "@/components/layouts/public-layout"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Star, MapPin, Wifi, Coffee, Car, Check, ArrowLeft, Share2, Heart } from "lucide-react"
import Image from "next/image"
import { Card } from "@/components/ui/card"

interface Hotel {
    id: number
    name: string
    address: string
    city: string
    description: string
    rating: number
    price_per_night: number
    image_url: string
    amenities: string[]
}

export default function HotelDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [hotel, setHotel] = useState<Hotel | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHotel = async () => {
            setLoading(true)
            try {
                const response = await api.get(`/hotels/${params.id}`)
                setHotel(response.data.data || response.data)
            } catch (error) {
                console.error("Failed to fetch hotel details", error)
                // Mock data fallback
                setHotel({
                    id: Number(params.id),
                    name: "Grand Plaza Hotel",
                    address: "123 Main St",
                    city: "New York",
                    description: "Experience luxury at its finest at the Grand Plaza Hotel. Located in the heart of the city, we offer world-class amenities, breathtaking views, and exceptional service to make your stay unforgettable. Whether you are traveling for business or leisure, our hotel provides the perfect blend of comfort and elegance.",
                    rating: 4.8,
                    price_per_night: 250,
                    image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
                    amenities: ["wifi", "breakfast", "parking", "pool", "gym", "spa", "restaurant", "bar"]
                })
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchHotel()
        }
    }, [params.id])

    if (loading) {
        return (
            <PublicLayout>
                <div className="container mx-auto px-4 py-24">
                    <Skeleton className="w-full h-[400px] rounded-3xl mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-40 w-full" />
                        </div>
                        <div className="lg:col-span-1">
                            <Skeleton className="h-64 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </PublicLayout>
        )
    }

    if (!hotel) {
        return (
            <PublicLayout>
                <div className="container mx-auto px-4 py-24 text-center">
                    <h1 className="text-2xl font-bold">Hotel not found</h1>
                    <Button onClick={() => router.push('/hotels')} className="mt-4">
                        Back to Hotels
                    </Button>
                </div>
            </PublicLayout>
        )
    }

    return (
        <PublicLayout>
            <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-20">
                {/* Hero Image */}
                <div className="relative h-[50vh] w-full">
                    <Image
                        src={hotel.image_url}
                        alt={hotel.name}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    <div className="absolute top-24 left-4 md:left-8 z-10">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-0"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="container mx-auto px-4 relative h-full flex items-end pb-12">
                        <div className="text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-yellow-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-slate-900" /> {hotel.rating}
                                </span>
                                <span className="text-white/80 text-sm">{hotel.city}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-2">{hotel.name}</h1>
                            <div className="flex items-center text-white/80 text-sm">
                                <MapPin className="w-4 h-4 mr-1" />
                                {hotel.address}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Description */}
                            <Card className="p-8 rounded-[2rem] border-0 shadow-lg bg-white dark:bg-slate-900">
                                <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">About this hotel</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {hotel.description}
                                </p>
                            </Card>

                            {/* Amenities */}
                            <Card className="p-8 rounded-[2rem] border-0 shadow-lg bg-white dark:bg-slate-900">
                                <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Amenities</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {hotel.amenities.map((amenity) => (
                                        <div key={amenity} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                            {amenity === "wifi" && <Wifi className="w-4 h-4 text-primary" />}
                                            {amenity === "breakfast" && <Coffee className="w-4 h-4 text-primary" />}
                                            {amenity === "parking" && <Car className="w-4 h-4 text-primary" />}
                                            {/* Add more icons as needed */}
                                            <span className="capitalize text-sm font-medium">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Booking Card */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <Card className="p-6 rounded-[2rem] border-0 shadow-xl bg-white dark:bg-slate-900">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <span className="text-sm text-slate-500">Price per night</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-bold text-primary">${hotel.price_per_night}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="icon" className="rounded-full">
                                                <Share2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="rounded-full">
                                                <Heart className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Check-in</div>
                                            <div className="font-medium">Select Date</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Guests</div>
                                            <div className="font-medium">2 Adults, 1 Room</div>
                                        </div>
                                    </div>

                                    <Button
                                        size="lg"
                                        className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 shadow-lg shadow-primary/30"
                                        onClick={() => router.push(`/hotels/book?hotelId=${hotel.id}`)}
                                    >
                                        Book Now
                                    </Button>

                                    <div className="mt-4 text-center text-xs text-slate-400">
                                        You won't be charged yet
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
}
