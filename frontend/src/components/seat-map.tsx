"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/context/language-context"
import { AlertCircle, Check } from "lucide-react"

interface SeatProps {
    id: string
    status: "available" | "occupied" | "selected"
    onSelect: (id: string) => void
}

function Seat({ id, status, onSelect }: SeatProps) {
    return (
        <motion.button
            whileHover={status === "available" ? { scale: 1.1 } : {}}
            whileTap={status === "available" || status === "selected" ? { scale: 0.9 } : {}}
            onClick={() => status !== "occupied" && onSelect(id)}
            disabled={status === "occupied"}
            className={cn(
                "w-9 h-9 rounded-t-lg rounded-b-sm m-0.5 flex items-center justify-center text-xs font-medium transition-all duration-200",
                status === "available" && "bg-slate-100 dark:bg-slate-800 hover:bg-primary/30 hover:border-primary text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
                status === "occupied" && "bg-slate-200 dark:bg-slate-700 cursor-not-allowed opacity-40",
                status === "selected" && "bg-primary text-white shadow-lg shadow-primary/30 border-primary"
            )}
        >
            {id}
        </motion.button>
    )
}

interface SeatMapProps {
    flightId?: number
    selectedSeats?: string[]
    onSelect: (seatId: string) => void
    onDeselect?: (seatId: string) => void
    maxSeats?: number
    required?: boolean
}

export interface SeatMapRef {
    validate: () => { isValid: boolean; error?: string }
}

export const SeatMap = React.forwardRef<SeatMapRef, SeatMapProps>(
    ({ flightId, selectedSeats = [], onSelect, onDeselect, maxSeats = 1, required = false }, ref) => {
        const { dir } = useLanguage()
        // Mock seat data - in production, fetch from API using flightId
        const rows = 12
        const cols = ["A", "B", "C", "", "D", "E", "F"]

        // Use memo to keep occupied seats stable during render
        const occupiedSeats = React.useMemo(() => {
            const occupied = new Set<string>()
            for (let row = 1; row <= rows; row++) {
                cols.forEach(col => {
                    if (col !== "" && Math.random() < 0.25) {
                        occupied.add(`${row}${col}`)
                    }
                })
            }
            return occupied
        }, [flightId])

        const handleSelect = (seatId: string) => {
            if (selectedSeats.includes(seatId)) {
                // Deselect
                onDeselect?.(seatId)
            } else if (selectedSeats.length < maxSeats) {
                // Select
                onSelect(seatId)
            }
        }

        const getSeatStatus = (seatId: string): "available" | "occupied" | "selected" => {
            if (selectedSeats.includes(seatId)) return "selected"
            if (occupiedSeats.has(seatId)) return "occupied"
            return "available"
        }

        // Validation
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

        // Expose validate method to parent
        React.useImperativeHandle(ref, () => ({
            validate
        }))

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{dir === 'rtl' ? 'اختيار المقاعد' : 'Select Your Seats'}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            {selectedSeats.length} / {maxSeats} {dir === 'rtl' ? 'تم اختيارها' : 'selected'}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center py-6">
                        {/* Selection Status Alert */}
                        {selectedSeats.length < maxSeats ? (
                            <div className="w-full max-w-md mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                    {dir === 'rtl'
                                        ? `يرجى اختيار ${maxSeats - selectedSeats.length} مقعد${maxSeats - selectedSeats.length > 1 ? 'ًا' : ''} إضافي${maxSeats - selectedSeats.length > 1 ? 'ة' : ''}`
                                        : `Please select ${maxSeats - selectedSeats.length} more seat${maxSeats - selectedSeats.length > 1 ? 's' : ''}`
                                    }
                                </span>
                            </div>
                        ) : (
                            <div className="w-full max-w-md mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-green-600 dark:text-green-400">
                                    {dir === 'rtl' ? 'تم اختيار جميع المقاعد' : 'All seats selected'}
                                </span>
                            </div>
                        )}

                        {/* Selected Seats Display */}
                        {selectedSeats.length > 0 && (
                            <div className="w-full max-w-md mb-6 p-4 bg-primary/5 rounded-lg">
                                <div className="text-sm font-medium mb-2">
                                    {dir === 'rtl' ? 'المقاعد المختارة:' : 'Selected Seats:'}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSeats.map(seat => (
                                        <button
                                            key={seat}
                                            onClick={() => onDeselect?.(seat)}
                                            className="px-3 py-1.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/80 transition-colors flex items-center gap-1"
                                        >
                                            {seat}
                                            <span className="text-xs opacity-70">×</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Plane Nose Indicator */}
                        <div className="relative mb-8">
                            <div className="w-20 h-12 bg-slate-100 dark:bg-slate-800 rounded-t-full border-2 border-b-0 border-slate-200 dark:border-slate-700" />
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 pt-2">
                                {dir === 'rtl' ? 'الأمام' : 'FRONT'}
                            </div>
                        </div>

                        {/* Seat Grid */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                            {/* Column Headers */}
                            <div className="flex items-center justify-center gap-0 mb-4">
                                {cols.map((col, colIndex) => (
                                    col === "" ? (
                                        <div key={`header-aisle-${colIndex}`} className="w-9 m-0.5 text-center text-xs text-slate-400">

                                        </div>
                                    ) : (
                                        <div key={`header-${col}`} className="w-9 m-0.5 text-center text-xs font-semibold text-slate-500">
                                            {col}
                                        </div>
                                    )
                                ))}
                            </div>

                            {/* Seat Rows */}
                            <div className="space-y-1">
                                {Array.from({ length: rows }).map((_, rowIndex) => (
                                    <div key={rowIndex} className="flex items-center justify-center">
                                        <span className="w-6 text-right text-xs text-slate-400 mr-2">{rowIndex + 1}</span>
                                        {cols.map((col, colIndex) => {
                                            if (col === "") return <div key={`aisle-${rowIndex}-${colIndex}`} className="w-9 m-0.5" /> // Aisle

                                            const seatId = `${rowIndex + 1}${col}`
                                            const status = getSeatStatus(seatId)

                                            return (
                                                <Seat
                                                    key={seatId}
                                                    id={seatId}
                                                    status={status}
                                                    onSelect={handleSelect}
                                                />
                                            )
                                        })}
                                        <span className="w-6 text-left text-xs text-slate-400 ml-2">{rowIndex + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-6 mt-8 text-sm text-muted-foreground justify-center">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700" />
                                <span>{dir === 'rtl' ? 'متاح' : 'Available'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-primary rounded-sm" />
                                <span>{dir === 'rtl' ? 'محدد' : 'Selected'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 opacity-40 rounded-sm" />
                                <span>{dir === 'rtl' ? 'محجوز' : 'Occupied'}</span>
                            </div>
                        </div>

                        {/* Tip */}
                        <p className="text-xs text-muted-foreground mt-4 text-center">
                            {dir === 'rtl' ? 'انقر على مقعد لاختياره أو إلغاء اختياره' : 'Click a seat to select or deselect it'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }
)

SeatMap.displayName = 'SeatMap'
