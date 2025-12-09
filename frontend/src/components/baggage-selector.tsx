"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Luggage, Package, Briefcase, Check } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import { cn } from "@/lib/utils"

interface BaggageOption {
    id: string
    name: string
    weight: number // in kg
    price: number
    description: string
    icon: "carry-on" | "checked" | "heavy"
    included?: boolean
}

const DEFAULT_BAGGAGE_OPTIONS: BaggageOption[] = [
    {
        id: "carry-on",
        name: "Carry-On Only",
        weight: 7,
        price: 0,
        description: "1 personal item + 1 cabin bag (7kg)",
        icon: "carry-on",
        included: true
    },
    {
        id: "standard",
        name: "Standard Luggage",
        weight: 23,
        price: 35,
        description: "Carry-on + 1 checked bag (23kg)",
        icon: "checked"
    },
    {
        id: "extra",
        name: "Extra Luggage",
        weight: 32,
        price: 65,
        description: "Carry-on + 1 checked bag (32kg)",
        icon: "checked"
    },
    {
        id: "heavy",
        name: "Heavy Luggage",
        weight: 46,
        price: 95,
        description: "Carry-on + 2 checked bags (23kg each)",
        icon: "heavy"
    }
]

interface BaggageSelectorProps {
    passengerCount: number
    segments?: { id: string; origin: string; destination: string }[]
    selectedBaggage: { [passengerId: number]: { [segmentId: string]: string } }
    onUpdate: (baggage: { [passengerId: number]: { [segmentId: string]: string } }, totalCost: number) => void
    options?: BaggageOption[]
}

export function BaggageSelector({
    passengerCount,
    segments = [{ id: "default", origin: "", destination: "" }],
    selectedBaggage,
    onUpdate,
    options = DEFAULT_BAGGAGE_OPTIONS
}: BaggageSelectorProps) {
    const { dir } = useLanguage()

    const getIcon = (iconType: string) => {
        switch (iconType) {
            case "carry-on": return Briefcase
            case "heavy": return Package
            default: return Luggage
        }
    }

    const handleBaggageChange = (passengerId: number, segmentId: string, optionId: string) => {
        const newSelection = { ...selectedBaggage }
        if (!newSelection[passengerId]) {
            newSelection[passengerId] = {}
        }
        newSelection[passengerId][segmentId] = optionId

        // Calculate total cost
        let totalCost = 0
        Object.values(newSelection).forEach(passengerSegments => {
            Object.values(passengerSegments).forEach(optionId => {
                const option = options.find(o => o.id === optionId)
                if (option) {
                    totalCost += option.price
                }
            })
        })

        onUpdate(newSelection, totalCost)
    }

    // Initialize default selections if not set
    React.useEffect(() => {
        const newSelection = { ...selectedBaggage }
        let changed = false

        for (let i = 0; i < passengerCount; i++) {
            if (!newSelection[i]) {
                newSelection[i] = {}
                changed = true
            }
            segments.forEach(segment => {
                if (!newSelection[i][segment.id]) {
                    newSelection[i][segment.id] = "carry-on"
                    changed = true
                }
            })
        }

        if (changed) {
            onUpdate(newSelection, 0)
        }
    }, [passengerCount, segments])

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Luggage className="w-5 h-5 text-primary" />
                    {dir === 'rtl' ? 'اختر وزن الأمتعة' : 'Choose Baggage Weight'}
                </CardTitle>
                <CardDescription>
                    {dir === 'rtl'
                        ? 'اختر حجم الأمتعة لكل راكب ورحلة'
                        : 'Select baggage allowance for each passenger and flight'}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                {Array.from({ length: passengerCount }).map((_, passengerIdx) => (
                    <div key={passengerIdx} className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                                {passengerIdx + 1}
                            </div>
                            <span className="font-semibold">
                                {dir === 'rtl' ? `المسافر ${passengerIdx + 1}` : `Passenger ${passengerIdx + 1}`}
                            </span>
                        </div>

                        {segments.map((segment, segmentIdx) => (
                            <div key={segment.id} className="ml-8">
                                {segments.length > 1 && (
                                    <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs">
                                            {segmentIdx + 1}
                                        </span>
                                        {segment.origin} → {segment.destination}
                                    </div>
                                )}

                                <RadioGroup
                                    value={selectedBaggage[passengerIdx]?.[segment.id] || "carry-on"}
                                    onValueChange={(value) => handleBaggageChange(passengerIdx, segment.id, value)}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                >
                                    {options.map(option => {
                                        const Icon = getIcon(option.icon)
                                        const isSelected = selectedBaggage[passengerIdx]?.[segment.id] === option.id

                                        return (
                                            <Label
                                                key={option.id}
                                                htmlFor={`baggage-${passengerIdx}-${segment.id}-${option.id}`}
                                                className={cn(
                                                    "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                                                    isSelected
                                                        ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50"
                                                )}
                                            >
                                                <RadioGroupItem
                                                    value={option.id}
                                                    id={`baggage-${passengerIdx}-${segment.id}-${option.id}`}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Icon className={cn(
                                                            "w-4 h-4",
                                                            isSelected ? "text-primary" : "text-slate-400"
                                                        )} />
                                                        <span className="font-semibold text-sm">{option.name}</span>
                                                        {option.included && (
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                {dir === 'rtl' ? 'مجاني' : 'FREE'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {option.description}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {option.weight}kg
                                                        </span>
                                                        <span className={cn(
                                                            "font-bold text-sm",
                                                            option.included ? "text-green-600 dark:text-green-400" : "text-primary"
                                                        )}>
                                                            {option.included ? (dir === 'rtl' ? 'مشمول' : 'Included') : `+$${option.price}`}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <Check className="w-4 h-4 text-primary shrink-0" />
                                                )}
                                            </Label>
                                        )
                                    })}
                                </RadioGroup>
                            </div>
                        ))}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export default BaggageSelector
