"use client"

import { UserLayout } from "@/components/layouts/user-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, Calendar, Clock, Wallet, ArrowRight, Star } from "lucide-react"
import { FlightPath } from "@/components/flight-path"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"

interface Booking {
    id: number;
    pnr: string;
    total_price: number;
    status: string;
    created_at: string;
    flight?: {
        flight_number: string;
        departure_time: string;
        arrival_time: string;
        airline: { name: string };
        origin_airport: { code: string; city: string };
        destination_airport: { code: string; city: string };
    };
    flight_details?: {
        origin: string;
        origin_city: string;
        destination: string;
        destination_city: string;
        departure_datetime: string;
        arrival_datetime: string;
        airline: string;
        flight_number: string;
    };
}

export default function AccountPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0)
    const [loyaltyTier, setLoyaltyTier] = useState<string>('Bronze')
    const [walletBalance, setWalletBalance] = useState<number | null>(null)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch all dashboard data in parallel
                const [bookingsRes, loyaltyRes, walletRes] = await Promise.allSettled([
                    api.get('/bookings'),
                    api.get('/loyalty'),
                    api.get('/wallet')
                ])

                // Handle bookings
                if (bookingsRes.status === 'fulfilled') {
                    setBookings(bookingsRes.value.data)
                }

                // Handle loyalty points
                if (loyaltyRes.status === 'fulfilled') {
                    const loyaltyData = loyaltyRes.value.data.data || loyaltyRes.value.data
                    setLoyaltyPoints(loyaltyData.points || loyaltyData.total_points || 0)
                    setLoyaltyTier(loyaltyData.tier || loyaltyData.current_tier || 'Bronze')
                }

                // Handle wallet
                if (walletRes.status === 'fulfilled') {
                    const walletData = walletRes.value.data.data || walletRes.value.data
                    setWalletBalance(walletData.balance ?? walletData.amount ?? null)
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchDashboardData()
    }, [])

    // Helper functions to get flight data from either structure
    const getRouteDisplay = (booking: Booking) => {
        if (booking.flight?.origin_airport?.code && booking.flight?.destination_airport?.code) {
            return `${booking.flight.origin_airport.code} → ${booking.flight.destination_airport.code}`;
        }
        if (booking.flight_details?.origin && booking.flight_details?.destination) {
            return `${booking.flight_details.origin} → ${booking.flight_details.destination}`;
        }
        return booking.pnr || 'N/A';
    };

    const getDepartureTime = (booking: Booking) => {
        return booking.flight?.departure_time || booking.flight_details?.departure_datetime || booking.created_at;
    };

    const upcomingBookings = bookings.filter(b => {
        const depTime = getDepartureTime(b);
        return depTime && new Date(depTime) > new Date() && b.status !== 'cancelled';
    });
    const nextTrip = upcomingBookings.sort((a, b) =>
        new Date(getDepartureTime(a)).getTime() - new Date(getDepartureTime(b)).getTime()
    )[0];

    if (loading) {
        return (
            <UserLayout>
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="text-center">
                        <LoadingSpinner size="lg" className="mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading your dashboard...</p>
                    </div>
                </div>
            </UserLayout>
        )
    }

    return (
        <UserLayout>
            <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Upcoming Trips"
                        value={upcomingBookings.length.toString()}
                        icon={<Plane className="w-5 h-5 text-blue-600" />}
                        className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20"
                    />
                    <StatsCard
                        title="Total Bookings"
                        value={bookings.length.toString()}
                        icon={<Clock className="w-5 h-5 text-teal-600" />}
                        className="bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/20"
                    />
                    <Link href="/account/loyalty">
                        <StatsCard
                            title="Loyalty Points"
                            value={loyaltyPoints.toLocaleString()}
                            subtitle={loyaltyTier}
                            icon={<Star className="w-5 h-5 text-amber-500" />}
                            className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20 hover:shadow-md transition-all cursor-pointer"
                        />
                    </Link>
                    <Link href="/account/wallet">
                        <StatsCard
                            title="Wallet Balance"
                            value={walletBalance !== null ? `$${walletBalance.toFixed(2)}` : 'View'}
                            icon={<Wallet className="w-5 h-5 text-green-600" />}
                            className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20 hover:shadow-md transition-all cursor-pointer"
                        />
                    </Link>
                </div>

                {/* Next Trip Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold tracking-tight">Your Next Trip</h2>
                    {nextTrip ? (() => {
                        // Calculate countdown
                        const departureDate = new Date(getDepartureTime(nextTrip))
                        const now = new Date()
                        const diffMs = departureDate.getTime() - now.getTime()
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

                        return (
                            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                                <CardContent className="p-0">
                                    <div className="h-40 w-full relative">
                                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
                                        <FlightPath />
                                        {/* Countdown Badge */}
                                        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 text-center">
                                            <p className="text-2xl font-bold text-white">
                                                {diffDays > 0 ? (
                                                    <><span className="text-primary">{diffDays}</span> {diffDays === 1 ? 'day' : 'days'}</>
                                                ) : (
                                                    <><span className="text-primary">{diffHours}</span> {diffHours === 1 ? 'hour' : 'hours'}</>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-300">until departure</p>
                                        </div>
                                    </div>
                                    <div className="p-6 relative z-10">
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                                                <div className="text-center md:text-left">
                                                    <p className="text-3xl font-bold mb-1">{nextTrip.flight?.origin_airport?.code || nextTrip.flight_details?.origin || '---'}</p>
                                                    <p className="text-sm text-slate-300">{nextTrip.flight?.origin_airport?.city || nextTrip.flight_details?.origin_city || ''}</p>
                                                </div>
                                                <div className="flex flex-col items-center gap-2">
                                                    <Plane className="w-5 h-5 text-primary rotate-90" />
                                                    <div className="h-px w-16 bg-slate-600 border-t border-dashed border-slate-400" />
                                                </div>
                                                <div className="text-center md:text-right">
                                                    <p className="text-3xl font-bold mb-1">{nextTrip.flight?.destination_airport?.code || nextTrip.flight_details?.destination || '---'}</p>
                                                    <p className="text-sm text-slate-300">{nextTrip.flight?.destination_airport?.city || nextTrip.flight_details?.destination_city || ''}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:items-end gap-2 text-center md:text-right">
                                                <p className="text-base font-medium">{formatDate(getDepartureTime(nextTrip))}</p>
                                                <p className="text-sm text-slate-300">
                                                    {nextTrip.flight?.flight_number || nextTrip.flight_details?.flight_number || nextTrip.pnr} • {nextTrip.flight?.airline?.name || nextTrip.flight_details?.airline || 'Airline'}
                                                </p>
                                                {/* Quick Actions */}
                                                <div className="flex gap-2 mt-2">
                                                    <Link href={`/account/bookings/flight/${nextTrip.id}`}>
                                                        <Button variant="secondary" size="sm">View Ticket</Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-white/20 text-white hover:bg-white/10"
                                                        onClick={async () => {
                                                            try {
                                                                const response = await api.get(`/bookings/${nextTrip.id}/download`, { responseType: 'blob' })
                                                                const url = window.URL.createObjectURL(new Blob([response.data]))
                                                                const link = document.createElement('a')
                                                                link.href = url
                                                                link.setAttribute('download', `ticket-${nextTrip.pnr}.pdf`)
                                                                document.body.appendChild(link)
                                                                link.click()
                                                                link.remove()
                                                            } catch (e) { console.error('Download failed', e) }
                                                        }}
                                                    >
                                                        Download
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })() : (
                        <Card className="border-dashed">
                            <CardContent className="p-10 text-center">
                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plane className="w-7 h-7 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">No upcoming trips</h3>
                                <p className="text-muted-foreground mb-4">You haven't booked any flights yet.</p>
                                <Link href="/flights">
                                    <Button>Book a Flight</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Recent Bookings */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight">Recent Bookings</h2>
                        <Link href="/account/history">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {bookings.slice(0, 4).length > 0 ? (
                                    bookings.slice(0, 4).map((booking) => (
                                        <Link key={booking.id} href={`/account/bookings/flight/${booking.id}`}>
                                            <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                                        <Plane className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-semibold text-sm">
                                                                {getRouteDisplay(booking)}
                                                            </span>
                                                            <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                                                {booking.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDate(getDepartureTime(booking))}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-sm">${booking.total_price}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No bookings found.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </UserLayout >
    )
}

function StatsCard({ title, value, subtitle, icon, className }: { title: string, value: string, subtitle?: string, icon: React.ReactNode, className?: string }) {
    return (
        <Card className={`border-0 shadow-sm ${className}`}>
            <CardContent className="p-5 flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">{title}</p>
                    <p className="text-xl font-bold tracking-tight">{value}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl shadow-sm">
                    {icon}
                </div>
            </CardContent>
        </Card>
    )
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    })
}
