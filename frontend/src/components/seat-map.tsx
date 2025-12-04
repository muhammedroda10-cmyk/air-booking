"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface SeatProps {
    id: string
    status: "available" | "occupied" | "selected"
    onSelect: (id: string) => void
}

function Seat({ id, status, onSelect }: SeatProps) {
    return (
        <motion.button
            whileHover={status === "available" ? { scale: 1.1 } : {}}
            whileTap={status === "available" ? { scale: 0.9 } : {}}
            onClick={() => status !== "occupied" && onSelect(id)}
            disabled={status === "occupied"}
            className={cn(
                "w-8 h-8 rounded-t-lg rounded-b-sm m-1 flex items-center justify-center text-xs font-medium transition-colors",
                status === "available" && "bg-slate-200 hover:bg-primary/50 text-slate-600",
                status === "occupied" && "bg-slate-300 cursor-not-allowed opacity-50",
                status === "selected" && "bg-primary text-white shadow-lg shadow-primary/30"
            )}
        >
            {id}
        </motion.button>
    )
}

export function SeatMap({ onSelect }: { onSelect: (seatId: string) => void }) {
    const [selectedSeat, setSelectedSeat] = React.useState<string | null>(null)

    // Mock seat data
    const rows = 10
    const cols = ["A", "B", "C", "", "D", "E", "F"]

    const handleSelect = (seatId: string) => {
        setSelectedSeat(seatId)
        onSelect(seatId)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Select Your Seat</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center">
                    {/* Plane Nose Indicator */}
                    <div className="w-16 h-16 border-t-4 border-l-4 border-r-4 border-slate-200 rounded-t-full mb-8 opacity-50" />

                    <div className="space-y-2">
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <div key={rowIndex} className="flex items-center justify-center gap-2">
                                {cols.map((col, colIndex) => {
                                    if (col === "") return <div key={`aisle-${rowIndex}`} className="w-8" /> // Aisle

                                    const seatId = `${rowIndex + 1}${col}`
                                    const isOccupied = Math.random() < 0.3 // Randomly occupy seats
                                    const status = selectedSeat === seatId ? "selected" : isOccupied ? "occupied" : "available"

                                    return (
                                        <Seat
                                            key={seatId}
                                            id={seatId}
                                            status={status}
                                            onSelect={handleSelect}
                                        />
                                    )
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex gap-6 mt-8 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-slate-200 rounded-sm" />
                            <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-primary rounded-sm" />
                            <span>Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-slate-300 opacity-50 rounded-sm" />
                            <span>Occupied</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
