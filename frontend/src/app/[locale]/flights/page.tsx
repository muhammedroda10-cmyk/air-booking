"use client"

import * as React from "react"
import { AirplaneLoader } from "@/components/ui/loading"

import { PublicLayout } from "@/components/layouts/public-layout"
import { SearchWidget } from "@/components/search-widget"
import { FlightCard } from "@/components/flight-card"
import { FilterSidebar } from "@/components/filter-sidebar"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { SlidersHorizontal } from "lucide-react"
import { useLanguage } from "@/context/language-context"

// Normalized flight offer from supplier
interface FlightOffer {
    id: string;
    supplier_code: string;
    reference_id: string;
    price: {
        total: number;
        base_fare: number;
        taxes: number;
        currency: string;
        currency_symbol: string;
        formatted: string;
    };
    legs: Array<{
        departure: {
            city: string;
            airport_code: string;
            airport_name: string;
            date_time: string;
            time: string;
        };
        arrival: {
            city: string;
            airport_code: string;
            airport_name: string;
            date_time: string;
            time: string;
        };
        duration: number;
        duration_formatted: string;
        stops: number;
        cabin: string;
        airline: {
            id: number;
            code: string;
            name: string;
            logo: string | null;
        };
        flight_number: string;
        segments: Array<{
            departure: {
                city: string;
                airport_code: string;
                time: string;
                date_time: string;
            };
            arrival: {
                city: string;
                airport_code: string;
                time: string;
                date_time: string;
            };
            airline: {
                id: number;
                code: string;
                name: string;
            };
            flight_number: string;
            duration: number;
            duration_formatted: string;
            luggage: string | null;
            cabin: string;
        }>;
    }>;
    validating_airline: {
        id: number;
        code: string;
        name: string;
        logo: string | null;
    };
    seats_available: number;
    refundable: boolean;
    valid_until: string;
    passengers: {
        adults: number;
        children: number;
        infants: number;
    };
}

export default function FlightsPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <FlightsContent />
        </React.Suspense>
    )
}

function FlightsContent() {
    const searchParams = useSearchParams()
    const { t, dir } = useLanguage()
    const [flights, setFlights] = useState<FlightOffer[]>([])
    const [availableAirlines, setAvailableAirlines] = useState<{ id: number; name: string; code: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchFlights = async () => {
            setLoading(true)
            setError(null)

            try {
                const tripType = searchParams.get("type") || "one-way"

                // Handle multi-city separately (uses from0, to0, date0, from1, to1, date1, etc.)
                const isMultiCity = tripType === "multi-city"

                let from: string | null
                let to: string | null
                let date: string | null

                if (isMultiCity) {
                    // For multi-city, get the first leg
                    from = searchParams.get("from0")
                    to = searchParams.get("to0")
                    date = searchParams.get("date0")
                } else {
                    // Standard one-way/round-trip parameters
                    from = searchParams.get("from")
                    to = searchParams.get("to")
                    date = searchParams.get("date")
                }

                if (!from || !to || !date) {
                    setLoading(false)
                    return
                }

                // Call the hybrid search endpoint (searches all suppliers including database)
                const params: Record<string, any> = {
                    from,
                    to,
                    date,
                    return_date: isMultiCity ? null : searchParams.get("returnDate"),
                    adults: searchParams.get("adults") || "1",
                    children: searchParams.get("children") || "0",
                    infants: searchParams.get("infants") || "0",
                    cabin: searchParams.get("cabin") || "economy",
                    trip_type: tripType === "round-trip" ? "roundTrip" : "oneWay",
                    // Filters
                    min_price: searchParams.get("min_price"),
                    max_price: searchParams.get("max_price"),
                    max_stops: searchParams.get("max_stops"),
                }

                // For multi-city, add additional legs info
                if (isMultiCity) {
                    // Check for additional legs
                    const legs = []
                    let legIndex = 0
                    while (searchParams.get(`from${legIndex}`)) {
                        legs.push({
                            from: searchParams.get(`from${legIndex}`),
                            to: searchParams.get(`to${legIndex}`),
                            date: searchParams.get(`date${legIndex}`),
                        })
                        legIndex++
                    }
                    params.multi_city_legs = JSON.stringify(legs)
                    params.trip_type = "multiCity"
                }

                const response = await api.get('/flights/search-external', { params })

                if (response.data.status) {
                    const fetchedFlights = response.data.data || []
                    setFlights(fetchedFlights)

                    // Extract unique airlines for filter
                    const airlinesMap = new Map()
                    fetchedFlights.forEach((offer: FlightOffer) => {
                        if (offer.validating_airline) {
                            airlinesMap.set(offer.validating_airline.id, {
                                id: offer.validating_airline.id,
                                name: offer.validating_airline.name,
                                code: offer.validating_airline.code,
                            })
                        }
                    })
                    setAvailableAirlines(Array.from(airlinesMap.values()))
                } else {
                    setError(response.data.message || 'Failed to search flights')
                }
            } catch (error: any) {
                console.error("Failed to fetch flights", error)
                setError(error.response?.data?.message || 'Failed to search flights. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        // Check if we have search parameters (standard or multi-city)
        const hasStandardParams = searchParams.get("from") && searchParams.get("to") && searchParams.get("date")
        const hasMultiCityParams = searchParams.get("type") === "multi-city" &&
            searchParams.get("from0") && searchParams.get("to0") && searchParams.get("date0")

        if (hasStandardParams || hasMultiCityParams) {
            fetchFlights()
        } else {
            setLoading(false)
        }
    }, [searchParams])

    // Sort flights
    const sortedFlights = React.useMemo(() => {
        const sorted = [...flights]
        switch (sortBy) {
            case 'price':
                sorted.sort((a, b) => a.price.total - b.price.total)
                break
            case 'duration':
                sorted.sort((a, b) => (a.legs[0]?.duration || 0) - (b.legs[0]?.duration || 0))
                break
            case 'departure':
                sorted.sort((a, b) => {
                    const aTime = a.legs[0]?.departure?.date_time || ''
                    const bTime = b.legs[0]?.departure?.date_time || ''
                    return aTime.localeCompare(bTime)
                })
                break
        }
        return sorted
    }, [flights, sortBy])

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
                                <FilterSidebar availableAirlines={availableAirlines} />
                            </div>
                        </aside>

                        {/* Results */}
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.flights.title}</h2>
                                    <p className="text-slate-500">
                                        {t.flights.showing_results}{' '}
                                        <span className="font-bold text-primary">{flights.length}</span>{' '}
                                        {t.flights.results}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-medium text-slate-500 pl-3">{t.flights.sort_by}:</span>
                                    <select
                                        className="text-sm border-none bg-transparent font-bold text-slate-900 dark:text-white focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as 'price' | 'duration' | 'departure')}
                                    >
                                        <option value="price">{t.flights.cheapest}</option>
                                        <option value="duration">{t.flights.fastest}</option>
                                        <option value="departure">{dir === 'rtl' ? 'وقت المغادرة' : 'Departure Time'}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {loading ? (
                                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 py-8">
                                        <AirplaneLoader text={t.loading.flights} />
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <SlidersHorizontal className="w-10 h-10 text-red-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                            {dir === 'rtl' ? 'حدث خطأ' : 'Something went wrong'}
                                        </h3>
                                        <p className="text-slate-500 max-w-md mx-auto">{error}</p>
                                        <Button
                                            variant="outline"
                                            className="mt-6"
                                            onClick={() => window.location.reload()}
                                        >
                                            {dir === 'rtl' ? 'حاول مرة أخرى' : 'Try Again'}
                                        </Button>
                                    </div>
                                ) : sortedFlights.length > 0 ? (
                                    sortedFlights.map((offer) => {
                                        const firstLeg = offer.legs[0]
                                        const returnLeg = offer.legs[1] // Return leg for round-trip
                                        if (!firstLeg) return null

                                        // Get trip type from URL
                                        const tripType = (searchParams.get("type") as 'one-way' | 'round-trip' | 'open-return' | 'multi-city') || 'one-way'
                                        const departureDate = searchParams.get("date") || undefined
                                        const returnDate = searchParams.get("returnDate") || undefined

                                        // Build segments for display
                                        const segments = firstLeg.segments.map((seg) => ({
                                            airline: seg.airline?.name || offer.validating_airline?.name || 'Airline',
                                            airlineLogo: offer.validating_airline?.logo || undefined,
                                            flightNumber: seg.flight_number,
                                            origin: seg.departure.airport_code,
                                            destination: seg.arrival.airport_code,
                                            departureTime: seg.departure.time,
                                            arrivalTime: seg.arrival.time,
                                            duration: seg.duration_formatted || `${Math.floor(seg.duration / 60)}h ${seg.duration % 60}m`,
                                        }))

                                        // Build return segments if available
                                        const returnSegments = returnLeg?.segments.map((seg) => ({
                                            airline: seg.airline?.name || offer.validating_airline?.name || 'Airline',
                                            airlineLogo: offer.validating_airline?.logo || undefined,
                                            flightNumber: seg.flight_number,
                                            origin: seg.departure.airport_code,
                                            destination: seg.arrival.airport_code,
                                            departureTime: seg.departure.time,
                                            arrivalTime: seg.arrival.time,
                                            duration: seg.duration_formatted || `${Math.floor(seg.duration / 60)}h ${seg.duration % 60}m`,
                                        }))

                                        // Get luggage from first segment
                                        const luggage = firstLeg.segments[0]?.luggage
                                        const baggageKg = luggage ? parseInt(luggage) || 23 : 23

                                        return (
                                            <FlightCard
                                                key={offer.id}
                                                id={offer.id}
                                                price={offer.price.formatted}
                                                stops={firstLeg.stops}
                                                totalDuration={firstLeg.duration_formatted}
                                                baggageAllowance={baggageKg}
                                                cabinBaggage={7}
                                                segments={segments}
                                                refundable={offer.refundable}
                                                seatsLeft={offer.seats_available}
                                                supplierCode={offer.supplier_code}
                                                referenceId={offer.reference_id}
                                                tripType={tripType}
                                                departureDate={departureDate}
                                                returnDate={returnDate}
                                                returnSegments={returnSegments}
                                                returnStops={returnLeg?.stops || 0}
                                                returnDuration={returnLeg?.duration_formatted}
                                            />
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <SlidersHorizontal className="w-10 h-10 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                            {dir === 'rtl' ? 'لا توجد رحلات' : 'No flights found'}
                                        </h3>
                                        <p className="text-slate-500 max-w-md mx-auto">
                                            {dir === 'rtl'
                                                ? 'لم نتمكن من العثور على رحلات تطابق معايير البحث. حاول تعديل التواريخ أو الفلاتر.'
                                                : "We couldn't find any flights matching your search criteria. Try adjusting your dates or filters."
                                            }
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-6"
                                            onClick={() => window.location.href = '/'}
                                        >
                                            {dir === 'rtl' ? 'بحث مرة أخرى' : 'Search Again'}
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
