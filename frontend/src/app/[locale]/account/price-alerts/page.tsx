"use client"

import * as React from "react"
import { UserLayout } from "@/components/layouts/user-layout"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"
import {
    Bell,
    BellOff,
    Trash2,
    TrendingDown,
    TrendingUp,
    RefreshCw,
    Plane,
    Calendar,
    DollarSign,
    AlertCircle,
    Plus
} from "lucide-react"
import { useLanguage } from "@/context/language-context"
import api from "@/lib/api"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PriceAlert {
    id: number
    route: string
    origin_code: string
    destination_code: string
    departure_date: string
    return_date: string | null
    trip_type: string
    target_price: number | null
    current_price: number | null
    lowest_price: number | null
    currency: string
    passengers: number
    cabin_class: string
    is_active: boolean
    last_checked_at: string | null
    is_below_target: boolean
    created_at: string
}

export default function PriceAlertsPage() {
    const { dir } = useLanguage()
    const [alerts, setAlerts] = React.useState<PriceAlert[]>([])
    const [loading, setLoading] = React.useState(true)
    const [refreshingId, setRefreshingId] = React.useState<number | null>(null)
    const [deletingId, setDeletingId] = React.useState<number | null>(null)

    React.useEffect(() => {
        fetchAlerts()
    }, [])

    const fetchAlerts = async () => {
        try {
            const response = await api.get("/price-alerts")
            setAlerts(response.data)
        } catch (error) {
            console.error("Failed to fetch price alerts:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async (alertId: number) => {
        try {
            const response = await api.post(`/price-alerts/${alertId}/toggle`)
            setAlerts(prev => prev.map(alert =>
                alert.id === alertId
                    ? { ...alert, is_active: response.data.is_active }
                    : alert
            ))
        } catch (error) {
            console.error("Failed to toggle alert:", error)
        }
    }

    const handleRefresh = async (alertId: number) => {
        setRefreshingId(alertId)
        try {
            const response = await api.post(`/price-alerts/${alertId}/check`)
            setAlerts(prev => prev.map(alert =>
                alert.id === alertId
                    ? {
                        ...alert,
                        current_price: response.data.current_price,
                        lowest_price: response.data.lowest_price,
                        last_checked_at: "just now"
                    }
                    : alert
            ))
        } catch (error) {
            console.error("Failed to refresh price:", error)
        } finally {
            setRefreshingId(null)
        }
    }

    const handleDelete = async (alertId: number) => {
        if (!confirm(dir === "rtl" ? "هل تريد حذف هذا التنبيه؟" : "Delete this price alert?")) {
            return
        }

        setDeletingId(alertId)
        try {
            await api.delete(`/price-alerts/${alertId}`)
            setAlerts(prev => prev.filter(alert => alert.id !== alertId))
        } catch (error) {
            console.error("Failed to delete alert:", error)
        } finally {
            setDeletingId(null)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(dir === "rtl" ? "ar-SA" : "en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        })
    }

    if (loading) {
        return (
            <UserLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <p className="text-muted-foreground mt-4">
                            {dir === "rtl" ? "جاري تحميل التنبيهات..." : "Loading alerts..."}
                        </p>
                    </div>
                </div>
            </UserLayout>
        )
    }

    return (
        <UserLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {dir === "rtl" ? "تنبيهات الأسعار" : "Price Alerts"}
                        </h1>
                        <p className="text-muted-foreground">
                            {dir === "rtl"
                                ? "تابع أسعار الرحلات واحصل على إشعارات عند انخفاضها"
                                : "Track flight prices and get notified when they drop"}
                        </p>
                    </div>
                    <Link href="/flights">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            {dir === "rtl" ? "تنبيه جديد" : "New Alert"}
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                        {dir === "rtl" ? "إجمالي التنبيهات" : "Total Alerts"}
                                    </p>
                                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                                        {alerts.length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                                    <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                        {dir === "rtl" ? "تحت السعر المستهدف" : "Below Target"}
                                    </p>
                                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                                        {alerts.filter(a => a.is_below_target).length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                        {dir === "rtl" ? "نشط" : "Active"}
                                    </p>
                                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                                        {alerts.filter(a => a.is_active).length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                                    <RefreshCw className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts List */}
                {alerts.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-16 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Bell className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                {dir === "rtl" ? "لا توجد تنبيهات" : "No Price Alerts"}
                            </h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                {dir === "rtl"
                                    ? "ابحث عن رحلة وأنشئ تنبيهاً للحصول على إشعار عند انخفاض السعر"
                                    : "Search for a flight and create an alert to get notified when prices drop"}
                            </p>
                            <Link href="/flights">
                                <Button>
                                    <Plane className="w-4 h-4 mr-2" />
                                    {dir === "rtl" ? "بحث عن رحلات" : "Search Flights"}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert) => (
                            <Card
                                key={alert.id}
                                className={cn(
                                    "transition-all",
                                    !alert.is_active && "opacity-60",
                                    alert.is_below_target && "border-green-300 bg-green-50/50 dark:bg-green-900/10"
                                )}
                            >
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                        {/* Route */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-bold">{alert.origin_code}</span>
                                                    <Plane className="w-5 h-5 text-primary rotate-90" />
                                                    <span className="text-2xl font-bold">{alert.destination_code}</span>
                                                </div>
                                                {alert.is_below_target && (
                                                    <Badge className="bg-green-500 text-white">
                                                        <TrendingDown className="w-3 h-3 mr-1" />
                                                        {dir === "rtl" ? "السعر منخفض!" : "Price Drop!"}
                                                    </Badge>
                                                )}
                                                {!alert.is_active && (
                                                    <Badge variant="secondary">
                                                        {dir === "rtl" ? "متوقف" : "Paused"}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(alert.departure_date)}
                                                </span>
                                                <span className="capitalize">{alert.cabin_class}</span>
                                                <span>{alert.passengers} {dir === "rtl" ? "مسافر" : "passenger(s)"}</span>
                                            </div>
                                        </div>

                                        {/* Prices */}
                                        <div className="flex items-center gap-6">
                                            {alert.target_price && (
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground mb-1">
                                                        {dir === "rtl" ? "السعر المستهدف" : "Target"}
                                                    </p>
                                                    <p className="text-lg font-semibold text-slate-600">
                                                        ${alert.target_price}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    {dir === "rtl" ? "السعر الحالي" : "Current"}
                                                </p>
                                                <p className={cn(
                                                    "text-xl font-bold",
                                                    alert.is_below_target ? "text-green-600" : "text-slate-800 dark:text-slate-200"
                                                )}>
                                                    {alert.current_price ? `$${alert.current_price}` : "—"}
                                                </p>
                                            </div>
                                            {alert.lowest_price && (
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground mb-1">
                                                        {dir === "rtl" ? "أدنى سعر" : "Lowest"}
                                                    </p>
                                                    <p className="text-lg font-semibold text-green-600">
                                                        ${alert.lowest_price}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleRefresh(alert.id)}
                                                disabled={refreshingId === alert.id}
                                                title={dir === "rtl" ? "تحديث السعر" : "Refresh Price"}
                                            >
                                                <RefreshCw className={cn(
                                                    "w-4 h-4",
                                                    refreshingId === alert.id && "animate-spin"
                                                )} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleToggle(alert.id)}
                                                title={alert.is_active
                                                    ? (dir === "rtl" ? "إيقاف" : "Pause")
                                                    : (dir === "rtl" ? "تفعيل" : "Activate")}
                                            >
                                                {alert.is_active ? (
                                                    <BellOff className="w-4 h-4" />
                                                ) : (
                                                    <Bell className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleDelete(alert.id)}
                                                disabled={deletingId === alert.id}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                title={dir === "rtl" ? "حذف" : "Delete"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Last checked */}
                                    {alert.last_checked_at && (
                                        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                                            {dir === "rtl" ? "آخر تحديث: " : "Last checked: "}
                                            {alert.last_checked_at}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    )
}
