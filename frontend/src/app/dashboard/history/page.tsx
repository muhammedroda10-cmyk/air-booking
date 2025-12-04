'use client';

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plane, Calendar as CalendarIcon, Filter, Search, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Booking {
    id: number;
    pnr: string;
    status: string;
    created_at: string;
    total_price: number;
    flight: {
        flight_number: string;
        departure_time: string;
        arrival_time: string;
        airline: { name: string };
        origin_airport: { code: string; city: string };
        destination_airport: { code: string; city: string };
    };
}

export default function HistoryPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [date, setDate] = useState<Date | undefined>(undefined);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await api.get('/bookings');
                setBookings(response.data);
                setFilteredBookings(response.data);
            } catch (error) {
                console.error("Failed to fetch bookings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    useEffect(() => {
        let result = bookings;

        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(b =>
                b.pnr.toLowerCase().includes(lowerSearch) ||
                b.flight?.airline.name.toLowerCase().includes(lowerSearch) ||
                b.flight?.origin_airport.city.toLowerCase().includes(lowerSearch) ||
                b.flight?.destination_airport.city.toLowerCase().includes(lowerSearch)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(b => b.status.toLowerCase() === statusFilter);
        }

        if (date) {
            const filterDate = format(date, 'yyyy-MM-dd');
            result = result.filter(b => b.flight?.departure_time.startsWith(filterDate));
        }

        setFilteredBookings(result);
    }, [bookings, search, statusFilter, date]);

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setDate(undefined);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Travel History</h1>
                        <p className="text-muted-foreground">View and manage your past and upcoming trips.</p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export History
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search PNR, City, Airline..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

                            <DateRangePicker
                                mode="single"
                                date={date}
                                setDate={setDate}
                                placeholder="Pick a date"
                            />

                            <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                                <XCircle className="w-4 h-4 mr-2" />
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="text-center py-12">Loading history...</div>
                ) : filteredBookings.length > 0 ? (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => (
                            <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="p-6 flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between mb-4">
                                                <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="uppercase">
                                                    {booking.status}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground font-mono">#{booking.pnr}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-center min-w-[60px]">
                                                    <p className="text-2xl font-bold">{booking.flight?.origin_airport.code}</p>
                                                    <p className="text-xs text-muted-foreground">{booking.flight?.origin_airport.city}</p>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center px-4">
                                                    <Plane className="w-5 h-5 text-slate-400 rotate-90 mb-1" />
                                                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700 relative">
                                                        <div className="absolute left-1/2 -translate-x-1/2 -top-2 px-2 bg-white dark:bg-slate-950 text-[10px] text-muted-foreground">
                                                            Direct
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-center min-w-[60px]">
                                                    <p className="text-2xl font-bold">{booking.flight?.destination_airport.code}</p>
                                                    <p className="text-xs text-muted-foreground">{booking.flight?.destination_airport.city}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Date</span>
                                                    <span className="font-medium">{booking.flight ? format(new Date(booking.flight.departure_time), 'MMM d, yyyy') : 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Time</span>
                                                    <span className="font-medium">{booking.flight ? format(new Date(booking.flight.departure_time), 'h:mm a') : 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Airline</span>
                                                    <span className="font-medium">{booking.flight?.airline.name}</span>
                                                </div>
                                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                    <span className="font-bold text-lg">${booking.total_price}</span>
                                                    <span className="text-xs text-muted-foreground">Paid</span>
                                                </div>
                                            </div>
                                            <Link href={`/dashboard/tickets/${booking.id}`}>
                                                <Button className="w-full mt-4" variant="outline" size="sm">
                                                    View Ticket
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Filter className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">No bookings found</h3>
                            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                            <Button variant="link" onClick={clearFilters} className="mt-2">
                                Clear all filters
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}

