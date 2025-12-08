"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Luggage, Utensils, Shield, Sparkles } from "lucide-react"
import api from "@/lib/api"
import { useLanguage } from "@/context/language-context"
import { cn } from "@/lib/utils"

interface Addon {
    id: number
    type: string
    name: string
    description: string
    price: number
    currency: string
}

interface BookingAddonsProps {
    flightId: number | string
    selectedAddons: { [key: number]: number } // addonId -> quantity
    onUpdate: (addons: { [key: number]: number }, totalCost: number) => void
}

export function BookingAddons({ flightId, selectedAddons, onUpdate }: BookingAddonsProps) {
    const { dir } = useLanguage()
    const [addons, setAddons] = React.useState<Addon[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        // Only fetch addons for numeric (local) flight IDs
        const numericId = typeof flightId === 'number' ? flightId : parseInt(String(flightId), 10)
        if (flightId && !isNaN(numericId) && numericId > 0) {
            fetchAddons()
        } else {
            setLoading(false)
        }
    }, [flightId])

    const fetchAddons = async () => {
        try {
            const response = await api.get(`/addons?flight_id=${flightId}`)
            setAddons(response.data)
        } catch (error) {
            console.error("Failed to fetch addons:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleQuantityChange = (addon: Addon, change: number) => {
        const currentQty = selectedAddons[addon.id] || 0
        const newQty = Math.max(0, currentQty + change)

        const newSelected = { ...selectedAddons }
        if (newQty === 0) {
            delete newSelected[addon.id]
        } else {
            newSelected[addon.id] = newQty
        }

        // Calculate total
        const total = Object.entries(newSelected).reduce((sum, [id, qty]) => {
            const item = addons.find(a => a.id === parseInt(id))
            return sum + (item ? item.price * qty : 0)
        }, 0)

        onUpdate(newSelected, total)
    }

    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'baggage': return Luggage
            case 'meal': return Utensils
            case 'insurance': return Shield
            default: return Sparkles
        }
    }

    if (loading) return <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>

    if (addons.length === 0) return null

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {dir === 'rtl' ? 'إضافات السفر' : 'Travel Add-ons'}
                </CardTitle>
                <CardDescription>
                    {dir === 'rtl' ? 'عزز رحلتك بهذه الخدمات الإضافية' : 'Enhance your trip with these extras'}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                {addons.map(addon => {
                    const Icon = getIcon(addon.type)
                    const qty = selectedAddons[addon.id] || 0

                    return (
                        <div
                            key={addon.id}
                            className={cn(
                                "flex items-start justify-between p-4 rounded-xl border transition-all duration-200",
                                qty > 0
                                    ? "bg-primary/5 border-primary shadow-sm"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50"
                            )}
                        >
                            <div className="flex gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                    qty > 0 ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm">{addon.name}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2 pr-4">{addon.description}</p>
                                    <div className="font-bold text-primary mt-1">
                                        ${addon.price} <span className="text-xs font-normal text-muted-foreground">/{dir === 'rtl' ? 'وحدة' : 'item'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-md"
                                        onClick={() => handleQuantityChange(addon, -1)}
                                        disabled={qty === 0}
                                    >
                                        <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="w-4 text-center text-sm font-medium">{qty}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-md hover:bg-primary hover:text-white"
                                        onClick={() => handleQuantityChange(addon, 1)}
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
