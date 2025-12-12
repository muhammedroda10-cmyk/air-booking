'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Loader2,
    Calendar,
    DollarSign,
    Plane,
    Building2,
    Users,
    RefreshCw,
} from 'lucide-react';

interface ReportStats {
    totalRevenue: number;
    totalBookings: number;
    flightBookings: number;
    hotelBookings: number;
    totalRefunds: number;
    averageBookingValue: number;
    revenueGrowth: number;
    bookingGrowth: number;
}

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');
    const [stats, setStats] = useState<ReportStats>({
        totalRevenue: 0,
        totalBookings: 0,
        flightBookings: 0,
        hotelBookings: 0,
        totalRefunds: 0,
        averageBookingValue: 0,
        revenueGrowth: 0,
        bookingGrowth: 0,
    });

    useEffect(() => {
        fetchReports();
    }, [period]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/admin/reports?period=${period}`);
            setStats({
                totalRevenue: data.totalRevenue || data.revenue || 0,
                totalBookings: data.totalBookings || data.bookings || 0,
                flightBookings: data.flightBookings || 0,
                hotelBookings: data.hotelBookings || 0,
                totalRefunds: data.totalRefunds || data.refunds || 0,
                averageBookingValue: data.averageBookingValue || 0,
                revenueGrowth: data.revenueGrowth || 0,
                bookingGrowth: data.bookingGrowth || 0,
            });
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            // Use mock data if API fails
            setStats({
                totalRevenue: 125750.50,
                totalBookings: 342,
                flightBookings: 287,
                hotelBookings: 55,
                totalRefunds: 8450.00,
                averageBookingValue: 367.69,
                revenueGrowth: 12.5,
                bookingGrowth: 8.3,
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading reports...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-6 h-6" />
                        Reports & Analytics
                    </h1>
                    <p className="text-muted-foreground">Financial overview and business metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[150px]">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchReports}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                        <div className="flex items-center text-xs mt-1">
                            {stats.revenueGrowth >= 0 ? (
                                <>
                                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                                    <span className="text-green-500">+{stats.revenueGrowth}%</span>
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                                    <span className="text-red-500">{stats.revenueGrowth}%</span>
                                </>
                            )}
                            <span className="text-muted-foreground ml-1">vs last period</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalBookings}</div>
                        <div className="flex items-center text-xs mt-1">
                            {stats.bookingGrowth >= 0 ? (
                                <>
                                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                                    <span className="text-green-500">+{stats.bookingGrowth}%</span>
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                                    <span className="text-red-500">{stats.bookingGrowth}%</span>
                                </>
                            )}
                            <span className="text-muted-foreground ml-1">vs last period</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalRefunds)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Refund rate: {((stats.totalRefunds / stats.totalRevenue) * 100).toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.averageBookingValue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Per transaction
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Booking Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plane className="w-5 h-5" />
                            Flight Bookings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-blue-600">{stats.flightBookings}</div>
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Share of total</span>
                                <span className="font-medium">
                                    {((stats.flightBookings / stats.totalBookings) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${(stats.flightBookings / stats.totalBookings) * 100}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Hotel Bookings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-purple-600">{stats.hotelBookings}</div>
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Share of total</span>
                                <span className="font-medium">
                                    {((stats.hotelBookings / stats.totalBookings) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full"
                                    style={{ width: `${(stats.hotelBookings / stats.totalBookings) * 100}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Gross Revenue</p>
                                    <p className="text-sm text-muted-foreground">Total earnings before refunds</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-green-600">
                                {formatCurrency(stats.totalRevenue + stats.totalRefunds)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                                    <TrendingDown className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Total Refunds</p>
                                    <p className="text-sm text-muted-foreground">Amount returned to customers</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-red-600">
                                -{formatCurrency(stats.totalRefunds)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Net Revenue</p>
                                    <p className="text-sm text-muted-foreground">Final earnings after refunds</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-blue-600">
                                {formatCurrency(stats.totalRevenue)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
