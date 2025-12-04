'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, Users, Building2, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>({
        flights: 0,
        bookings: 0,
        users: 0,
        airlines: 0,
        recent_bookings: [],
        revenue: { total: 0, monthly: [] }
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch stats', error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Flights"
                    value={stats.flights}
                    icon={<Plane className="h-4 w-4 text-muted-foreground" />}
                />
                <StatsCard
                    title="Total Bookings"
                    value={stats.bookings}
                    icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
                />
                <StatsCard
                    title="Registered Users"
                    value={stats.users}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
                <StatsCard
                    title="Total Revenue"
                    value={`$${stats.revenue?.total || 0}`}
                    icon={<div className="h-4 w-4 text-green-500 font-bold">$</div>}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recent_bookings?.map((booking: any) => (
                                <div key={booking.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium">{booking.user.name}</p>
                                        <p className="text-sm text-muted-foreground">{booking.flight.airline.name} • {booking.pnr}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">${booking.total_price}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-end justify-between gap-2">
                            {stats.revenue?.monthly?.map((value: number, index: number) => (
                                <div key={index} className="w-full bg-blue-100 rounded-t-md relative group">
                                    <div
                                        className="bg-blue-500 rounded-t-md absolute bottom-0 w-full transition-all duration-500"
                                        style={{ height: `${(value / 5000) * 100}%` }}
                                    ></div>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
                                        ${value}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon }: { title: string, value: number | string, icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}
