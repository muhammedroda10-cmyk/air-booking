"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, Calendar, Clock, Wallet, ArrowRight, MapPin } from "lucide-react"
import { FlightPath } from "@/components/flight-path"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

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
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

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

    const upcomingBookings = bookings.filter(b => b.flight && new Date(b.flight.departure_time) > new Date())
    const nextTrip = upcomingBookings.sort((a, b) => new Date(a.flight.departure_time).getTime() - new Date(b.flight.departure_time).getTime())[0]

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <h2 className="text-2xl font-bold tracking-tight">Next Trip</h2>
                    {nextTrip ? (
                        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                            <CardContent className="p-0">
                                <div className="h-48 w-full relative">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
                                    <FlightPath />
                                </div>
                                <div className="p-6 md:p-8 relative z-10">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start">
                                            <div className="text-center md:text-left">
                                                <p className="text-4xl font-bold mb-1">{nextTrip.flight.origin_airport.code}</p>
                                                <p className="text-sm text-slate-300">{nextTrip.flight.origin_airport.city}</p>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <Plane className="w-6 h-6 text-primary rotate-90" />
                                                <div className="h-px w-24 bg-slate-600 border-t border-dashed border-slate-400" />
                                                <p className="text-xs text-slate-400">Direct Flight</p>
                                            </div>
                                            <div className="text-center md:text-right">
                                                <p className="text-4xl font-bold mb-1">{nextTrip.flight.destination_airport.code}</p>
                                                <p className="text-sm text-slate-300">{nextTrip.flight.destination_airport.city}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:items-end gap-2 text-center md:text-right">
                                            <div className="space-y-1">
                                                <p className="text-lg font-medium">{formatDate(nextTrip.flight.departure_time)}</p>
                                                <p className="text-sm text-slate-300">
                                                    Flight {nextTrip.flight.flight_number} • {nextTrip.flight.airline.name}
                                                </p>
                                            </div>
                                            <Button variant="secondary" className="mt-2">View E-Ticket</Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plane className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">No upcoming trips</h3>
                                <p className="text-muted-foreground mb-6">You haven't booked any flights yet.</p>
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
                        <h2 className="text-2xl font-bold tracking-tight">Recent Bookings</h2>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'upcoming'
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Upcoming
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'past'
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Past
                            </button>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {(activeTab === 'upcoming' ? upcomingBookings : bookings.filter(b => !upcomingBookings.includes(b))).length > 0 ? (
                                    (activeTab === 'upcoming' ? upcomingBookings : bookings.filter(b => !upcomingBookings.includes(b))).map((booking) => (
                                        <div key={booking.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                                    <Plane className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-lg">
                                                            {booking.flight ? `${booking.flight.origin_airport.city} to ${booking.flight.destination_airport.city}` : 'Flight details unavailable'}
                                                        </span>
                                                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                                            {booking.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {booking.flight ? formatDate(booking.flight.departure_time) : formatDate(booking.created_at)} • #{booking.pnr}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between w-full md:w-auto gap-8">
                                                <div className="text-right">
                                                    <span className="text-lg font-bold block">${booking.total_price}</span>
                                                    <span className="text-xs text-muted-foreground">Total Paid</span>
                                                </div>
                                                <Button variant="ghost" size="icon">
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-muted-foreground">
                                        No {activeTab} bookings found.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}

function StatsCard({ title, value, icon, className }: { title: string, value: string, icon: React.ReactNode, className?: string }) {
    return (
        <Card className={`border-0 shadow-sm ${className}`}>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-950 rounded-xl shadow-sm">
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
