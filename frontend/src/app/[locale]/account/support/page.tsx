'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { UserLayout } from '@/components/layouts/user-layout';
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
    Plus,
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Loader2,
} from 'lucide-react';

interface Ticket {
    id: number;
    ticket_number: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    updated_at: string;
    booking_id?: number;
    messages?: { id: number }[];
}

interface Stats {
    total: number;
    open: number;
    resolved: number;
    closed: number;
}

const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    awaiting_customer: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
};

const categoryLabels: Record<string, string> = {
    booking_issue: 'Booking Issue',
    payment_issue: 'Payment Issue',
    refund_request: 'Refund Request',
    flight_change: 'Flight Change',
    general_inquiry: 'General Inquiry',
    complaint: 'Complaint',
};

export default function SupportTicketsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, open: 0, resolved: 0, closed: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }
            const { data } = await api.get(`/support-tickets?${params.toString()}`);
            setTickets(data.tickets?.data || data.tickets || []);
            setStats(data.stats || { total: 0, open: 0, resolved: 0, closed: 0 });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load support tickets',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open':
            case 'in_progress':
                return <Clock className="w-4 h-4" />;
            case 'resolved':
            case 'closed':
                return <CheckCircle className="w-4 h-4" />;
            case 'awaiting_customer':
                return <AlertCircle className="w-4 h-4" />;
            default:
                return <MessageSquare className="w-4 h-4" />;
        }
    };

    return (
        <UserLayout>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Support Tickets</h1>
                        <p className="text-muted-foreground mt-1">
                            View and manage your support requests
                        </p>
                    </div>
                    <Button onClick={() => router.push('/account/support/new')} className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Ticket
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <div className="text-sm text-muted-foreground">Total Tickets</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
                            <div className="text-sm text-muted-foreground">Open</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                            <div className="text-sm text-muted-foreground">Resolved</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
                            <div className="text-sm text-muted-foreground">Closed</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <div className="flex gap-4 mb-6">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Tickets</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="awaiting_customer">Awaiting Response</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Tickets List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : tickets.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
                            <p className="text-muted-foreground mb-4">
                                You haven&apos;t created any support tickets yet.
                            </p>
                            <Button onClick={() => router.push('/account/support/new')}>
                                Create Your First Ticket
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <Card
                                key={ticket.id}
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/account/support/${ticket.id}`)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    #{ticket.ticket_number}
                                                </span>
                                                <Badge className={statusColors[ticket.status] || ''}>
                                                    {getStatusIcon(ticket.status)}
                                                    <span className="ml-1 capitalize">
                                                        {ticket.status.replace('_', ' ')}
                                                    </span>
                                                </Badge>
                                                <Badge variant="outline" className={priorityColors[ticket.priority]}>
                                                    {ticket.priority}
                                                </Badge>
                                            </div>
                                            <h3 className="font-semibold truncate mb-1">{ticket.subject}</h3>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>{categoryLabels[ticket.category] || ticket.category}</span>
                                                <span>•</span>
                                                <span>{formatDate(ticket.created_at)}</span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
