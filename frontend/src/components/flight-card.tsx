"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plane, Clock, ChevronDown, Luggage, Utensils, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/context/language-context"

interface FlightSegment {
    departureTime: string
    arrivalTime: string
    origin: string
    destination: string
    duration: string
    airline: string
    flightNumber: string
    airlineLogo?: string
}

interface FlightCardProps {
    id: number | string
    price: string
    segments: FlightSegment[]
    stops: number
    totalDuration: string
    baggageAllowance?: number
    cabinBaggage?: number
    mealsIncluded?: boolean
    refundable?: boolean
    seatsLeft?: number
    supplierCode?: string
    referenceId?: string
    tripType?: 'one-way' | 'round-trip' | 'open-return' | 'multi-city'
    returnSegments?: FlightSegment[]
    returnStops?: number
    returnDuration?: string
    departureDate?: string
    returnDate?: string
}

export function FlightCard({
    id,
    price,
    segments,
    stops,
    totalDuration,
    baggageAllowance = 23,
    cabinBaggage = 7,
    mealsIncluded = false,
    refundable = false,
    seatsLeft,
    supplierCode,
    referenceId,
    tripType = 'one-way',
    returnSegments,
    returnStops = 0,
    returnDuration,
    departureDate,
    returnDate
}: FlightCardProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t, dir } = useLanguage()
    const [expanded, setExpanded] = React.useState(false)

    // For demo, just use the first segment for the main view
    const mainSegment = segments[0]
    const lastSegment = segments[segments.length - 1]

    // Return leg info
    const returnMainSegment = returnSegments?.[0]
    const returnLastSegment = returnSegments?.[returnSegments.length - 1]

    const handleSelectFlight = () => {
        // Navigate to package selection page with supplier info if available
        const adults = searchParams.get('adults') || '1'
        const children = searchParams.get('children') || '0'
        const infants = searchParams.get('infants') || '0'

        // For database supplier, use the referenceId as the flight ID
        // For external suppliers, use the full id with supplier info
        const flightIdForRoute = supplierCode === 'database' && referenceId ? referenceId : id

        let url = `/${(typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'en')}/flights/${flightIdForRoute}/packages?adults=${adults}&children=${children}&infants=${infants}`

        // Add supplier info for external offers (not database)
        if (supplierCode && supplierCode !== 'database' && referenceId) {
            url += `&supplier=${supplierCode}&ref=${referenceId}`
        }

        router.push(url)
    }

    return (
        <Card className="mb-4 overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 group">
            <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                    {/* Airline Info */}
                    <div className="flex items-center gap-4 w-full md:w-1/4">
                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Plane className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">{mainSegment.airline}</h4>
                            <Badge variant="outline" className="text-[10px] font-normal text-slate-500 border-slate-200 dark:border-slate-700">
                                {mainSegment.flightNumber}
                            </Badge>
                        </div>
                    </div>

                    {/* Flight Route */}
                    <div className="flex-1 flex items-center justify-center gap-8 w-full">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{mainSegment.departureTime}</p>
                            <p className="text-sm font-medium text-slate-500">{mainSegment.origin}</p>
                        </div>

                        <div className="flex flex-col items-center w-full max-w-[180px]">
                            <p className="text-xs font-medium text-slate-400 mb-2">{totalDuration}</p>
                            <div className="relative w-full flex items-center">
                                <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                                <div className="absolute inset-0 flex justify-center">
                                    <Plane className="w-4 h-4 text-indigo-500 rotate-90 bg-white dark:bg-slate-900 px-0.5" />
                                </div>
                            </div>
                            <div className="mt-2">
                                {stops === 0 ? (
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 border-none">
                                        Non-stop
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 border-none">
                                        {stops} {stops === 1 ? 'Stop' : 'Stops'}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{lastSegment.arrivalTime}</p>
                            <p className="text-sm font-medium text-slate-500">{lastSegment.destination}</p>
                        </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex flex-col items-end gap-3 w-full md:w-1/4 pl-4 border-l border-slate-100 dark:border-slate-800">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                {dir === 'rtl' ? 'السعر الإجمالي' : 'Total Price'}
                            </p>
                            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{price}</p>
                            <div className="flex items-center justify-end gap-2 mt-1">
                                {refundable && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">
                                        {dir === 'rtl' ? 'قابل للاسترداد' : 'Refundable'}
                                    </Badge>
                                )}
                                {seatsLeft !== undefined && seatsLeft <= 5 && (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]">
                                        {seatsLeft} {dir === 'rtl' ? 'مقاعد متبقية' : 'seats left'}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/20 transition-all" onClick={handleSelectFlight}>
                            {t.flights.select}
                        </Button>

                        {/* Baggage Info */}
                        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                                <Luggage className="w-3.5 h-3.5" />
                                <span>{baggageAllowance}kg</span>
                            </div>
                            {mealsIncluded && (
                                <div className="flex items-center gap-1">
                                    <Utensils className="w-3.5 h-3.5" />
                                    <span>{dir === 'rtl' ? 'وجبة' : 'Meal'}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            {expanded ? 'Hide Details' : 'View Details'}
                            <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform duration-300", expanded && "rotate-180")} />
                        </button>
                    </div>
                </div>

                {/* Trip Type Badge and Date Info */}
                {tripType && tripType !== 'one-way' && (
                    <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
                            {tripType === 'round-trip' && (dir === 'rtl' ? 'ذهاب وعودة' : 'Round Trip')}
                            {tripType === 'open-return' && (dir === 'rtl' ? 'عودة مفتوحة' : 'Open Return')}
                            {tripType === 'multi-city' && (dir === 'rtl' ? 'وجهات متعددة' : 'Multi-City')}
                        </Badge>
                        {departureDate && (
                            <span className="text-slate-500">
                                <span className="font-medium">{dir === 'rtl' ? 'المغادرة:' : 'Dep:'}</span> {departureDate}
                            </span>
                        )}
                        {returnDate && tripType === 'round-trip' && (
                            <span className="text-slate-500">
                                <span className="font-medium">{dir === 'rtl' ? 'العودة:' : 'Return:'}</span> {returnDate}
                            </span>
                        )}
                    </div>
                )}

                {/* Return Flight Section (for round-trip) */}
                {tripType === 'round-trip' && returnMainSegment && returnLastSegment && (
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]">
                                {dir === 'rtl' ? 'رحلة العودة' : 'Return Flight'}
                            </Badge>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            {/* Return Airline */}
                            <div className="flex items-center gap-3 w-full md:w-1/4">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                                    <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400 rotate-180" />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-slate-900 dark:text-white text-sm">{returnMainSegment.airline}</h5>
                                    <span className="text-[10px] text-slate-500">{returnMainSegment.flightNumber}</span>
                                </div>
                            </div>

                            {/* Return Route */}
                            <div className="flex-1 flex items-center justify-center gap-6 w-full">
                                <div className="text-center">
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{returnMainSegment.departureTime}</p>
                                    <p className="text-xs font-medium text-slate-500">{returnMainSegment.origin}</p>
                                </div>

                                <div className="flex flex-col items-center w-full max-w-[140px]">
                                    <p className="text-[10px] font-medium text-slate-400 mb-1">{returnDuration}</p>
                                    <div className="relative w-full flex items-center">
                                        <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                                        <div className="absolute inset-0 flex justify-center">
                                            <Plane className="w-3 h-3 text-blue-500 rotate-90 bg-slate-50 dark:bg-slate-800 px-0.5" />
                                        </div>
                                    </div>
                                    <div className="mt-1">
                                        {returnStops === 0 ? (
                                            <span className="text-[10px] text-emerald-600">Non-stop</span>
                                        ) : (
                                            <span className="text-[10px] text-amber-600">{returnStops} {returnStops === 1 ? 'Stop' : 'Stops'}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{returnLastSegment.arrivalTime}</p>
                                    <p className="text-xs font-medium text-slate-500">{returnLastSegment.destination}</p>
                                </div>
                            </div>

                            {/* Spacer for alignment */}
                            <div className="w-full md:w-1/4" />
                        </div>
                    </div>
                )}
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800"
                    >
                        <div className="p-6">
                            <h4 className="font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                                <Clock className="w-4 h-4 text-indigo-500" />
                                Flight Itinerary
                            </h4>
                            <div className="space-y-8">
                                {segments.map((segment, index) => (
                                    <div key={index} className="relative">
                                        {/* Continuous vertical line */}
                                        <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500 via-slate-300 to-teal-500" />

                                        {/* Departure */}
                                        <div className="relative flex items-start gap-5 mb-6">
                                            <div className="relative z-10 w-4 h-4 bg-indigo-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md shrink-0" />
                                            <div className="flex-1 min-w-0 -mt-0.5">
                                                <div className="flex items-baseline gap-3 mb-1">
                                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{segment.departureTime}</p>
                                                    <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{segment.origin}</p>
                                                </div>
                                                <p className="text-sm text-slate-500">Departing from Terminal 1</p>
                                            </div>
                                        </div>

                                        {/* Flight Info Card */}
                                        <div className="ml-9 mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
                                                        <Plane className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 dark:text-white">{segment.airline}</p>
                                                        <p className="text-sm text-slate-500">{segment.flightNumber} • Boeing 787-9 Dreamliner</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 text-slate-500">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full">
                                                        <Wifi className="w-3.5 h-3.5" /> Wi-Fi
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full">
                                                        <Utensils className="w-3.5 h-3.5" /> Meal
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full">
                                                        <Luggage className="w-3.5 h-3.5" /> {baggageAllowance}kg
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Arrival */}
                                        <div className="relative flex items-start gap-5">
                                            <div className="relative z-10 w-4 h-4 bg-teal-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md shrink-0" />
                                            <div className="flex-1 min-w-0 -mt-0.5">
                                                <div className="flex items-baseline gap-3 mb-1">
                                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{segment.arrivalTime}</p>
                                                    <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{segment.destination}</p>
                                                </div>
                                                <p className="text-sm text-slate-500">Arriving at Terminal 3</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    )
}
