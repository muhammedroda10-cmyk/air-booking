"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SeatMap, SeatMapRef } from "@/components/seat-map"
import { useLanguage } from "@/context/language-context"
import { Plane, ArrowRight, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FlightSegment {
    id: string
    flightNumber?: string
    origin: string
    originCode: string
    destination: string
    destinationCode: string
    departureTime?: string
}

interface MultiSegmentSeatMapProps {
    segments: FlightSegment[]
    passengerCount: number
    selectedSeats: { [segmentId: string]: string[] }
    onSeatSelect: (segmentId: string, seats: string[]) => void
}

export interface MultiSegmentSeatMapRef {
    validate: () => { isValid: boolean; error?: string }
}

export const MultiSegmentSeatMap = React.forwardRef<MultiSegmentSeatMapRef, MultiSegmentSeatMapProps>(
    ({ segments, passengerCount, selectedSeats, onSeatSelect }, ref) => {
        const { dir } = useLanguage()
        const [activeTab, setActiveTab] = React.useState(segments[0]?.id || "")
        const seatMapRefs = React.useRef<{ [key: string]: SeatMapRef | null }>({})

        const handleSeatSelection = (segmentId: string) => (seatId: string) => {
            const currentSeats = selectedSeats[segmentId] || []

            if (currentSeats.includes(seatId)) {
                // Deselect
                onSeatSelect(segmentId, currentSeats.filter(s => s !== seatId))
            } else if (currentSeats.length < passengerCount) {
                // Select
                onSeatSelect(segmentId, [...currentSeats, seatId])
            }
        }

        const getSegmentStatus = (segmentId: string) => {
            const seats = selectedSeats[segmentId] || []
            if (seats.length === passengerCount) return "complete"
            if (seats.length > 0) return "partial"
            return "pending"
        }

        const validate = (): { isValid: boolean; error?: string } => {
            // Seat selection is optional, so always valid
            return { isValid: true }
        }

        React.useImperativeHandle(ref, () => ({ validate }))

        if (segments.length === 0) {
            return (
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                        {dir === 'rtl' ? 'لا توجد رحلات متاحة' : 'No flights available'}
                    </p>
                </Card>
            )
        }

        // Single segment - show directly without tabs
        if (segments.length === 1) {
            const segment = segments[0]
            return (
                <Card className="border-none shadow-lg rounded-[1.5rem] overflow-hidden bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Plane className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    {dir === 'rtl' ? 'اختر مقاعدك' : 'Select Your Seats'}
                                </CardTitle>
                                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <span className="font-semibold">{segment.originCode}</span>
                                    <ArrowRight className="w-3 h-3" />
                                    <span className="font-semibold">{segment.destinationCode}</span>
                                    {segment.flightNumber && (
                                        <Badge variant="outline" className="ml-2">{segment.flightNumber}</Badge>
                                    )}
                                </div>
                            </div>
                            <SegmentStatusBadge status={getSegmentStatus(segment.id)} selected={(selectedSeats[segment.id] || []).length} total={passengerCount} dir={dir} />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <SeatMap
                            ref={(el) => { seatMapRefs.current[segment.id] = el }}
                            flightId={segment.id}
                            selectedSeats={selectedSeats[segment.id] || []}
                            onSelect={handleSeatSelection(segment.id)}
                            maxSeats={passengerCount}
                        />
                    </CardContent>
                </Card>
            )
        }

        // Multiple segments - show with tabs
        return (
            <Card className="border-none shadow-lg rounded-[1.5rem] overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plane className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">
                                {dir === 'rtl' ? 'اختر مقاعدك' : 'Select Your Seats'}
                            </CardTitle>
                            <CardDescription>
                                {dir === 'rtl'
                                    ? `اختر ${passengerCount} مقعد لكل رحلة`
                                    : `Choose ${passengerCount} seat(s) for each flight`}
                            </CardDescription>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${segments.length}, 1fr)` }}>
                            {segments.map((segment, index) => {
                                const status = getSegmentStatus(segment.id)
                                return (
                                    <TabsTrigger
                                        key={segment.id}
                                        value={segment.id}
                                        className={cn(
                                            "relative data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800",
                                            "flex flex-col gap-1 py-3"
                                        )}
                                    >
                                        <div className="flex items-center gap-1 text-xs font-semibold">
                                            {index === 0 ? (
                                                <Badge variant="secondary" className="text-[10px] px-1.5">
                                                    {dir === 'rtl' ? 'ذهاب' : 'OUTBOUND'}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] px-1.5">
                                                    {dir === 'rtl' ? 'عودة' : 'RETURN'}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold">{segment.originCode}</span>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                            <span className="font-bold">{segment.destinationCode}</span>
                                        </div>
                                        {status === "complete" && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                                <Check className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        )}
                                        {status === "partial" && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                                                <span className="text-[8px] text-white font-bold">
                                                    {(selectedSeats[segment.id] || []).length}
                                                </span>
                                            </div>
                                        )}
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                    </Tabs>
                </CardHeader>

                <CardContent className="pt-6">
                    {segments.map(segment => (
                        <div
                            key={segment.id}
                            className={cn(activeTab === segment.id ? "block" : "hidden")}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {segment.origin} → {segment.destination}
                                    </span>
                                    {segment.flightNumber && (
                                        <Badge variant="outline">{segment.flightNumber}</Badge>
                                    )}
                                </div>
                                <SegmentStatusBadge
                                    status={getSegmentStatus(segment.id)}
                                    selected={(selectedSeats[segment.id] || []).length}
                                    total={passengerCount}
                                    dir={dir}
                                />
                            </div>

                            <SeatMap
                                ref={(el) => { seatMapRefs.current[segment.id] = el }}
                                flightId={segment.id}
                                selectedSeats={selectedSeats[segment.id] || []}
                                onSelect={handleSeatSelection(segment.id)}
                                maxSeats={passengerCount}
                            />

                            {/* Selected seats summary */}
                            {(selectedSeats[segment.id] || []).length > 0 && (
                                <div className="mt-4 p-3 bg-primary/5 rounded-lg flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        {dir === 'rtl' ? 'المقاعد المختارة:' : 'Selected seats:'}
                                    </span>
                                    <div className="flex gap-2">
                                        {(selectedSeats[segment.id] || []).map(seat => (
                                            <Badge key={seat} variant="default">{seat}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }
)

MultiSegmentSeatMap.displayName = "MultiSegmentSeatMap"

// Helper component for status badge
function SegmentStatusBadge({
    status,
    selected,
    total,
    dir
}: {
    status: "complete" | "partial" | "pending"
    selected: number
    total: number
    dir: string
}) {
    if (status === "complete") {
        return (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Check className="w-3 h-3 mr-1" />
                {dir === 'rtl' ? 'مكتمل' : 'Complete'}
            </Badge>
        )
    }

    if (status === "partial") {
        return (
            <Badge variant="outline" className="border-amber-300 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3 h-3 mr-1" />
                {selected}/{total}
            </Badge>
        )
    }

    return (
        <Badge variant="secondary">
            {dir === 'rtl' ? 'اختر المقاعد' : 'Select seats'}
        </Badge>
    )
}

export default MultiSegmentSeatMap
