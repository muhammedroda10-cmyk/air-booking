'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Search,
    Loader2,
    Send,
    User,
    Clock,
    Mail,
    Phone,
    Plane,
    MessageSquare,
    MoreVertical,
    CheckCircle,
    AlertCircle,
    XCircle,
    RefreshCw,
    ChevronDown,
    Inbox,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Message {
    id: number;
    user_id: number;
    message: string;
    created_at: string;
    is_internal_note?: boolean;
    user?: {
        id: number;
        name: string;
        role?: string;
    };
}

interface Ticket {
    id: number;
    ticket_number: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        created_at?: string;
    };
    booking?: {
        id: number;
        pnr: string;
        status: string;
        total_price?: number;
    };
    messages: Message[];
    assigned_to?: number;
}

const statusColors: Record<string, string> = {
    open: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    awaiting_customer: 'bg-orange-500',
    resolved: 'bg-green-500',
    closed: 'bg-gray-400',
};

const priorityColors: Record<string, string> = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
};

const categoryLabels: Record<string, string> = {
    booking_issue: 'Booking Issue',
    payment_issue: 'Payment Issue',
    refund_request: 'Refund Request',
    flight_change: 'Flight Change',
    general_inquiry: 'General Inquiry',
    complaint: 'Complaint',
};

export default function SupportDashboardPage() {
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingTicket, setLoadingTicket] = useState(false);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('open');
    const [showInfo, setShowInfo] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

    useEffect(() => {
        scrollToBottom();
    }, [selectedTicket?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }
            params.append('per_page', '50');
            const { data } = await api.get(`/admin/support-tickets?${params.toString()}`);
            const ticketList = data.data || data.tickets?.data || data.tickets || [];
            setTickets(Array.isArray(ticketList) ? ticketList : []);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load tickets', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketDetails = async (ticketId: number) => {
        try {
            setLoadingTicket(true);
            const { data } = await api.get(`/admin/support-tickets/${ticketId}`);
            setSelectedTicket(data.ticket || data);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load ticket details', variant: 'destructive' });
        } finally {
            setLoadingTicket(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTicket) return;

        setSending(true);
        try {
            await api.post(`/admin/support-tickets/${selectedTicket.id}/reply`, {
                message: newMessage,
            });
            setNewMessage('');
            fetchTicketDetails(selectedTicket.id);
            toast({ title: 'Reply sent' });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to send reply',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedTicket) return;
        try {
            await api.put(`/admin/support-tickets/${selectedTicket.id}`, { status: newStatus });
            fetchTicketDetails(selectedTicket.id);
            fetchTickets();
            toast({ title: 'Status updated' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatFullDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const filteredTickets = tickets.filter(ticket => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            ticket.ticket_number.toLowerCase().includes(query) ||
            ticket.subject.toLowerCase().includes(query) ||
            ticket.user.name.toLowerCase().includes(query) ||
            ticket.user.email.toLowerCase().includes(query)
        );
    });

    return (
        <div className="h-[calc(100vh-120px)] flex bg-background rounded-lg border overflow-hidden">
            {/* Left Sidebar - Conversations List */}
            <div className="w-80 border-r flex flex-col bg-muted/30">
                {/* Header */}
                <div className="p-4 border-b bg-background">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Inbox className="w-5 h-5" />
                            Inbox
                        </h2>
                        <Button variant="ghost" size="icon" onClick={fetchTickets}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="px-4 py-2 border-b flex gap-1 overflow-x-auto">
                    {['open', 'in_progress', 'awaiting_customer', 'resolved', 'all'].map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'default' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs whitespace-nowrap"
                            onClick={() => setStatusFilter(status)}
                        >
                            {status === 'all' ? 'All' : status.replace('_', ' ')}
                        </Button>
                    ))}
                </div>

                {/* Ticket List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No conversations</p>
                        </div>
                    ) : (
                        filteredTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className={cn(
                                    'p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors',
                                    selectedTicket?.id === ticket.id && 'bg-muted'
                                )}
                                onClick={() => fetchTicketDetails(ticket.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                            {getInitials(ticket.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm truncate">{ticket.user.name}</span>
                                            <span className="text-xs text-muted-foreground">{formatTime(ticket.updated_at)}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{ticket.subject}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className={cn('w-2 h-2 rounded-full', statusColors[ticket.status])} />
                                            <span className={cn('text-xs font-medium', priorityColors[ticket.priority])}>
                                                {ticket.priority}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {!selectedTicket ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                        <h3 className="text-lg font-medium mb-1">Select a conversation</h3>
                        <p className="text-sm">Choose a ticket from the list to view details</p>
                    </div>
                ) : loadingTicket ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-4 border-b flex items-center justify-between bg-background">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {getInitials(selectedTicket.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{selectedTicket.user.name}</div>
                                    <div className="text-xs text-muted-foreground">#{selectedTicket.ticket_number}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                                    <SelectTrigger className="h-8 w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="awaiting_customer">Awaiting Customer</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowInfo(!showInfo)}
                                >
                                    <User className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                            {/* Initial message / ticket info */}
                            <div className="text-center">
                                <Badge variant="secondary" className="mb-4">
                                    {categoryLabels[selectedTicket.category] || selectedTicket.category}
                                </Badge>
                                <h3 className="font-medium mb-1">{selectedTicket.subject}</h3>
                                <p className="text-xs text-muted-foreground">
                                    Created {formatFullDate(selectedTicket.created_at)}
                                </p>
                            </div>

                            {selectedTicket.messages?.map((message) => {
                                const isStaff = message.user?.role === 'admin' || message.user_id !== selectedTicket.user.id;

                                return (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            'flex gap-3',
                                            isStaff ? 'flex-row-reverse' : ''
                                        )}
                                    >
                                        <Avatar className="w-8 h-8 flex-shrink-0">
                                            <AvatarFallback className={cn(
                                                'text-xs',
                                                isStaff ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                            )}>
                                                {message.user ? getInitials(message.user.name) : '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn('max-w-[70%]', isStaff ? 'text-right' : '')}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-medium">{message.user?.name || 'Unknown'}</span>
                                                {isStaff && <Badge variant="secondary" className="text-xs h-5">Staff</Badge>}
                                                <span className="text-xs text-muted-foreground">
                                                    {formatFullDate(message.created_at)}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                'p-3 rounded-2xl',
                                                isStaff
                                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                    : 'bg-background border rounded-tl-sm'
                                            )}>
                                                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Input */}
                        {selectedTicket.status !== 'closed' && (
                            <div className="p-4 border-t bg-background">
                                <form onSubmit={handleSendReply} className="flex gap-2">
                                    <Input
                                        placeholder="Type your reply..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        disabled={sending}
                                        className="flex-1"
                                    />
                                    <Button type="submit" disabled={sending || !newMessage.trim()}>
                                        {sending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Right Sidebar - Customer Info */}
            {selectedTicket && showInfo && (
                <div className="w-72 border-l bg-background overflow-y-auto">
                    <div className="p-4">
                        {/* Customer Info */}
                        <div className="text-center mb-6">
                            <Avatar className="w-16 h-16 mx-auto mb-3">
                                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                    {getInitials(selectedTicket.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold">{selectedTicket.user.name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedTicket.user.email}</p>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="truncate">{selectedTicket.user.email}</span>
                            </div>
                            {selectedTicket.user.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{selectedTicket.user.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>Customer since {selectedTicket.user.created_at ? new Date(selectedTicket.user.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>

                        {/* Ticket Details */}
                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-3 text-sm">Ticket Details</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge className={cn('text-xs', statusColors[selectedTicket.status].replace('bg-', 'bg-'))}>
                                        {selectedTicket.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Priority</span>
                                    <span className={cn('font-medium', priorityColors[selectedTicket.priority])}>
                                        {selectedTicket.priority}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Category</span>
                                    <span>{categoryLabels[selectedTicket.category] || selectedTicket.category}</span>
                                </div>
                            </div>
                        </div>

                        {/* Related Booking */}
                        {selectedTicket.booking && (
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
                                    <Plane className="w-4 h-4" />
                                    Related Booking
                                </h4>
                                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-muted-foreground">PNR</span>
                                        <span className="font-mono font-medium">{selectedTicket.booking.pnr}</span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge variant="outline">{selectedTicket.booking.status}</Badge>
                                    </div>
                                    {selectedTicket.booking.total_price && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Amount</span>
                                            <span>${selectedTicket.booking.total_price}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-medium mb-3 text-sm">Quick Actions</h4>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => handleStatusChange('resolved')}
                                    disabled={selectedTicket.status === 'resolved'}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                    Mark as Resolved
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => handleStatusChange('closed')}
                                    disabled={selectedTicket.status === 'closed'}
                                >
                                    <XCircle className="w-4 h-4 mr-2 text-gray-500" />
                                    Close Ticket
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
