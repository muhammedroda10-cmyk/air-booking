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
}

interface FlightCardProps {
    id: number
    price: string
    segments: FlightSegment[]
    stops: number
    totalDuration: string
    baggageAllowance?: number
    cabinBaggage?: number
    mealsIncluded?: boolean
}

export function FlightCard({ id, price, segments, stops, totalDuration, baggageAllowance = 23, cabinBaggage = 7, mealsIncluded = false }: FlightCardProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useLanguage()
    const [expanded, setExpanded] = React.useState(false)

    // For demo, just use the first segment for the main view
    const mainSegment = segments[0]
    const lastSegment = segments[segments.length - 1]

    const handleSelectFlight = () => {
        // Navigate to package selection page
        const adults = searchParams.get('adults') || '1'
        const children = searchParams.get('children') || '0'
        const infants = searchParams.get('infants') || '0'
        router.push(`/flights/${id}/packages?adults=${adults}&children=${children}&infants=${infants}`)
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
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Price</p>
                            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{price}</p>
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
                                    <span>Meal</span>
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
                                    <div key={index} className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-700 ml-3 rtl:mr-3 rtl:ml-0 rtl:pl-0 rtl:pr-8 rtl:border-l-0 rtl:border-r-2 last:border-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-full rtl:-right-[9px] rtl:left-auto" />

                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-3 mb-1">
                                                <p className="text-xl font-bold text-slate-900 dark:text-white">{segment.departureTime}</p>
                                                <p className="text-base font-medium text-slate-600 dark:text-slate-400">{segment.origin}</p>
                                            </div>
                                            <p className="text-sm text-slate-500">Departing from Terminal 1</p>
                                        </div>

                                        <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                                    <Plane className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{segment.airline}</p>
                                                    <p className="text-sm text-slate-500">{segment.flightNumber} • Boeing 787-9 Dreamliner</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-6 text-slate-500">
                                                <div className="flex items-center gap-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full">
                                                    <Wifi className="w-3.5 h-3.5" /> Wi-Fi
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full">
                                                    <Utensils className="w-3.5 h-3.5" /> Meal
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full">
                                                    <Luggage className="w-3.5 h-3.5" /> 23kg
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full border-2 border-white dark:border-slate-900 rtl:-right-[9px] rtl:left-auto" />
                                            <div className="flex items-baseline gap-3 mb-1">
                                                <p className="text-xl font-bold text-slate-900 dark:text-white">{segment.arrivalTime}</p>
                                                <p className="text-base font-medium text-slate-600 dark:text-slate-400">{segment.destination}</p>
                                            </div>
                                            <p className="text-sm text-slate-500">Arriving at Terminal 3</p>
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
