"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"

import { PublicLayout } from "@/components/layouts/public-layout"
import { SearchWidget } from "@/components/search-widget"
import { FlightCard } from "@/components/flight-card"
import { FilterSidebar } from "@/components/filter-sidebar"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { ArrowUpDown, SlidersHorizontal } from "lucide-react"

interface Flight {
    id: number;
    flight_number: string;
    airline: { name: string };
    origin_airport: { code: string; city: string };
    destination_airport: { code: string; city: string };
    departure_time: string;
    arrival_time: string;
    base_price: number;
}

export default function FlightsPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <FlightsContent />
        </React.Suspense>
    )
}

import { useLanguage } from "@/context/language-context"

function FlightsContent() {
    const searchParams = useSearchParams()
    const { t } = useLanguage()
    const [flights, setFlights] = useState<Flight[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchFlights = async () => {
            setLoading(true)
            try {
                const params = {
                    from: searchParams.get("from"),
                    to: searchParams.get("to"),
                    date: searchParams.get("date"),
                    min_price: searchParams.get("min_price"),
                    max_price: searchParams.get("max_price"),
                    airline_id: searchParams.get("airline_id"),
                }
                const response = await api.get('/flights/search', { params })
                setFlights(Array.isArray(response.data) ? response.data : response.data.data || [])
            } catch (error) {
                console.error("Failed to fetch flights", error)
            } finally {
                setLoading(false)
            }
        }

        if (searchParams.get("from")) {
            fetchFlights()
        } else {
            setLoading(false)
        }
    }, [searchParams])

    return (
        <PublicLayout>
            {/* Compact Search Header */}
            <div className="bg-slate-900 pt-24 pb-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556388169-db19adc96088?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-5xl mx-auto transform scale-90 origin-top">
                        <SearchWidget />
                    </div>
                </div>
            </div>

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <aside className="w-full lg:w-80 shrink-0">
                            <div className="sticky top-24">
                                <FilterSidebar />
                            </div>
                        </aside>

                        {/* Results */}
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Select Flights</h2>
                                    <p className="text-slate-500">Showing <span className="font-bold text-primary">{flights.length}</span> results</p>
                                </div>

                                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-medium text-slate-500 pl-3">Sort by:</span>
                                    <select className="text-sm border-none bg-transparent font-bold text-slate-900 dark:text-white focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8">
                                        <option>Cheapest First</option>
                                        <option>Fastest First</option>
                                        <option>Best Value</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="p-8 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                                                <div className="flex items-center gap-6 w-full md:w-1/3">
                                                    <Skeleton className="w-16 h-16 rounded-2xl" />
                                                    <div className="space-y-3">
                                                        <Skeleton className="h-5 w-32" />
                                                        <Skeleton className="h-4 w-20" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 w-full space-y-4">
                                                    <div className="flex justify-between">
                                                        <Skeleton className="h-8 w-20" />
                                                        <Skeleton className="h-8 w-20" />
                                                    </div>
                                                    <Skeleton className="h-2 w-full rounded-full" />
                                                    <div className="flex justify-center">
                                                        <Skeleton className="h-4 w-24" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-3 w-full md:w-1/4">
                                                    <Skeleton className="h-10 w-32" />
                                                    <Skeleton className="h-12 w-full rounded-xl" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : flights.length > 0 ? (
                                    flights.map((flight) => (
                                        <FlightCard
                                            key={flight.id}
                                            id={flight.id}
                                            price={`$${flight.base_price}`}
                                            stops={0}
                                            totalDuration="2h 30m"
                                            segments={[
                                                {
                                                    airline: flight.airline?.name || 'Airline',
                                                    flightNumber: flight.flight_number,
                                                    origin: flight.origin_airport?.code || 'ORG',
                                                    destination: flight.destination_airport?.code || 'DST',
                                                    departureTime: new Date(flight.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                                    arrivalTime: new Date(flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                                    duration: "2h 30m"
                                                }
                                            ]}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <SlidersHorizontal className="w-10 h-10 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No flights found</h3>
                                        <p className="text-slate-500 max-w-md mx-auto">
                                            We couldn't find any flights matching your search criteria. Try adjusting your dates or filters.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-6"
                                            onClick={() => window.location.href = '/'}
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

