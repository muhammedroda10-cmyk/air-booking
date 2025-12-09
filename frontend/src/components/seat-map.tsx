"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/context/language-context"
import { AlertCircle, Check, Loader2, Armchair } from "lucide-react"
import api from "@/lib/api"

interface SeatProps {
    id: string
    status: "available" | "occupied" | "selected"
    classType: "economy" | "business" | "first"
    price?: number
    onSelect: (id: string) => void
}

function Seat({ id, status, classType, onSelect }: SeatProps) {
    const isBusiness = classType === "business" || classType === "first"

    return (
        <motion.button
            whileHover={status === "available" ? { scale: 1.1 } : {}}
            whileTap={status === "available" || status === "selected" ? { scale: 0.9 } : {}}
            onClick={() => status !== "occupied" && onSelect(id)}
            disabled={status === "occupied"}
            className={cn(
                "group relative rounded-t-lg rounded-b-sm m-0.5 flex items-center justify-center text-xs font-medium transition-all duration-200",
                // Size changes based on class
                isBusiness ? "w-12 h-10" : "w-9 h-9",
                // Status colors
                status === "available" && "bg-slate-100 dark:bg-slate-800 hover:bg-primary/30 hover:border-primary text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
                status === "occupied" && "bg-slate-200 dark:bg-slate-700 cursor-not-allowed opacity-40",
                status === "selected" && "bg-primary text-white shadow-lg shadow-primary/30 border-primary",
                // Business class distinct style
                isBusiness && status === "available" && "border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800"
            )}
            title={`${id} - ${classType.toUpperCase()}`}
        >
            <Armchair className={cn(
                "w-4 h-4",
                isBusiness ? "w-5 h-5" : "w-4 h-4",
                status === "selected" ? "text-white" : (isBusiness ? "text-amber-500/50" : "text-slate-400")
            )} />
            <span className="absolute -bottom-4 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 bg-black text-white px-1.5 rounded py-0.5 pointer-events-none">
                {id}
            </span>
        </motion.button>
    )
}

interface SeatMapProps {
    flightId?: number | string
    selectedSeats?: string[]
    onSelect: (seatId: string) => void
    onDeselect?: (seatId: string) => void
    maxSeats?: number
    required?: boolean
}

export interface SeatMapRef {
    validate: () => { isValid: boolean; error?: string }
}

interface SeatData {
    id: string
    status: "available" | "occupied"
    class: "economy" | "business" | "first"
    price: number
}

export const SeatMap = React.forwardRef<SeatMapRef, SeatMapProps>(
    ({ flightId, selectedSeats = [], onSelect, onDeselect, maxSeats = 1, required = false }, ref) => {
        const { dir } = useLanguage()
        const [loading, setLoading] = React.useState(false)
        const [seats, setSeats] = React.useState<SeatData[]>([])
        const [error, setError] = React.useState<string | null>(null)

        React.useEffect(() => {
            if (!flightId) return

            // Detect if this is an API offer ID (string like "duffel_xxx", "amadeus_xxx", or "off_xxx")
            const flightIdStr = String(flightId)
            const isApiOffer = flightIdStr.startsWith('duffel_') ||
                flightIdStr.startsWith('amadeus_') ||
                flightIdStr.startsWith('off_') ||
                flightIdStr.startsWith('database_')

            if (isApiOffer) {
                fetchApiOfferSeats(flightIdStr)
            } else {
                // Numeric (local) flight IDs use the database endpoint
                const numericId = typeof flightId === 'number' ? flightId : parseInt(flightIdStr, 10)
                if (!isNaN(numericId) && numericId > 0) {
                    fetchDatabaseSeats(numericId)
                }
            }
        }, [flightId])

        const fetchDatabaseSeats = async (numericId: number) => {
            setLoading(true)
            setError(null)
            try {
                const response = await api.get(`/flights/${numericId}/seats`)
                setSeats(response.data.seats)
            } catch (err) {
                console.error("Failed to fetch seats:", err)
                setError("Failed to load seat map")
            } finally {
                setLoading(false)
            }
        }

        const fetchApiOfferSeats = async (offerId: string) => {
            setLoading(true)
            setError(null)
            try {
                // Extract the actual offer ID from prefixed format
                let actualOfferId = offerId
                let supplier = 'duffel'

                if (offerId.startsWith('duffel_')) {
                    actualOfferId = offerId.replace('duffel_', '')
                    supplier = 'duffel'
                } else if (offerId.startsWith('amadeus_')) {
                    // Keep the full amadeus offer ID - backend expects it
                    actualOfferId = offerId
                    supplier = 'amadeus'
                } else if (offerId.startsWith('database_')) {
                    // Database offers don't have external seat maps
                    setError(dir === 'rtl' ? 'اختيار المقعد غير متاح لهذه الرحلة' : 'Seat selection is handled at check-in for this flight')
                    setLoading(false)
                    return
                }

                const response = await api.get(`/offers/seats`, {
                    params: { offer_id: actualOfferId, supplier }
                })

                if (response.data.success) {
                    let seatData = response.data.seats || []

                    // Amadeus returns seats grouped by segments, flatten them
                    if (supplier === 'amadeus' && Array.isArray(seatData) && seatData.length > 0) {
                        // Check if it's segment-based format (has 'segment_id' and nested 'seats')
                        if (seatData[0]?.segment_id !== undefined && seatData[0]?.seats) {
                            // Flatten all segments' seats into one array
                            // For now, use the first segment's seats
                            seatData = seatData[0].seats.map((s: { seat_number: string; is_available: boolean; class: string; price?: { amount: number } }) => ({
                                id: s.seat_number,
                                status: s.is_available ? 'available' : 'occupied',
                                class: s.class || 'economy',
                                price: s.price?.amount || 0
                            }))
                        }
                    }

                    setSeats(seatData)
                } else {
                    setError(response.data.error || (dir === 'rtl' ? 'لا توجد بيانات للمقاعد' : 'No seat data available'))
                }
            } catch (err) {
                console.error("Failed to fetch API offer seats:", err)
                setError(dir === 'rtl' ? 'فشل في تحميل خريطة المقاعد' : "Failed to load seat map")
            } finally {
                setLoading(false)
            }
        }

        const fetchSeats = async () => {
            const flightIdStr = String(flightId)
            const isApiOffer = flightIdStr.startsWith('duffel_') ||
                flightIdStr.startsWith('amadeus_') ||
                flightIdStr.startsWith('off_') ||
                flightIdStr.startsWith('database_')

            if (isApiOffer) {
                await fetchApiOfferSeats(flightIdStr)
            } else {
                const numericId = typeof flightId === 'number' ? flightId : parseInt(flightIdStr, 10)
                if (!isNaN(numericId)) {
                    await fetchDatabaseSeats(numericId)
                }
            }
        }

        // Process seats into rows/cols structure
        const grid = React.useMemo(() => {
            if (!seats.length) return null

            // Extract unique rows and cols
            const rows = Array.from(new Set(seats.map(s => parseInt(s.id.replace(/\D/g, ''))))).sort((a, b) => a - b)
            const cols = Array.from(new Set(seats.map(s => s.id.replace(/\d/g, '')))).sort()

            return { rows, cols }
        }, [seats])

        const handleSelect = (seatId: string) => {
            if (selectedSeats.includes(seatId)) {
                onDeselect?.(seatId)
            } else if (selectedSeats.length < maxSeats) {
                onSelect(seatId)
            }
        }

        const getSeatStatus = (seatId: string): "available" | "occupied" | "selected" => {
            if (selectedSeats.includes(seatId)) return "selected"
            const seat = seats.find(s => s.id === seatId)
            return seat?.status === "occupied" ? "occupied" : "available"
        }

        const validate = (): { isValid: boolean; error?: string } => {
            if (required && selectedSeats.length < maxSeats) {
                return {
                    isValid: false,
                    error: dir === 'rtl'
                        ? `يرجى اختيار ${maxSeats} مقعد${maxSeats > 1 ? 'ًا' : ''}`
                        : `Please select ${maxSeats} seat${maxSeats > 1 ? 's' : ''}`
                }
            }
            return { isValid: true }
        }

        React.useImperativeHandle(ref, () => ({ validate }))

        if (loading) {
            return (
                <Card className="min-h-[400px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p>{dir === 'rtl' ? 'جاري تحميل الخريطة...' : 'Loading seat map...'}</p>
                    </div>
                </Card>
            )
        }

        if (error || !seats.length) {
            // Detect if this is an external/API flight
            const flightIdStr = String(flightId)
            const isApiOffer = flightIdStr.startsWith('duffel_') ||
                flightIdStr.startsWith('amadeus_') ||
                flightIdStr.startsWith('off_') ||
                flightIdStr.startsWith('database_')

            return (
                <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Armchair className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <span>{dir === 'rtl' ? 'اختيار المقاعد' : 'Select Your Seats'}</span>
                                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                                    {dir === 'rtl' ? `اختر ${maxSeats} مقعد لركابك` : `Choose ${maxSeats} seat(s) for your passengers`}
                                </p>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="min-h-[300px] flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-8 text-center">
                            {/* Decorative seat grid pattern */}
                            <div className="absolute opacity-5 pointer-events-none">
                                <div className="grid grid-cols-6 gap-2">
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div key={i} className="w-6 h-6 bg-slate-400 rounded-t-lg" />
                                    ))}
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full mb-6 flex items-center justify-center shadow-inner">
                                    <Armchair className="w-10 h-10 text-slate-400" />
                                </div>

                                <h3 className="font-semibold text-xl mb-3">
                                    {dir === 'rtl' ? 'اختيار المقاعد غير متاح حالياً' : 'Seat Selection Not Available'}
                                </h3>

                                <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
                                    {isApiOffer
                                        ? (dir === 'rtl'
                                            ? 'سيتم تخصيص المقاعد أثناء تسجيل الوصول عبر الإنترنت أو في المطار. يمكنك المتابعة دون اختيار المقاعد.'
                                            : 'Seats will be assigned during online check-in or at the airport. You can proceed without seat selection.')
                                        : (error || (dir === 'rtl' ? 'لا توجد بيانات للمقاعد متاحة' : 'No seat data available'))
                                    }
                                </p>

                                {isApiOffer ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full">
                                            <Check className="w-4 h-4" />
                                            <span>{dir === 'rtl' ? 'يمكنك المتابعة' : 'You can continue'}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {dir === 'rtl'
                                                ? 'اضغط على "التالي" للمتابعة'
                                                : 'Click "Next" to proceed with your booking'}
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={fetchSeats}
                                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
                                    >
                                        <Loader2 className="w-4 h-4" />
                                        {dir === 'rtl' ? 'إعادة المحاولة' : 'Try Again'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Armchair className="w-5 h-5 text-primary" />
                            <span>{dir === 'rtl' ? 'اختيار المقاعد' : 'Select Your Seats'}</span>
                        </div>
                        <span className="text-sm font-normal text-muted-foreground">
                            {selectedSeats.length} / {maxSeats} {dir === 'rtl' ? 'تم اختيارها' : 'selected'}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center py-6">
                        {/* Status Alert */}
                        {selectedSeats.length < maxSeats ? (
                            <div className="w-full max-w-md mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2 animate-pulse">
                                <AlertCircle className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                    {dir === 'rtl'
                                        ? `متبقي ${maxSeats - selectedSeats.length} مقعد لاختياره`
                                        : `${maxSeats - selectedSeats.length} seat(s) remaining to select`
                                    }
                                </span>
                            </div>
                        ) : (
                            <div className="w-full max-w-md mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                    {dir === 'rtl' ? 'اكتمل الاختيار' : 'Selection Complete'}
                                </span>
                            </div>
                        )}

                        {/* Plane Nose */}
                        <div className="relative mb-8 w-full max-w-lg flex justify-center">
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <div className="w-64 h-64 rounded-full bg-primary blur-3xl" />
                            </div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-16 h-12 bg-slate-100 dark:bg-slate-800 rounded-t-3xl border-2 border-b-0 border-slate-200 dark:border-slate-700/50" />
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {dir === 'rtl' ? 'مقدمة الطائرة' : 'Cockpit'}
                                </div>
                            </div>
                        </div>

                        {/* Seat Grid */}
                        <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                            {/* Decorative wing hints */}
                            <div className="absolute top-1/2 -left-12 w-24 h-64 bg-slate-100 dark:bg-slate-800 -skew-y-12 rounded-r-3xl -z-10" />
                            <div className="absolute top-1/2 -right-12 w-24 h-64 bg-slate-100 dark:bg-slate-800 skew-y-12 rounded-l-3xl -z-10" />

                            {/* Column Headers */}
                            <div className="flex items-center justify-center gap-1 mb-6">
                                <div className="w-6" /> {/* Row number spacer */}
                                {grid?.cols.map((col, i) => (
                                    <React.Fragment key={col}>
                                        {i === 3 && <div className="w-8 flex items-center justify-center text-xs text-slate-300 font-mono"></div>} {/* Aisle */}
                                        <div className={cn(
                                            "flex items-center justify-center text-xs font-bold text-slate-400 font-mono",
                                            // Make header width match seat width
                                            seats.find(s => s.id.includes(col))?.class === 'business' ? "w-12" : "w-9"
                                        )}>
                                            {col}
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Rows */}
                            <div className="space-y-1">
                                {grid?.rows.map((row) => (
                                    <div key={row} className="flex items-center justify-center gap-1">
                                        <span className="w-6 text-right text-xs font-mono text-slate-300 mr-2">{row}</span>
                                        {grid.cols.map((col, i) => {
                                            const seatId = `${row}${col}`
                                            const seat = seats.find(s => s.id === seatId)

                                            // Aisle gap after 3rd column (C)
                                            const isAisle = i === 3

                                            return (
                                                <React.Fragment key={seatId}>
                                                    {isAisle && <div className="w-8" />} {/* Aisle */}
                                                    {seat ? (
                                                        <Seat
                                                            id={seatId}
                                                            status={getSeatStatus(seatId)}
                                                            classType={seat.class}
                                                            price={seat.price}
                                                            onSelect={handleSelect}
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 m-0.5" /> // Empty space if seat missing
                                                    )}
                                                </React.Fragment>
                                            )
                                        })}
                                        <span className="w-6 text-left text-xs font-mono text-slate-300 ml-2">{row}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-6 mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200" />
                                <span className="text-xs text-muted-foreground">{dir === 'rtl' ? 'متاح' : 'Available'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-primary" />
                                <span className="text-xs text-muted-foreground">{dir === 'rtl' ? 'محدد' : 'Selected'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-slate-200 opacity-50" />
                                <span className="text-xs text-muted-foreground">{dir === 'rtl' ? 'محجوز' : 'Occupied'}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded border border-amber-200 bg-amber-50" />
                                <span className="text-xs text-muted-foreground">{dir === 'rtl' ? 'درجة رجال الأعمال' : 'Business Class'}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }
)

SeatMap.displayName = 'SeatMap'

