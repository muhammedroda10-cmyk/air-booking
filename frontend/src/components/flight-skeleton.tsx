"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FlightSkeletonProps {
    count?: number
    className?: string
}

function SkeletonPulse({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-700 rounded", className)} />
    )
}

function SingleFlightSkeleton() {
    return (
        <Card className="p-6 bg-white dark:bg-slate-900 border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Airline Logo */}
                <div className="flex-shrink-0">
                    <SkeletonPulse className="w-14 h-14 rounded-xl" />
                </div>

                {/* Flight Route Info */}
                <div className="flex-1 w-full">
                    <div className="flex items-center justify-between gap-4">
                        {/* Departure */}
                        <div className="text-center min-w-[80px]">
                            <SkeletonPulse className="h-8 w-16 mx-auto mb-2" />
                            <SkeletonPulse className="h-4 w-12 mx-auto" />
                        </div>

                        {/* Flight Path */}
                        <div className="flex-1 flex items-center gap-2 px-4">
                            <SkeletonPulse className="h-2 flex-1" />
                            <div className="relative">
                                <SkeletonPulse className="w-8 h-8 rounded-full" />
                            </div>
                            <SkeletonPulse className="h-2 flex-1" />
                        </div>

                        {/* Arrival */}
                        <div className="text-center min-w-[80px]">
                            <SkeletonPulse className="h-8 w-16 mx-auto mb-2" />
                            <SkeletonPulse className="h-4 w-12 mx-auto" />
                        </div>
                    </div>

                    {/* Duration & Stops */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <SkeletonPulse className="h-4 w-20" />
                        <SkeletonPulse className="h-5 w-16 rounded-full" />
                    </div>
                </div>

                {/* Price & Book */}
                <div className="flex flex-col items-end gap-3 min-w-[120px]">
                    <SkeletonPulse className="h-8 w-24" />
                    <SkeletonPulse className="h-4 w-16" />
                    <SkeletonPulse className="h-10 w-28 rounded-lg" />
                </div>
            </div>

            {/* Amenities Strip */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <SkeletonPulse className="h-5 w-24" />
                <SkeletonPulse className="h-5 w-20" />
                <SkeletonPulse className="h-5 w-28" />
            </div>
        </Card>
    )
}

export function FlightSkeleton({ count = 3, className }: FlightSkeletonProps) {
    return (
        <div className={cn("space-y-6", className)}>
            {Array.from({ length: count }).map((_, index) => (
                <SingleFlightSkeleton key={index} />
            ))}
        </div>
    )
}

export function FlightSkeletonCompact() {
    return (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
                <SkeletonPulse className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                    <SkeletonPulse className="h-5 w-32 mb-2" />
                    <SkeletonPulse className="h-4 w-24" />
                </div>
                <SkeletonPulse className="h-6 w-20" />
            </div>
        </div>
    )
}
