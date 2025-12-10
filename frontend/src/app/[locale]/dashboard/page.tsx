'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Ticket,
    DollarSign,
    Users,
    Headphones,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

interface Stats {
    bookings: {
        total: number;
        today: number;
        pending: number;
    };
    revenue: {
        total: number;
        today: number;
    };
    users: {
        total: number;
        new_today: number;
    };
    support: {
        open: number;
        pending: number;
    };
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/admin/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleGreeting = () => {
        if (user?.role === 'admin') return 'Super Admin';
        // Could extend to show specific role name
        return 'Staff Member';
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                <p className="text-muted-foreground mt-1">
                    Here&apos;s what&apos;s happening with your platform today.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Bookings
                        </CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : stats?.bookings?.total || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +{stats?.bookings?.today || 0} today
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${loading ? '...' : (stats?.revenue?.total || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +${stats?.revenue?.today || 0} today
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : stats?.users?.total || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +{stats?.users?.new_today || 0} new today
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Open Tickets
                        </CardTitle>
                        <Headphones className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : stats?.support?.open || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.support?.pending || 0} awaiting response
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Pending Bookings</h3>
                            <p className="text-sm text-muted-foreground">
                                {stats?.bookings?.pending || 0} require attention
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Process Refunds</h3>
                            <p className="text-sm text-muted-foreground">
                                Handle customer refund requests
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Support Tickets</h3>
                            <p className="text-sm text-muted-foreground">
                                {stats?.support?.open || 0} tickets need response
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Role Badge */}
            <div className="text-sm text-muted-foreground">
                Logged in as <span className="font-medium text-foreground">{getRoleGreeting()}</span>
            </div>
        </div>
    );
}
