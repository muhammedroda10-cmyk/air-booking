'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Headphones,
    Search,
    Loader2,
    MessageSquare,
    Clock,
    Eye,
} from 'lucide-react';

interface Ticket {
    id: number;
    ticket_number: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export default function SupportPage() {
    const { toast } = useToast();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
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
            const { data } = await api.get(`/admin/support-tickets?${params.toString()}`);
            setTickets(data.tickets?.data || data.tickets || []);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load tickets',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            open: 'bg-blue-100 text-blue-700',
            pending: 'bg-yellow-100 text-yellow-700',
            resolved: 'bg-green-100 text-green-700',
            closed: 'bg-gray-100 text-gray-700',
        };
        return <Badge className={styles[status] || 'bg-gray-100'}>{status}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            urgent: 'bg-red-100 text-red-700',
            high: 'bg-orange-100 text-orange-700',
            medium: 'bg-yellow-100 text-yellow-700',
            low: 'bg-gray-100 text-gray-700',
        };
        return <Badge variant="outline" className={styles[priority]}>{priority}</Badge>;
    };

    const filteredTickets = tickets.filter(ticket => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            ticket.ticket_number.toLowerCase().includes(query) ||
            ticket.subject.toLowerCase().includes(query) ||
            ticket.user.name.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Support Tickets</h1>
                <p className="text-muted-foreground">Manage customer support requests</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by ticket #, subject, or name..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tickets List */}
            <div className="space-y-3">
                {filteredTickets.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Headphones className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Tickets Found</h3>
                        </CardContent>
                    </Card>
                ) : (
                    filteredTickets.map((ticket) => (
                        <Card key={ticket.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <MessageSquare className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">#{ticket.ticket_number}</span>
                                                {getStatusBadge(ticket.status)}
                                                {getPriorityBadge(ticket.priority)}
                                            </div>
                                            <div className="text-sm font-medium">{ticket.subject}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {ticket.user.name} • {ticket.category}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </div>
                                        <Link href={`/admin/support/${ticket.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
