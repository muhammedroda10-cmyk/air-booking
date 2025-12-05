"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { PublicLayout } from "@/components/layouts/public-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"
import api from "@/lib/api"
import {
    Plane, Clock, Luggage, UtensilsCrossed, Armchair, Crown,
    Coffee, RefreshCw, Check, X, ArrowRight, Briefcase
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FlightPackage {
    id: string | number
    name: string
    display_name: string
    baggage_allowance: number
    cabin_baggage: number
    meals_included: boolean
    extra_legroom: boolean
    priority_boarding: boolean
    lounge_access: boolean
    flexible_rebooking: boolean
    price_modifier: number
    total_price: number
    description: string
    features: {
        icon: string
        label: string
        included: boolean
    }[]
}

interface Flight {
    id: number
    flight_number: string
    airline: { id: number; name: string }
    origin_airport: { code: string; city: string; name: string }
    destination_airport: { code: string; city: string; name: string }
    departure_time: string
    arrival_time: string
    base_price: number
    default_baggage: number
}

export default function PackageSelectionPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const flightId = params.id as string

    const [flight, setFlight] = React.useState<Flight | null>(null)
    const [packages, setPackages] = React.useState<FlightPackage[]>([])
    const [selectedPackage, setSelectedPackage] = React.useState<string | number | null>(null)
    const [loading, setLoading] = React.useState(true)

    const adults = searchParams.get('adults') || '1'
    const children = searchParams.get('children') || '0'
    const infants = searchParams.get('infants') || '0'

    React.useEffect(() => {
        const fetchPackages = async () => {
            try {
                const response = await api.get(`/flights/${flightId}/packages`)
                setFlight(response.data.flight)
                setPackages(response.data.packages)
                // Select the first (cheapest) package by default
                if (response.data.packages.length > 0) {
                    setSelectedPackage(response.data.packages[0].id)
                }
            } catch (error) {
                console.error('Failed to fetch packages', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPackages()
    }, [flightId])

    const handleContinue = () => {
        if (selectedPackage && flight) {
            router.push(`/bookings/create?flight_id=${flight.id}&package=${selectedPackage}&adults=${adults}&children=${children}&infants=${infants}`)
        }
    }

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    }

    const getFeatureIcon = (iconName: string) => {
        const icons: Record<string, React.ReactNode> = {
            luggage: <Luggage className="w-4 h-4" />,
            briefcase: <Briefcase className="w-4 h-4" />,
            utensils: <UtensilsCrossed className="w-4 h-4" />,
            armchair: <Armchair className="w-4 h-4" />,
            crown: <Crown className="w-4 h-4" />,
            coffee: <Coffee className="w-4 h-4" />,
            refresh: <RefreshCw className="w-4 h-4" />,
        }
        return icons[iconName] || <Check className="w-4 h-4" />
    }

    if (loading) {
        return (
            <PublicLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            </PublicLayout>
        )
    }

    if (!flight) {
        return (
            <PublicLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Flight Not Found</h2>
                        <p className="text-slate-500 mb-4">The flight you're looking for doesn't exist.</p>
                        <Button onClick={() => router.push('/flights')}>Back to Search</Button>
                    </div>
                </div>
            </PublicLayout>
        )
    }

    return (
        <PublicLayout>
            <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-12">
                {/* Header */}
                <div className="bg-slate-900 text-white py-8 pt-24">
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl font-bold mb-2">Choose Your Package</h1>
                        <p className="text-slate-300">Select the fare that best fits your travel needs</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-4">
                    {/* Flight Summary Card */}
                    <Card className="mb-8 border-none shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                                        <Plane className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{flight.airline?.name}</p>
                                        <p className="text-sm text-slate-500">{flight.flight_number}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{formatTime(flight.departure_time)}</p>
                                        <p className="text-sm text-slate-500">{flight.origin_airport?.code}</p>
                                        <p className="text-xs text-slate-400">{flight.origin_airport?.city}</p>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <ArrowRight className="w-6 h-6 text-slate-400" />
                                        <p className="text-xs text-slate-400 mt-1">{formatDate(flight.departure_time)}</p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{formatTime(flight.arrival_time)}</p>
                                        <p className="text-sm text-slate-500">{flight.destination_airport?.code}</p>
                                        <p className="text-xs text-slate-400">{flight.destination_airport?.city}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs text-slate-400">Base fare from</p>
                                    <p className="text-2xl font-bold text-indigo-600">${flight.base_price}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Package Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {packages.map((pkg, index) => (
                            <motion.div
                                key={pkg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card
                                    className={cn(
                                        "relative cursor-pointer transition-all duration-300 overflow-hidden h-full",
                                        selectedPackage === pkg.id
                                            ? "border-2 border-indigo-500 shadow-xl shadow-indigo-500/20"
                                            : "border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg"
                                    )}
                                    onClick={() => setSelectedPackage(pkg.id)}
                                >
                                    {/* Popular Badge */}
                                    {pkg.name === 'premium_economy' && (
                                        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                            POPULAR
                                        </div>
                                    )}
                                    {pkg.name === 'business' && (
                                        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                            BEST VALUE
                                        </div>
                                    )}

                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center justify-between">
                                            <span className="text-xl">{pkg.display_name}</span>
                                            {selectedPackage === pkg.id && (
                                                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </CardTitle>
                                        <p className="text-sm text-slate-500">{pkg.description}</p>
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        {/* Price */}
                                        <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                                ${pkg.total_price}
                                            </p>
                                            <p className="text-xs text-slate-500">per person</p>
                                            {pkg.price_modifier > 0 && (
                                                <Badge variant="secondary" className="mt-2">
                                                    +${pkg.price_modifier} from base
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Features */}
                                        <div className="space-y-3">
                                            {pkg.features.map((feature, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "flex items-center gap-3 text-sm",
                                                        feature.included ? "text-slate-700 dark:text-slate-300" : "text-slate-400"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                                        feature.included
                                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                                    )}>
                                                        {feature.included
                                                            ? getFeatureIcon(feature.icon)
                                                            : <X className="w-4 h-4" />
                                                        }
                                                    </div>
                                                    <span className={cn(!feature.included && "line-through")}>
                                                        {feature.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Continue Button */}
                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            className="px-12"
                            disabled={!selectedPackage}
                            onClick={handleContinue}
                        >
                            Continue to Passenger Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
}
