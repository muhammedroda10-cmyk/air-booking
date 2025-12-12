'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    Plane,
    Building2,
    RefreshCw,
    Loader2,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Pause,
    Play,
    Volume2,
    VolumeX,
    Eye,
    DollarSign,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface LiveBooking {
    id: number;
    uuid: string;
    pnr: string;
    status: string;
    payment_status: string;
    total_price: number;
    created_at: string;
    updated_at: string;
    type: 'flight' | 'hotel';
    user?: {
        id: number;
        name: string;
        email: string;
    };
    flight?: {
        flight_number: string;
        airline?: { name: string };
    };
    hotel?: {
        name: string;
    };
    isNew?: boolean;
    needsRevalidation?: boolean;
}

export default function LiveBookingsPage() {
    const { toast } = useToast();
    const [bookings, setBookings] = useState<LiveBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [revalidating, setRevalidating] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        onHold: 0,
        todayRevenue: 0,
    });

    // Track known booking IDs to detect truly new ones
    const knownBookingIdsRef = useRef<Set<number>>(new Set());
    const isInitialLoadRef = useRef(true);

    const playNotificationSound = useCallback(() => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
        }
    }, [soundEnabled]);

    const fetchBookings = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);

            const { data } = await api.get('/admin/live-bookings');
            const newBookings: LiveBooking[] = (data.bookings || []).map((b: LiveBooking) => ({
                ...b,
                type: b.hotel ? 'hotel' : 'flight',
                isNew: false, // Default to not new
            }));

            // Only check for new bookings AFTER initial load
            if (!isInitialLoadRef.current && knownBookingIdsRef.current.size > 0) {
                const newlyArrivedBookings: LiveBooking[] = [];

                newBookings.forEach((b: LiveBooking) => {
                    if (!knownBookingIdsRef.current.has(b.id)) {
                        b.isNew = true;
                        newlyArrivedBookings.push(b);

                        // Remove the "new" flag after 5 seconds
                        setTimeout(() => {
                            setBookings(prev => prev.map(pb =>
                                pb.id === b.id ? { ...pb, isNew: false } : pb
                            ));
                        }, 5000);
                    }
                });

                if (newlyArrivedBookings.length > 0) {
                    playNotificationSound();
                    toast({
                        title: `${newlyArrivedBookings.length} New Booking${newlyArrivedBookings.length > 1 ? 's' : ''}!`,
                        description: 'A new booking has just been placed.',
                    });
                }
            }

            // Update known booking IDs
            knownBookingIdsRef.current = new Set(newBookings.map((b: LiveBooking) => b.id));

            // Mark initial load as complete
            isInitialLoadRef.current = false;

            setBookings(newBookings);
            setStats(data.stats || {
                total: newBookings.length,
                pending: newBookings.filter((b: LiveBooking) => b.status === 'pending').length,
                confirmed: newBookings.filter((b: LiveBooking) => b.status === 'confirmed').length,
                onHold: newBookings.filter((b: LiveBooking) => b.status === 'on_hold').length,
                todayRevenue: newBookings.reduce((sum: number, b: LiveBooking) =>
                    b.payment_status === 'paid' ? sum + Number(b.total_price) : sum, 0
                ),
            });
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch live bookings:', error);
        } finally {
            setLoading(false);
        }
    }, [playNotificationSound, toast]);

    // Revalidate on-hold booking
    const revalidateBooking = async (booking: LiveBooking) => {
        try {
            setRevalidating(booking.id);
            const { data } = await api.post(`/admin/bookings/${booking.id}/revalidate`);

            if (data.status !== booking.status) {
                toast({
                    title: 'Status Updated',
                    description: `Booking ${booking.uuid} is now ${data.status}`,
                });
                setBookings(prev => prev.map(b =>
                    b.id === booking.id ? { ...b, status: data.status, needsRevalidation: false } : b
                ));
            } else {
                toast({
                    title: 'No Change',
                    description: 'Booking status is still the same',
                });
            }
        } catch (error) {
            toast({
                title: 'Revalidation Failed',
                description: 'Could not check booking status',
                variant: 'destructive',
            });
        } finally {
            setRevalidating(null);
        }
    };

    // Polling effect (fallback when WebSocket not available)
    useEffect(() => {
        fetchBookings(true);

        // Try to set up WebSocket connection
        let unsubscribe: (() => void) | null = null;
        let wsConnected = false;

        const setupWebSocket = async () => {
            try {
                const { subscribeToBookings } = await import('@/lib/echo');

                unsubscribe = subscribeToBookings(
                    // On new booking
                    (booking) => {
                        wsConnected = true;
                        playNotificationSound();
                        toast({
                            title: 'New Booking!',
                            description: `Booking ${booking.uuid} just arrived.`,
                        });

                        const newBooking: LiveBooking = {
                            ...booking,
                            type: booking.hotel ? 'hotel' : 'flight',
                            isNew: true,
                        };

                        setBookings(prev => [newBooking, ...prev]);
                        knownBookingIdsRef.current.add(booking.id);
                        setLastUpdate(new Date());

                        // Update stats
                        setStats(prev => ({
                            ...prev,
                            total: prev.total + 1,
                            pending: booking.status === 'pending' ? prev.pending + 1 : prev.pending,
                            confirmed: booking.status === 'confirmed' ? prev.confirmed + 1 : prev.confirmed,
                            onHold: booking.status === 'on_hold' ? prev.onHold + 1 : prev.onHold,
                            todayRevenue: booking.payment_status === 'paid'
                                ? prev.todayRevenue + Number(booking.total_price)
                                : prev.todayRevenue,
                        }));

                        // Remove "new" highlight after 5 seconds
                        setTimeout(() => {
                            setBookings(prev => prev.map(pb =>
                                pb.id === booking.id ? { ...pb, isNew: false } : pb
                            ));
                        }, 5000);
                    },
                    // On booking updated
                    (booking) => {
                        setBookings(prev => prev.map(pb =>
                            pb.id === booking.id ? { ...pb, ...booking } : pb
                        ));
                        setLastUpdate(new Date());
                    }
                );
            } catch (error) {
                console.warn('WebSocket not available, using polling fallback', error);
            }
        };

        setupWebSocket();

        // Polling as fallback (less frequent when WebSocket is working)
        if (!isPaused) {
            pollIntervalRef.current = setInterval(() => {
                // Poll less frequently if WebSocket is connected
                if (!wsConnected || !unsubscribe) {
                    fetchBookings(false);
                }
            }, wsConnected ? 30000 : 10000); // 30s with WS, 10s without
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isPaused]);

    // Auto-revalidate on-hold bookings every 30 seconds
    useEffect(() => {
        const revalidateInterval = setInterval(() => {
            const onHoldBookings = bookings.filter(b => b.status === 'on_hold');
            onHoldBookings.forEach(b => {
                if (!revalidating) {
                    // Mark as needing revalidation
                    setBookings(prev => prev.map(pb =>
                        pb.id === b.id ? { ...pb, needsRevalidation: true } : pb
                    ));
                }
            });
        }, 30000);

        return () => clearInterval(revalidateInterval);
    }, [bookings, revalidating]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'on_hold': return <AlertCircle className="w-4 h-4 text-orange-500" />;
            case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            confirmed: 'bg-green-100 text-green-700 border-green-200',
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            on_hold: 'bg-orange-100 text-orange-700 border-orange-200',
            cancelled: 'bg-red-100 text-red-700 border-red-200',
        };
        return (
            <Badge variant="outline" className={cn('font-medium', styles[status] || '')}>
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading live bookings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Hidden audio element for notifications */}
            <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="w-6 h-6 text-green-500" />
                        Live Bookings
                        {!isPaused && (
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                        )}
                    </h1>
                    <p className="text-muted-foreground">
                        Real-time booking feed • Last updated: {formatTimeAgo(lastUpdate)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsPaused(!isPaused)}
                        title={isPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
                    >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => fetchBookings(false)}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Today's Bookings</p>
                    </CardContent>
                </Card>
                <Card className="border-yellow-200 bg-yellow-50/50">
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">Pending</p>
                    </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-green-700">{stats.confirmed}</div>
                        <p className="text-xs text-muted-foreground">Confirmed</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-200 bg-orange-50/50">
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-orange-700">{stats.onHold}</div>
                        <p className="text-xs text-muted-foreground">On Hold</p>
                    </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-blue-700">
                            ${stats.todayRevenue.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Today's Revenue</p>
                    </CardContent>
                </Card>
            </div>

            {/* Live Feed */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Live Feed</CardTitle>
                </CardHeader>
                <CardContent>
                    {bookings.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No bookings today yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {bookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-lg border transition-all duration-500",
                                        booking.isNew
                                            ? "bg-green-50 border-green-300 animate-pulse"
                                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
                                        booking.needsRevalidation && "ring-2 ring-orange-400"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            booking.type === 'flight' ? "bg-blue-100" : "bg-purple-100"
                                        )}>
                                            {booking.type === 'flight'
                                                ? <Plane className="w-5 h-5 text-blue-600" />
                                                : <Building2 className="w-5 h-5 text-purple-600" />
                                            }
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/dashboard/bookings?id=${booking.id}`}
                                                    className="font-mono text-sm font-medium text-primary hover:underline cursor-pointer"
                                                >
                                                    {booking.uuid}
                                                </Link>
                                                {getStatusBadge(booking.status)}
                                                {booking.isNew && (
                                                    <Badge className="bg-green-500 text-white animate-bounce">NEW</Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                <User className="w-3 h-3" />
                                                {booking.user?.name || 'Unknown'}
                                                <span className="text-xs">•</span>
                                                <span className="font-mono">{booking.pnr}</span>
                                                <span className="text-xs">•</span>
                                                <Clock className="w-3 h-3" />
                                                {formatTime(booking.created_at)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="font-semibold flex items-center gap-1">
                                                <DollarSign className="w-4 h-4" />
                                                {Number(booking.total_price).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {booking.payment_status}
                                            </div>
                                        </div>

                                        {booking.status === 'on_hold' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => revalidateBooking(booking)}
                                                disabled={revalidating === booking.id}
                                                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                            >
                                                {revalidating === booking.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 mr-1" />
                                                        Check
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        <Link href={`/dashboard/bookings?id=${booking.id}`}>
                                            <Button variant="ghost" size="icon" title="View booking details">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
