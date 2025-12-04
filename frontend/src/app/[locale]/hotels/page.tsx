"use client"

import * as React from "react"
import { AirplaneLoader } from "@/components/ui/loading"
import { PublicLayout } from "@/components/layouts/public-layout"
import { SearchWidget } from "@/components/search-widget"
import { HotelCard } from "@/components/hotel-card"
import { HotelFilterSidebar } from "@/components/hotel-filter-sidebar"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { SlidersHorizontal } from "lucide-react"
import { useLanguage } from "@/context/language-context"

interface Hotel {
    id: number
    name: string
    address: string
    city: string
    rating: number
    price_per_night: number
    image_url: string
    amenities: string[]
}

export default function HotelsPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <HotelsContent />
        </React.Suspense>
    )
}

function HotelsContent() {
    const searchParams = useSearchParams()
    const { t } = useLanguage()
    const [hotels, setHotels] = useState<Hotel[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHotels = async () => {
            setLoading(true)
            try {
                const params = {
                    city: searchParams.get("city"),
                    check_in: searchParams.get("checkIn"),
                    check_out: searchParams.get("checkOut"),
                    guests: searchParams.get("guests"),
                    min_price: searchParams.get("min_price"),
                    max_price: searchParams.get("max_price"),
                    rating: searchParams.get("rating"),
                }
                const response = await api.get('/hotels/search', { params })
                const data = Array.isArray(response.data) ? response.data : response.data.data || []

                if (data.length === 0) {
                    setHotels([])
                } else {
                    setHotels(data)
                }

            } catch (error) {
                console.error("Failed to fetch hotels", error)
                setHotels([])
            } finally {
                setLoading(false)
            }
        }

        fetchHotels()
    }, [searchParams])

    return (
        <PublicLayout>
            {/* Compact Search Header */}
            <div className="bg-slate-900 pt-24 pb-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-5xl mx-auto transform scale-90 origin-top">
                        <SearchWidget defaultTab="hotels" />
                    </div>
                </div>
            </div>

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <aside className="w-full lg:w-80 shrink-0">
                            <div className="sticky top-24">
                                <HotelFilterSidebar />
                            </div>
                        </aside>

                        {/* Results */}
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.hotels.title}</h2>
                                    <p className="text-slate-500">{t.flights.showing_results} <span className="font-bold text-primary">{hotels.length}</span> {t.flights.results}</p>
                                </div>

                                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-medium text-slate-500 pl-3">{t.flights.sort_by}:</span>
                                    <select className="text-sm border-none bg-transparent font-bold text-slate-900 dark:text-white focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8">
                                        <option>{t.hotels.recommended}</option>
                                        <option>{t.hotels.price_low}</option>
                                        <option>{t.hotels.price_high}</option>
                                        <option>{t.hotels.top_rated}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {loading ? (
                                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 py-8">
                                        <AirplaneLoader text={t.loading.hotels} />
                                    </div>
                                ) : hotels.length > 0 ? (
                                    hotels.map((hotel) => (
                                        <HotelCard
                                            key={hotel.id}
                                            id={hotel.id}
                                            name={hotel.name}
                                            location={hotel.city} // Using city as location for now
                                            rating={hotel.rating}
                                            price={hotel.price_per_night}
                                            image={hotel.image_url}
                                            amenities={hotel.amenities || []}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <SlidersHorizontal className="w-10 h-10 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hotels found</h3>
                                        <p className="text-slate-500 max-w-md mx-auto">
                                            We couldn't find any hotels matching your search criteria. Try adjusting your dates or filters.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-6"
                                            onClick={() => window.location.href = '/hotels'}
                                        >
                                            Search Again
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
}
