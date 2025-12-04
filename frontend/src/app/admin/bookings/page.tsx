"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, Eye, XCircle, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { cn } from "@/lib/utils"

interface Booking {
    id: number
    pnr: string
    status: string
    total_price: number
    created_at: string
    user: {
        name: string
        email: string
    }
    flight: {
        flight_number: string
        airline: {
            name: string
        }
        origin_airport: {
            code: string
            city: string
        }
        destination_airport: {
            code: string
            city: string
        }
    }
}

interface Airline {
    id: number
    name: string
}

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("all")
    const [airlineId, setAirlineId] = useState("all")
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [airlines, setAirlines] = useState<Airline[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchAirlines()
    }, [])

    useEffect(() => {
        fetchBookings()
    }, [page, search, status, airlineId, date])

    const fetchAirlines = async () => {
        try {
            const response = await api.get('/airlines')
            setAirlines(response.data.data || response.data)
        } catch (error) {
            console.error("Failed to fetch airlines", error)
        }
    }

    const fetchBookings = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                ...(search && { search }),
                ...(status !== 'all' && { status }),
                ...(airlineId !== 'all' && { airline_id: airlineId }),
                ...(date && { start_date: format(date, 'yyyy-MM-dd'), end_date: format(date, 'yyyy-MM-dd') })
            })

            const response = await api.get(`/admin/bookings?${params.toString()}`)
            setBookings(response.data.data)
            setTotalPages(response.data.last_page)
        } catch (error) {
            console.error("Failed to fetch bookings", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return <Badge className="bg-green-500 hover:bg-green-600">Confirmed</Badge>
            case 'pending':
                return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
            case 'cancelled':
                return <Badge className="bg-red-500 hover:bg-red-600">Cancelled</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Bookings Management</h1>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search PNR or Passenger..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={airlineId} onValueChange={setAirlineId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Airline" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Airlines</SelectItem>
                                {airlines.map((airline) => (
                                    <SelectItem key={airline.id} value={airline.id.toString()}>
                                        {airline.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <DateRangePicker
                            mode="single"
                            date={date}
                            setDate={setDate}
                            placeholder="Pick a date"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PNR</TableHead>
                                <TableHead>Passenger</TableHead>
                                <TableHead>Flight</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        Loading bookings...
                                    </TableCell>
                                </TableRow>
                            ) : bookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No bookings found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-mono font-medium">{booking.pnr}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{booking.user.name}</span>
                                                <span className="text-xs text-muted-foreground">{booking.user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{booking.flight.airline.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {booking.flight.flight_number} • {booking.flight.origin_airport.code} → {booking.flight.destination_airport.code}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(new Date(booking.created_at), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="font-medium">${booking.total_price}</TableCell>
                                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" title="View Details">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {booking.status !== 'cancelled' && (
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" title="Cancel Booking">
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex justify-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <span className="flex items-center px-4 text-sm font-medium">
                    Page {page} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
