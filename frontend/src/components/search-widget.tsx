"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plane, MapPin, Search, User, Calendar, Plus, X, SlidersHorizontal, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter, useParams } from "next/navigation"
import api from "@/lib/api"
import { useLanguage } from "@/context/language-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Combobox } from "@/components/ui/combobox"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface Airport {
    id: number;
    code: string;
    city: string;
    name: string;
}

interface Airline {
    id: number;
    name: string;
    code: string;
}

interface MultiCityLeg {
    from: string;
    to: string;
    date: Date | undefined;
}

type TripType = "round-trip" | "one-way" | "open-return" | "multi-city"

export function SearchWidget({ defaultTab = "flights" }: { defaultTab?: string }) {
    const router = useRouter()
    const params = useParams()
    const locale = (params?.locale as string) || 'en'
    const { t, dir } = useLanguage()
    const [activeTab, setActiveTab] = React.useState(defaultTab)
    const [tripType, setTripType] = React.useState<TripType>("round-trip")
    const [airports, setAirports] = React.useState<Airport[]>([])
    const [airlines, setAirlines] = React.useState<Airline[]>([])
    const [from, setFrom] = React.useState("")
    const [to, setTo] = React.useState("")
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
    const [singleDate, setSingleDate] = React.useState<Date | undefined>()
    const [travelers, setTravelers] = React.useState({ adults: 1, children: 0, infants: 0 })
    const [cabinClass, setCabinClass] = React.useState("economy")

    // Multi-city legs
    const [multiCityLegs, setMultiCityLegs] = React.useState<MultiCityLeg[]>([
        { from: "", to: "", date: undefined },
        { from: "", to: "", date: undefined }
    ])

    // Filter options
    const [addNearbyAirports, setAddNearbyAirports] = React.useState(false)
    const [directFlightsOnly, setDirectFlightsOnly] = React.useState(false)
    const [filtersOpen, setFiltersOpen] = React.useState(false)

    // Advanced filters
    const [priceRange, setPriceRange] = React.useState([0, 5000])
    const [departureTime, setDepartureTime] = React.useState<string[]>([])
    const [selectedAirlines, setSelectedAirlines] = React.useState<number[]>([])
    const [maxStops, setMaxStops] = React.useState<number | null>(null)
    const [preferredDuration, setPreferredDuration] = React.useState<number | null>(null)

    // Hotel State
    const [city, setCity] = React.useState("")
    const [hotelDateRange, setHotelDateRange] = React.useState<DateRange | undefined>()
    const [rooms, setRooms] = React.useState(1)
    const [guests, setGuests] = React.useState({ adults: 2, children: 0 })

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [airportsRes, airlinesRes] = await Promise.all([
                    api.get('/airports'),
                    api.get('/airlines')
                ])
                setAirports(Array.isArray(airportsRes.data) ? airportsRes.data : airportsRes.data.data || [])
                setAirlines(Array.isArray(airlinesRes.data) ? airlinesRes.data : airlinesRes.data.data || [])
            } catch (error) {
                console.error("Failed to fetch data", error)
            }
        }
        fetchData()
    }, [])

    const handleSearch = () => {
        const params = new URLSearchParams()

        if (tripType === "multi-city") {
            // Multi-city search
            multiCityLegs.forEach((leg, index) => {
                if (leg.from) params.append(`from${index}`, leg.from)
                if (leg.to) params.append(`to${index}`, leg.to)
                if (leg.date) params.append(`date${index}`, format(leg.date, "yyyy-MM-dd"))
            })
            params.append("type", "multi-city")
        } else {
            params.append("from", from)
            params.append("to", to)
            params.append("type", tripType)

            if (tripType === "round-trip" && dateRange?.from) {
                params.append("date", format(dateRange.from, "yyyy-MM-dd"))
                if (dateRange.to) {
                    params.append("returnDate", format(dateRange.to, "yyyy-MM-dd"))
                }
            } else if ((tripType === "one-way" || tripType === "open-return") && singleDate) {
                params.append("date", format(singleDate, "yyyy-MM-dd"))
            }
        }

        // Travelers
        params.append("adults", travelers.adults.toString())
        if (travelers.children > 0) params.append("children", travelers.children.toString())
        if (travelers.infants > 0) params.append("infants", travelers.infants.toString())
        params.append("cabin", cabinClass)

        // Filters
        if (addNearbyAirports) params.append("nearby", "true")
        if (directFlightsOnly) params.append("direct", "true")
        if (priceRange[0] > 0) params.append("min_price", priceRange[0].toString())
        if (priceRange[1] < 5000) params.append("max_price", priceRange[1].toString())
        if (selectedAirlines.length > 0) params.append("airlines", selectedAirlines.join(","))
        if (maxStops !== null) params.append("max_stops", maxStops.toString())

        router.push(`/${locale}/flights?${params.toString()}`)
    }

    const handleHotelSearch = () => {
        const params = new URLSearchParams()
        if (city) params.append("city", city)
        if (hotelDateRange?.from) params.append("check_in", format(hotelDateRange.from, "yyyy-MM-dd"))
        if (hotelDateRange?.to) params.append("check_out", format(hotelDateRange.to, "yyyy-MM-dd"))
        params.append("rooms", rooms.toString())
        params.append("adults", guests.adults.toString())
        if (guests.children > 0) params.append("children", guests.children.toString())

        router.push(`/${locale}/hotels?${params.toString()}`)
    }

    const airportItems = airports.map(a => ({
        value: a.code,
        label: `${a.city} (${a.code})`,
        subLabel: a.name
    }))

    const totalTravelers = travelers.adults + travelers.children + travelers.infants

    const addMultiCityLeg = () => {
        if (multiCityLegs.length < 6) {
            setMultiCityLegs([...multiCityLegs, { from: "", to: "", date: undefined }])
        }
    }

    const removeMultiCityLeg = (index: number) => {
        if (multiCityLegs.length > 2) {
            setMultiCityLegs(multiCityLegs.filter((_, i) => i !== index))
        }
    }

    const updateMultiCityLeg = (index: number, field: keyof MultiCityLeg, value: any) => {
        const updated = [...multiCityLegs]
        updated[index] = { ...updated[index], [field]: value }
        setMultiCityLegs(updated)
    }

    const tripTypes: { value: TripType; label: string; labelAr: string }[] = [
        { value: "round-trip", label: "Round Trip", labelAr: "ذهاب وعودة" },
        { value: "one-way", label: "One Way", labelAr: "ذهاب فقط" },
        { value: "open-return", label: "Open Return", labelAr: "عودة مفتوحة" },
        { value: "multi-city", label: "Multi City", labelAr: "وجهات متعددة" }
    ]

    const cabinClasses = [
        { value: "economy", label: "Economy", labelAr: "اقتصادية" },
        { value: "premium", label: "Premium Economy", labelAr: "اقتصادية مميزة" },
        { value: "business", label: "Business", labelAr: "رجال أعمال" },
        { value: "first", label: "First Class", labelAr: "درجة أولى" }
    ]

    const departureTimeOptions = [
        { value: "morning", label: "Morning (6am-12pm)", labelAr: "صباحاً (6ص-12م)" },
        { value: "afternoon", label: "Afternoon (12pm-6pm)", labelAr: "ظهراً (12م-6م)" },
        { value: "evening", label: "Evening (6pm-12am)", labelAr: "مساءً (6م-12ص)" },
        { value: "night", label: "Night (12am-6am)", labelAr: "ليلاً (12ص-6ص)" }
    ]

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
                        {dir === 'rtl' ? 'رحلات' : 'Flights'}
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
                        <Building className="w-4 h-4" />
                        {dir === 'rtl' ? 'فنادق' : 'Hotels'}
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
                        {dir === 'rtl' ? 'رحلات + فنادق' : 'Flights + Hotels'}
                    </button>
                </div>
            </div>

            <Card className="p-2 shadow-2xl border-0 bg-white/20 backdrop-blur-xl rounded-[2rem]">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[1.5rem] p-6 md:p-8">
                    {activeTab === "flights" ? (
                        <div className="space-y-6">
                            {/* Trip Type Toggle */}
                            <div className="flex flex-wrap gap-4 mb-4">
                                {tripTypes.map(type => (
                                    <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="tripType"
                                            value={type.value}
                                            checked={tripType === type.value}
                                            onChange={(e) => setTripType(e.target.value as TripType)}
                                            className="w-4 h-4 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium">
                                            {dir === 'rtl' ? type.labelAr : type.label}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* Multi-City Form */}
                            {tripType === "multi-city" ? (
                                <div className="space-y-4">
                                    {multiCityLegs.map((leg, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                            <div className="md:col-span-4 relative">
                                                <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">
                                                    {dir === 'rtl' ? 'من' : 'From'}
                                                </label>
                                                <Combobox
                                                    items={airportItems}
                                                    value={leg.from}
                                                    onChange={(val) => updateMultiCityLeg(index, 'from', val)}
                                                    placeholder={dir === 'rtl' ? 'اختر المغادرة' : 'Select Origin'}
                                                    searchPlaceholder={dir === 'rtl' ? 'ابحث...' : 'Search...'}
                                                    className="h-14"
                                                />
                                            </div>

                                            <div className="md:col-span-4 relative">
                                                <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">
                                                    {dir === 'rtl' ? 'إلى' : 'To'}
                                                </label>
                                                <Combobox
                                                    items={airportItems}
                                                    value={leg.to}
                                                    onChange={(val) => updateMultiCityLeg(index, 'to', val)}
                                                    placeholder={dir === 'rtl' ? 'اختر الوجهة' : 'Select Destination'}
                                                    searchPlaceholder={dir === 'rtl' ? 'ابحث...' : 'Search...'}
                                                    className="h-14"
                                                />
                                            </div>

                                            <div className="md:col-span-3 relative">
                                                <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">
                                                    {dir === 'rtl' ? 'التاريخ' : 'Date'}
                                                </label>
                                                <DateRangePicker
                                                    mode="single"
                                                    date={leg.date}
                                                    setDate={(date) => updateMultiCityLeg(index, 'date', date)}
                                                    className="[&>button]:h-14"
                                                    placeholder={dir === 'rtl' ? 'اختر التاريخ' : 'Pick a date'}
                                                />
                                            </div>

                                            <div className="md:col-span-1 flex justify-center">
                                                {index >= 2 && (
                                                    <button
                                                        onClick={() => removeMultiCityLeg(index)}
                                                        className="w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {multiCityLegs.length < 6 && (
                                        <button
                                            onClick={addMultiCityLeg}
                                            className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            {dir === 'rtl' ? 'إضافة رحلة أخرى' : 'Add another flight'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                /* Standard Form */
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    {/* From */}
                                    <div className="md:col-span-3 relative group">
                                        <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">
                                            {dir === 'rtl' ? 'من' : 'From'}
                                        </label>
                                        <Combobox
                                            items={airportItems}
                                            value={from}
                                            onChange={setFrom}
                                            placeholder={dir === 'rtl' ? 'اختر المغادرة' : 'Select Origin'}
                                            searchPlaceholder={dir === 'rtl' ? 'ابحث عن مدينة أو مطار...' : 'Search city or airport...'}
                                            className="h-14"
                                        />
                                    </div>

                                    {/* To */}
                                    <div className="md:col-span-3 relative group">
                                        <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">
                                            {dir === 'rtl' ? 'إلى' : 'To'}
                                        </label>
                                        <Combobox
                                            items={airportItems}
                                            value={to}
                                            onChange={setTo}
                                            placeholder={dir === 'rtl' ? 'اختر الوجهة' : 'Select Destination'}
                                            searchPlaceholder={dir === 'rtl' ? 'ابحث عن مدينة أو مطار...' : 'Search city or airport...'}
                                            className="h-14"
                                        />
                                    </div>

                                    {/* Date Picker */}
                                    <div className="md:col-span-4 relative group">
                                        <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">
                                            {tripType === "round-trip" ? (dir === 'rtl' ? 'التواريخ' : 'Dates') : (dir === 'rtl' ? 'التاريخ' : 'Date')}
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
                                                placeholder={tripType === "open-return"
                                                    ? (dir === 'rtl' ? 'تاريخ المغادرة' : 'Departure date')
                                                    : (dir === 'rtl' ? 'اختر التاريخ' : 'Pick a date')
                                                }
                                            />
                                        )}
                                        {tripType === "open-return" && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {dir === 'rtl' ? 'العودة مرنة - احجز لاحقاً' : 'Flexible return - book later'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Travelers & Class */}
                                    <div className="md:col-span-2 relative group">
                                        <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">
                                            {dir === 'rtl' ? 'المسافرون' : 'Travelers'}
                                        </label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="w-full h-14 pl-11 pr-4 bg-white dark:bg-slate-950 border rounded-md text-left text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all relative hover:bg-slate-50 dark:hover:bg-slate-800">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                    {totalTravelers} {dir === 'rtl' ? 'مسافر' : (totalTravelers > 1 ? 'Travelers' : 'Traveler')}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-4" align="end">
                                                <div className="space-y-4">
                                                    {/* Adults */}
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="font-medium">{dir === 'rtl' ? 'بالغين' : 'Adults'}</span>
                                                            <p className="text-xs text-muted-foreground">{dir === 'rtl' ? '12 سنة فأكثر' : '12+ years'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setTravelers({ ...travelers, adults: Math.max(1, travelers.adults - 1) })}
                                                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                                                            >-</button>
                                                            <span className="font-bold w-4 text-center">{travelers.adults}</span>
                                                            <button
                                                                onClick={() => setTravelers({ ...travelers, adults: travelers.adults + 1 })}
                                                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                                                            >+</button>
                                                        </div>
                                                    </div>

                                                    {/* Children */}
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="font-medium">{dir === 'rtl' ? 'أطفال' : 'Children'}</span>
                                                            <p className="text-xs text-muted-foreground">{dir === 'rtl' ? '2-11 سنة' : '2-11 years'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setTravelers({ ...travelers, children: Math.max(0, travelers.children - 1) })}
                                                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                                                            >-</button>
                                                            <span className="font-bold w-4 text-center">{travelers.children}</span>
                                                            <button
                                                                onClick={() => setTravelers({ ...travelers, children: travelers.children + 1 })}
                                                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                                                            >+</button>
                                                        </div>
                                                    </div>

                                                    {/* Infants */}
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="font-medium">{dir === 'rtl' ? 'رضع' : 'Infants'}</span>
                                                            <p className="text-xs text-muted-foreground">{dir === 'rtl' ? 'أقل من سنتين' : 'Under 2 years'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setTravelers({ ...travelers, infants: Math.max(0, travelers.infants - 1) })}
                                                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                                                            >-</button>
                                                            <span className="font-bold w-4 text-center">{travelers.infants}</span>
                                                            <button
                                                                onClick={() => setTravelers({ ...travelers, infants: Math.min(travelers.adults, travelers.infants + 1) })}
                                                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                                                            >+</button>
                                                        </div>
                                                    </div>

                                                    <hr />

                                                    {/* Cabin Class */}
                                                    <div>
                                                        <span className="font-medium block mb-2">{dir === 'rtl' ? 'درجة السفر' : 'Cabin Class'}</span>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {cabinClasses.map(cc => (
                                                                <button
                                                                    key={cc.value}
                                                                    onClick={() => setCabinClass(cc.value)}
                                                                    className={cn(
                                                                        "px-3 py-2 text-xs font-medium rounded-lg border transition-colors",
                                                                        cabinClass === cc.value
                                                                            ? "bg-slate-900 text-white border-slate-900"
                                                                            : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                                                                    )}
                                                                >
                                                                    {dir === 'rtl' ? cc.labelAr : cc.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            )}

                            {/* Bottom Actions */}
                            <div className="flex flex-wrap justify-between items-center pt-2 gap-4">
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                                        <Checkbox
                                            checked={addNearbyAirports}
                                            onCheckedChange={(checked) => setAddNearbyAirports(checked as boolean)}
                                        />
                                        {dir === 'rtl' ? 'إضافة المطارات القريبة' : 'Add nearby airports'}
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                                        <Checkbox
                                            checked={directFlightsOnly}
                                            onCheckedChange={(checked) => setDirectFlightsOnly(checked as boolean)}
                                        />
                                        {dir === 'rtl' ? 'رحلات مباشرة فقط' : 'Direct flights only'}
                                    </label>
                                </div>

                                <div className="flex gap-4 items-center">
                                    {/* Filters Dialog */}
                                    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" className="text-slate-500 hover:text-primary">
                                                <SlidersHorizontal className="w-4 h-4 mr-2" />
                                                {dir === 'rtl' ? 'المرشحات' : 'Filters'}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>{dir === 'rtl' ? 'خيارات البحث المتقدمة' : 'Advanced Search Options'}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-6 py-4">
                                                {/* Price Range */}
                                                <div>
                                                    <Label className="text-sm font-medium">
                                                        {dir === 'rtl' ? 'نطاق السعر' : 'Price Range'}: ${priceRange[0]} - ${priceRange[1]}
                                                    </Label>
                                                    <Slider
                                                        value={priceRange}
                                                        onValueChange={setPriceRange}
                                                        min={0}
                                                        max={5000}
                                                        step={50}
                                                        className="mt-2"
                                                    />
                                                </div>

                                                {/* Max Stops */}
                                                <div>
                                                    <Label className="text-sm font-medium mb-2 block">
                                                        {dir === 'rtl' ? 'الحد الأقصى للتوقفات' : 'Maximum Stops'}
                                                    </Label>
                                                    <div className="flex gap-2">
                                                        {[
                                                            { value: 0, label: dir === 'rtl' ? 'مباشر' : 'Direct' },
                                                            { value: 1, label: '1' },
                                                            { value: 2, label: '2+' }
                                                        ].map(option => (
                                                            <button
                                                                key={option.value}
                                                                onClick={() => setMaxStops(maxStops === option.value ? null : option.value)}
                                                                className={cn(
                                                                    "px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
                                                                    maxStops === option.value
                                                                        ? "bg-primary text-white border-primary"
                                                                        : "bg-white hover:bg-slate-50 border-slate-200"
                                                                )}
                                                            >
                                                                {option.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Departure Time */}
                                                <div>
                                                    <Label className="text-sm font-medium mb-2 block">
                                                        {dir === 'rtl' ? 'وقت المغادرة' : 'Departure Time'}
                                                    </Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {departureTimeOptions.map(option => (
                                                            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                                                <Checkbox
                                                                    checked={departureTime.includes(option.value)}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            setDepartureTime([...departureTime, option.value])
                                                                        } else {
                                                                            setDepartureTime(departureTime.filter(t => t !== option.value))
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-sm">{dir === 'rtl' ? option.labelAr : option.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Airlines */}
                                                {airlines.length > 0 && (
                                                    <div>
                                                        <Label className="text-sm font-medium mb-2 block">
                                                            {dir === 'rtl' ? 'شركات الطيران' : 'Airlines'}
                                                        </Label>
                                                        <div className="max-h-32 overflow-y-auto space-y-2">
                                                            {airlines.map(airline => (
                                                                <label key={airline.id} className="flex items-center gap-2 cursor-pointer">
                                                                    <Checkbox
                                                                        checked={selectedAirlines.includes(airline.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            if (checked) {
                                                                                setSelectedAirlines([...selectedAirlines, airline.id])
                                                                            } else {
                                                                                setSelectedAirlines(selectedAirlines.filter(id => id !== airline.id))
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className="text-sm">{airline.name}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <Button
                                                    className="w-full"
                                                    onClick={() => setFiltersOpen(false)}
                                                >
                                                    {dir === 'rtl' ? 'تطبيق المرشحات' : 'Apply Filters'}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <Button
                                        size="lg"
                                        onClick={handleSearch}
                                        className="bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 text-white shadow-lg shadow-primary/30 rounded-xl px-8 h-12"
                                    >
                                        {dir === 'rtl' ? 'بحث عن رحلات' : 'Search Flights'} <Search className={cn("w-4 h-4", dir === 'rtl' ? 'mr-2' : 'ml-2')} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === "hotels" ? (
                        /* Hotels Search Form */
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* Destination */}
                                <div className="md:col-span-4 relative group">
                                    <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">
                                        {dir === 'rtl' ? 'الوجهة' : 'Destination'}
                                    </label>
                                    <Combobox
                                        items={airportItems}
                                        value={city}
                                        onChange={setCity}
                                        placeholder={dir === 'rtl' ? 'المدينة أو الفندق' : 'City or hotel name'}
                                        searchPlaceholder={dir === 'rtl' ? 'ابحث...' : 'Search...'}
                                        className="h-14"
                                    />
                                </div>

                                {/* Check-in / Check-out */}
                                <div className="md:col-span-4 relative group">
                                    <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">
                                        {dir === 'rtl' ? 'تاريخ الدخول والخروج' : 'Check-in / Check-out'}
                                    </label>
                                    <DateRangePicker
                                        mode="range"
                                        date={hotelDateRange}
                                        setDate={setHotelDateRange}
                                        className="[&>button]:h-14"
                                    />
                                </div>

                                {/* Rooms & Guests */}
                                <div className="md:col-span-2 relative group">
                                    <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 bg-white dark:bg-slate-900 px-1">
                                        {dir === 'rtl' ? 'الغرف' : 'Rooms'}
                                    </label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-full h-14 px-4 bg-white dark:bg-slate-950 border rounded-md text-left text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                                                {rooms} {dir === 'rtl' ? 'غرفة' : (rooms > 1 ? 'Rooms' : 'Room')}, {guests.adults + guests.children} {dir === 'rtl' ? 'ضيوف' : 'Guests'}
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-4">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">{dir === 'rtl' ? 'الغرف' : 'Rooms'}</span>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => setRooms(Math.max(1, rooms - 1))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">-</button>
                                                        <span className="font-bold w-4 text-center">{rooms}</span>
                                                        <button onClick={() => setRooms(rooms + 1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">+</button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">{dir === 'rtl' ? 'بالغين' : 'Adults'}</span>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) })} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">-</button>
                                                        <span className="font-bold w-4 text-center">{guests.adults}</span>
                                                        <button onClick={() => setGuests({ ...guests, adults: guests.adults + 1 })} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">+</button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">{dir === 'rtl' ? 'أطفال' : 'Children'}</span>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => setGuests({ ...guests, children: Math.max(0, guests.children - 1) })} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">-</button>
                                                        <span className="font-bold w-4 text-center">{guests.children}</span>
                                                        <button onClick={() => setGuests({ ...guests, children: guests.children + 1 })} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Search Button */}
                                <div className="md:col-span-2">
                                    <Button
                                        size="lg"
                                        onClick={handleHotelSearch}
                                        className="w-full h-14 bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 text-white shadow-lg shadow-primary/30 rounded-xl"
                                    >
                                        <Search className="w-4 h-4 mr-2" />
                                        {dir === 'rtl' ? 'بحث' : 'Search'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            {dir === 'rtl' ? 'حزم الرحلات + الفنادق قريباً...' : 'Flights + Hotels packages coming soon...'}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
