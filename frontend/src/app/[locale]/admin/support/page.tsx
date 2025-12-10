'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Loader2,
    Search,
    MessageSquare,
    Clock,
    AlertTriangle,
    CheckCircle,
    Users,
    TrendingUp,
} from 'lucide-react';

interface Ticket {
    id: number;
    ticket_number: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    user?: { name: string; email: string };
    assigned_admin?: { name: string };
}

interface Stats {
    total: number;
    open: number;
    in_progress: number;
    awaiting_customer: number;
    resolved: number;
    closed: number;
    urgent: number;
    high_priority: number;
    unassigned: number;
}

interface Admin {
    id: number;
    name: string;
    email: string;
}

const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    awaiting_customer: 'bg-orange-100 text-orange-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
};

const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
};

export default function AdminSupportPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [assignmentFilter, setAssignmentFilter] = useState('all');

    useEffect(() => {
        fetchStatistics();
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [search, statusFilter, priorityFilter, assignmentFilter]);

    const fetchStatistics = async () => {
        try {
            const { data } = await api.get('/admin/support-tickets/statistics');
            setStats(data.stats);
            setAdmins(data.admins || []);
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    };

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (priorityFilter !== 'all') params.append('priority', priorityFilter);
            if (assignmentFilter !== 'all') params.append('assigned_to', assignmentFilter);

            const { data } = await api.get(`/admin/support-tickets?${params.toString()}`);
            setTickets(data.data || []);
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Support Tickets</h1>
                    <p className="text-muted-foreground">Manage customer support requests</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                                <div>
                                    <div className="text-2xl font-bold">{stats.total}</div>
                                    <div className="text-xs text-muted-foreground">Total</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-500" />
                                <div>
                                    <div className="text-2xl font-bold">{stats.open}</div>
                                    <div className="text-xs text-muted-foreground">Open</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                <div>
                                    <div className="text-2xl font-bold">{stats.in_progress}</div>
                                    <div className="text-xs text-muted-foreground">In Progress</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <div>
                                    <div className="text-2xl font-bold">{stats.urgent}</div>
                                    <div className="text-xs text-muted-foreground">Urgent</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-orange-500" />
                                <div>
                                    <div className="text-2xl font-bold">{stats.unassigned}</div>
                                    <div className="text-xs text-muted-foreground">Unassigned</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <div>
                                    <div className="text-2xl font-bold">{stats.resolved}</div>
                                    <div className="text-xs text-muted-foreground">Resolved</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by ticket # or subject..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="awaiting_customer">Awaiting</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Assignment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tickets</SelectItem>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                <SelectItem value="me">Assigned to Me</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No tickets found matching your filters.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ticket</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Assigned</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map((ticket) => (
                                    <TableRow
                                        key={ticket.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => router.push(`/admin/support/${ticket.id}`)}
                                    >
                                        <TableCell>
                                            <div>
                                                <div className="font-medium text-sm">
                                                    #{ticket.ticket_number}
                                                </div>
                                                <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                    {ticket.subject}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {ticket.user?.name || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {ticket.user?.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[ticket.status]}>
                                                {ticket.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={priorityColors[ticket.priority]}>
                                                {ticket.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {ticket.assigned_admin?.name || (
                                                <span className="text-muted-foreground">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(ticket.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
