"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plane, MapPin, Search, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import api from "@/lib/api"

interface Airport {
    id: number;
    code: string;
    city: string;
    name: string;
}

import { useLanguage } from "@/context/language-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Combobox } from "@/components/ui/combobox"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

export function SearchWidget({ defaultTab = "flights" }: { defaultTab?: string }) {
    const router = useRouter()
    const { t } = useLanguage()
    const [activeTab, setActiveTab] = React.useState(defaultTab)
    const [tripType, setTripType] = React.useState("round-trip")
    const [airports, setAirports] = React.useState<Airport[]>([])
    const [from, setFrom] = React.useState("")
    const [to, setTo] = React.useState("")
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
    const [singleDate, setSingleDate] = React.useState<Date | undefined>()
    const [travelers, setTravelers] = React.useState(1)

    // Hotel State
    const [city, setCity] = React.useState("")
    const [checkIn, setCheckIn] = React.useState("")
    const [checkOut, setCheckOut] = React.useState("")

    React.useEffect(() => {
        const fetchAirports = async () => {
            try {
                const response = await api.get('/airports')
                setAirports(Array.isArray(response.data) ? response.data : response.data.data || [])
            } catch (error) {
                console.error("Failed to fetch airports", error)
            }
        }
        fetchAirports()
    }, [])

    const handleSearch = () => {
        const params = new URLSearchParams({
            from,
            to,
            travelers: travelers.toString()
        })

        if (tripType === "round-trip" && dateRange?.from) {
            params.append("date", format(dateRange.from, "yyyy-MM-dd"))
            if (dateRange.to) {
                params.append("returnDate", format(dateRange.to, "yyyy-MM-dd"))
            }
        } else if (tripType === "one-way" && singleDate) {
            params.append("date", format(singleDate, "yyyy-MM-dd"))
        }

        router.push(`/flights?${params.toString()}`)
    }

    const airportItems = airports.map(a => ({
        value: a.code,
        label: `${a.city} (${a.code})`,
        subLabel: a.name
    }))

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Service Tabs */}
            <div className="flex justify-center mb-8">
                <div className="bg-white/10 backdrop-blur-md p-1 rounded-full flex gap-1">
                    <button
                        onClick={() => setActiveTab("flights")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                            activeTab === "flights"
                                ? "bg-white text-primary shadow-lg"
                                : "text-white hover:bg-white/10"
                        )}
                    >
                        <Plane className="w-4 h-4" />
                        Flights
                    </button>
                    <button
                        onClick={() => setActiveTab("hotels")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                            activeTab === "hotels"
                                ? "bg-white text-primary shadow-lg"
                                : "text-white hover:bg-white/10"
                        )}
                    >
                        <MapPin className="w-4 h-4" />
                        Hotels
                    </button>
                    <button
                        onClick={() => setActiveTab("packages")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                            activeTab === "packages"
                                ? "bg-white text-primary shadow-lg"
                                : "text-white hover:bg-white/10"
                        )}
                    >
                        <Search className="w-4 h-4" />
                        Flights + Hotels
                    </button>
                </div>
            </div>

            <Card className="p-2 shadow-2xl border-0 bg-white/20 backdrop-blur-xl rounded-[2rem]">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[1.5rem] p-6 md:p-8">
                    {activeTab === "flights" ? (
                        <div className="space-y-6">
                            {/* Trip Type Toggle */}
                            <div className="flex gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tripType"
                                        value="round-trip"
                                        checked={tripType === "round-trip"}
                                        onChange={(e) => setTripType(e.target.value)}
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">Round Trip</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tripType"
                                        value="one-way"
                                        checked={tripType === "one-way"}
                                        onChange={(e) => setTripType(e.target.value)}
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">One Way</span>
                                </label>
                            </div>

                            {/* Inputs Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* From */}
                                <div className="md:col-span-3 relative group">
                                    <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">From</label>
                                    <Combobox
                                        items={airportItems}
                                        value={from}
                                        onChange={setFrom}
                                        placeholder="Select Origin"
                                        searchPlaceholder="Search city or airport..."
                                        className="h-14"
                                    />
                                </div>

                                {/* To */}
                                <div className="md:col-span-3 relative group">
                                    <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">To</label>
                                    <Combobox
                                        items={airportItems}
                                        value={to}
                                        onChange={setTo}
                                        placeholder="Select Destination"
                                        searchPlaceholder="Search city or airport..."
                                        className="h-14"
                                    />
                                </div>

                                {/* Date Picker */}
                                <div className="md:col-span-4 relative group">
                                    <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">
                                        {tripType === "round-trip" ? "Dates" : "Date"}
                                    </label>
                                    {tripType === "round-trip" ? (
                                        <DateRangePicker
                                            mode="range"
                                            date={dateRange}
                                            setDate={setDateRange}
                                            className="[&>button]:h-14"
                                        />
                                    ) : (
                                        <DateRangePicker
                                            mode="single"
                                            date={singleDate}
                                            setDate={setSingleDate}
                                            className="[&>button]:h-14"
                                            placeholder="Pick a date"
                                        />
                                    )}
                                </div>

                                {/* Travelers */}
                                <div className="md:col-span-2 relative group">
                                    <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">Travelers</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-full h-14 pl-11 pr-4 bg-white dark:bg-slate-950 border rounded-md text-left text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all relative hover:bg-slate-50 dark:hover:bg-slate-800">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                {travelers} Traveler{travelers > 1 ? 's' : ''}
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-60 p-4">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Travelers</span>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setTravelers(Math.max(1, travelers - 1))}
                                                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="font-bold w-4 text-center">{travelers}</span>
                                                    <button
                                                        onClick={() => setTravelers(travelers + 1)}
                                                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Bottom Actions */}
                            <div className="flex justify-between items-center pt-2">
                                <div className="flex gap-4">
                                    <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                                        <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center" />
                                        Add nearby airports
                                    </button>
                                    <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                                        <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center" />
                                        Direct flights only
                                    </button>
                                </div>

                                <div className="flex gap-4 items-center">
                                    <Button variant="ghost" className="text-slate-500 hover:text-primary">
                                        <span className="mr-2">Filters</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" /><line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" /><line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" /><line x1="1" x2="7" y1="14" y2="14" /><line x1="9" x2="15" y1="8" y2="8" /><line x1="17" x2="23" y1="16" y2="16" /></svg>
                                    </Button>
                                    <Button
                                        size="lg"
                                        onClick={handleSearch}
                                        className="bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 text-white shadow-lg shadow-primary/30 rounded-xl px-8 h-12"
                                    >
                                        Search Flights <Search className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            Hotel search coming soon...
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
