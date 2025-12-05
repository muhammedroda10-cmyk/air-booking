"use client"

import { UserLayout } from "@/components/layouts/user-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, Calendar, Clock, Wallet, ArrowRight } from "lucide-react"
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
    flight: {
        flight_number: string;
        departure_time: string;
        arrival_time: string;
        airline: { name: string };
        origin_airport: { code: string; city: string };
        destination_airport: { code: string; city: string };
    };
}

export default function DashboardPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await api.get('/bookings')
                setBookings(response.data)
            } catch (error) {
                console.error("Failed to fetch bookings", error)
            } finally {
                setLoading(false)
            }
        }
        fetchBookings()
    }, [])

    const upcomingBookings = bookings.filter(b => b.flight && new Date(b.flight.departure_time) > new Date() && b.status !== 'cancelled')
    const nextTrip = upcomingBookings.sort((a, b) => new Date(a.flight.departure_time).getTime() - new Date(b.flight.departure_time).getTime())[0]

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
                    <StatsCard
                        title="Loyalty Points"
                        value={(bookings.length * 150).toLocaleString()}
                        icon={<Calendar className="w-5 h-5 text-indigo-600" />}
                        className="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20"
                    />
                    <Link href="/dashboard/wallet">
                        <StatsCard
                            title="Wallet Balance"
                            value="View Wallet"
                            icon={<Wallet className="w-5 h-5 text-green-600" />}
                            className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20 hover:shadow-md transition-all cursor-pointer"
                        />
                    </Link>
                </div>

                {/* Next Trip Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold tracking-tight">Your Next Trip</h2>
                    {nextTrip ? (
                        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                            <CardContent className="p-0">
                                <div className="h-40 w-full relative">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
                                    <FlightPath />
                                </div>
                                <div className="p-6 relative z-10">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                                            <div className="text-center md:text-left">
                                                <p className="text-3xl font-bold mb-1">{nextTrip.flight.origin_airport.code}</p>
                                                <p className="text-sm text-slate-300">{nextTrip.flight.origin_airport.city}</p>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <Plane className="w-5 h-5 text-primary rotate-90" />
                                                <div className="h-px w-16 bg-slate-600 border-t border-dashed border-slate-400" />
                                            </div>
                                            <div className="text-center md:text-right">
                                                <p className="text-3xl font-bold mb-1">{nextTrip.flight.destination_airport.code}</p>
                                                <p className="text-sm text-slate-300">{nextTrip.flight.destination_airport.city}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:items-end gap-2 text-center md:text-right">
                                            <p className="text-base font-medium">{formatDate(nextTrip.flight.departure_time)}</p>
                                            <p className="text-sm text-slate-300">
                                                {nextTrip.flight.flight_number} • {nextTrip.flight.airline.name}
                                            </p>
                                            <Link href={`/dashboard/tickets/${nextTrip.id}`}>
                                                <Button variant="secondary" size="sm" className="mt-2">View Ticket</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
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
                        <Link href="/dashboard/history">
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
                                        <Link key={booking.id} href={`/dashboard/tickets/${booking.id}`}>
                                            <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                                        <Plane className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-semibold text-sm">
                                                                {booking.flight ? `${booking.flight.origin_airport.code} → ${booking.flight.destination_airport.code}` : 'N/A'}
                                                            </span>
                                                            <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                                                {booking.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {booking.flight ? formatDate(booking.flight.departure_time) : formatDate(booking.created_at)}
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
        </UserLayout>
    )
}

function StatsCard({ title, value, icon, className }: { title: string, value: string, icon: React.ReactNode, className?: string }) {
    return (
        <Card className={`border-0 shadow-sm ${className}`}>
            <CardContent className="p-5 flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">{title}</p>
                    <p className="text-xl font-bold tracking-tight">{value}</p>
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
