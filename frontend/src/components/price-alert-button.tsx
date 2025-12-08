"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Bell, BellRing, TrendingDown, Check, X, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { useLanguage } from "@/context/language-context"
import { cn } from "@/lib/utils"

interface PriceAlertButtonProps {
    originCode: string
    destinationCode: string
    departureDate: string
    returnDate?: string
    currentPrice?: number
    tripType?: "one_way" | "round_trip"
    passengers?: number
    cabinClass?: string
    className?: string
    variant?: "icon" | "button"
}

export function PriceAlertButton({
    originCode,
    destinationCode,
    departureDate,
    returnDate,
    currentPrice,
    tripType = "one_way",
    passengers = 1,
    cabinClass = "economy",
    className,
    variant = "icon"
}: PriceAlertButtonProps) {
    const { dir } = useLanguage()
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [success, setSuccess] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [targetPrice, setTargetPrice] = React.useState<string>(
        currentPrice ? Math.floor(currentPrice * 0.9).toString() : ""
    )
    const [hasExistingAlert, setHasExistingAlert] = React.useState(false)

    // Check for existing alert when dialog opens
    React.useEffect(() => {
        if (open) {
            checkExistingAlert()
        }
    }, [open])

    const checkExistingAlert = async () => {
        try {
            const response = await api.get("/price-alerts")
            const alerts = response.data
            const existing = alerts.find((alert: any) =>
                alert.origin_code === originCode &&
                alert.destination_code === destinationCode &&
                alert.departure_date === departureDate &&
                alert.is_active
            )
            setHasExistingAlert(!!existing)
        } catch (e) {
            // Ignore errors - user might not be logged in
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await api.post("/price-alerts", {
                origin_code: originCode,
                destination_code: destinationCode,
                departure_date: departureDate,
                return_date: returnDate,
                trip_type: tripType,
                target_price: targetPrice ? parseFloat(targetPrice) : null,
                passengers,
                cabin_class: cabinClass,
            })

            setSuccess(true)
            setTimeout(() => {
                setOpen(false)
                setSuccess(false)
            }, 2000)
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create alert")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {variant === "icon" ? (
                        <button
                            className={cn(
                                "p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors",
                                className
                            )}
                            title={dir === "rtl" ? "تم إنشاء التنبيه" : "Alert Created"}
                        >
                            <Check className="w-5 h-5" />
                        </button>
                    ) : (
                        <Button variant="outline" className={cn("gap-2", className)}>
                            <Check className="w-4 h-4" />
                            {dir === "rtl" ? "تم إنشاء التنبيه" : "Alert Created"}
                        </Button>
                    )}
                </DialogTrigger>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {variant === "icon" ? (
                    <button
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            hasExistingAlert
                                ? "bg-primary/10 text-primary"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
                            className
                        )}
                        title={dir === "rtl" ? "تنبيه السعر" : "Price Alert"}
                    >
                        {hasExistingAlert ? (
                            <BellRing className="w-5 h-5" />
                        ) : (
                            <Bell className="w-5 h-5" />
                        )}
                    </button>
                ) : (
                    <Button variant="outline" className={cn("gap-2", className)}>
                        <Bell className="w-4 h-4" />
                        {dir === "rtl" ? "تنبيه السعر" : "Set Price Alert"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-primary" />
                        </div>
                        {dir === "rtl" ? "إنشاء تنبيه سعر" : "Create Price Alert"}
                    </DialogTitle>
                    <DialogDescription>
                        {dir === "rtl"
                            ? "سنرسل لك إشعاراً عندما ينخفض السعر إلى السعر المستهدف"
                            : "We'll notify you when the price drops to your target"}
                    </DialogDescription>
                </DialogHeader>

                {hasExistingAlert ? (
                    <div className="py-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <BellRing className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                            {dir === "rtl"
                                ? "لديك بالفعل تنبيه نشط لهذه الرحلة"
                                : "You already have an active alert for this route"}
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setOpen(false)}
                        >
                            {dir === "rtl" ? "حسناً" : "Got it"}
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            {/* Route Display */}
                            <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <span className="text-2xl font-bold">{originCode}</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-2xl font-bold">{destinationCode}</span>
                            </div>

                            {/* Date */}
                            <div className="text-center text-slate-600 dark:text-slate-300">
                                <p>{new Date(departureDate).toLocaleDateString(dir === "rtl" ? "ar-SA" : "en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                })}</p>
                            </div>

                            {/* Current Price */}
                            {currentPrice && (
                                <div className="text-center">
                                    <p className="text-sm text-slate-500">
                                        {dir === "rtl" ? "السعر الحالي" : "Current Price"}
                                    </p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ${currentPrice.toFixed(2)}
                                    </p>
                                </div>
                            )}

                            {/* Target Price Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {dir === "rtl" ? "السعر المستهدف (اختياري)" : "Target Price (optional)"}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                    <Input
                                        type="number"
                                        placeholder={dir === "rtl" ? "أدخل السعر المستهدف" : "Enter target price"}
                                        value={targetPrice}
                                        onChange={(e) => setTargetPrice(e.target.value)}
                                        className="pl-8"
                                        min="1"
                                        step="0.01"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    {dir === "rtl"
                                        ? "أو اتركه فارغاً للحصول على إشعار بأي انخفاض في السعر"
                                        : "Leave empty to get notified of any price drops"}
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                                    <X className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                {dir === "rtl" ? "إلغاء" : "Cancel"}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {dir === "rtl" ? "جاري الإنشاء..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <Bell className="w-4 h-4 mr-2" />
                                        {dir === "rtl" ? "إنشاء التنبيه" : "Create Alert"}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
