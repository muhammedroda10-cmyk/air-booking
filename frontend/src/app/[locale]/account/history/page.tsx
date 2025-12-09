'use client';

import { UserLayout } from "@/components/layouts/user-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plane, Filter, Search, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/loading";

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

    if (loading) {
        return (
            <UserLayout>
                <div className="flex items-center justify-center min-h-[40vh]">
                    <LoadingSpinner size="lg" />
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Travel History</h2>
                        <p className="text-muted-foreground">View all your past and current bookings.</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-8 h-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-9">
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
                                placeholder="Filter by date"
                            />

                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-9">
                                <XCircle className="w-4 h-4 mr-1" />
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {filteredBookings.length > 0 ? (
                    <div className="grid gap-3">
                        {filteredBookings.map((booking) => (
                            <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="p-4 flex-1 flex items-center gap-4 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="text-center min-w-[50px]">
                                                    <p className="text-lg font-bold">{booking.flight?.origin_airport.code}</p>
                                                    <p className="text-[10px] text-muted-foreground">{booking.flight?.origin_airport.city}</p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-1 justify-center">
                                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                                                    <Plane className="w-4 h-4 text-slate-400 rotate-90" />
                                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                                                </div>
                                                <div className="text-center min-w-[50px]">
                                                    <p className="text-lg font-bold">{booking.flight?.destination_airport.code}</p>
                                                    <p className="text-[10px] text-muted-foreground">{booking.flight?.destination_airport.city}</p>
                                                </div>
                                            </div>
                                            <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                                {booking.status}
                                            </Badge>
                                        </div>

                                        <div className="p-4 w-full md:w-56 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between md:flex-col md:items-end md:justify-center gap-2">
                                            <div className="text-sm space-y-0.5">
                                                <p className="text-muted-foreground text-xs">{booking.flight ? format(new Date(booking.flight.departure_time), 'MMM d, yyyy') : 'N/A'}</p>
                                                <p className="font-bold">${booking.total_price}</p>
                                            </div>
                                            <Link href={`/account/tickets/${booking.id}`}>
                                                <Button size="sm" variant="outline">View</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="p-10 text-center">
                            <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-lg font-medium mb-1">No bookings found</h3>
                            <p className="text-muted-foreground text-sm mb-3">Try adjusting your filters.</p>
                            <Button variant="link" size="sm" onClick={clearFilters}>
                                Clear filters
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </UserLayout>
    );
}
