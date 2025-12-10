'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth-context';
import { UserLayout } from '@/components/layouts/user-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Loader2,
    Send,
    Clock,
    CheckCircle,
    AlertCircle,
    User,
    Headphones,
    XCircle,
    RotateCcw,
} from 'lucide-react';

interface Message {
    id: number;
    user_id: number;
    message: string;
    created_at: string;
    user?: {
        id: number;
        name: string;
        role: string;
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
    booking_id?: number;
    booking?: {
        id: number;
        pnr: string;
        status: string;
    };
    messages: Message[];
    assigned_admin?: {
        name: string;
    };
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

const categoryLabels: Record<string, string> = {
    booking_issue: 'Booking Issue',
    payment_issue: 'Payment Issue',
    refund_request: 'Refund Request',
    flight_change: 'Flight Change',
    general_inquiry: 'General Inquiry',
    complaint: 'Complaint',
};

export default function TicketDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchTicket();
        }
    }, [params.id]);

    useEffect(() => {
        scrollToBottom();
    }, [ticket?.messages]);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/support-tickets/${params.id}`);
            setTicket(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load ticket details',
                variant: 'destructive',
            });
            router.push('/account/support');
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            await api.post(`/support-tickets/${params.id}/messages`, {
                message: newMessage,
            });
            setNewMessage('');
            fetchTicket();
            toast({
                title: 'Message Sent',
                description: 'Your reply has been added to the ticket.',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to send message',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    const handleCloseTicket = async () => {
        setActionLoading(true);
        try {
            await api.post(`/support-tickets/${params.id}/close`);
            fetchTicket();
            toast({
                title: 'Ticket Closed',
                description: 'Your support ticket has been closed.',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to close ticket',
                variant: 'destructive',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReopenTicket = async () => {
        setActionLoading(true);
        try {
            await api.post(`/support-tickets/${params.id}/reopen`);
            fetchTicket();
            toast({
                title: 'Ticket Reopened',
                description: 'Your support ticket has been reopened.',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to reopen ticket',
                variant: 'destructive',
            });
        } finally {
            setActionLoading(false);
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
                return <CheckCircle className="w-4 h-4" />;
            case 'closed':
                return <XCircle className="w-4 h-4" />;
            case 'awaiting_customer':
                return <AlertCircle className="w-4 h-4" />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <UserLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </UserLayout>
        );
    }

    if (!ticket) {
        return null;
    }

    const isClosed = ticket.status === 'closed';
    const canReopen = ['resolved', 'closed'].includes(ticket.status);

    return (
        <UserLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <Button
                    variant="ghost"
                    className="mb-6 gap-2"
                    onClick={() => router.push('/account/support')}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tickets
                </Button>

                {/* Ticket Info Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <span>#{ticket.ticket_number}</span>
                                    <span>•</span>
                                    <span>{formatDate(ticket.created_at)}</span>
                                </div>
                                <CardTitle className="text-xl">{ticket.subject}</CardTitle>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge className={statusColors[ticket.status]}>
                                    {getStatusIcon(ticket.status)}
                                    <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                                </Badge>
                                <Badge variant="outline" className={priorityColors[ticket.priority]}>
                                    {ticket.priority}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">Category</div>
                                <div className="font-medium">{categoryLabels[ticket.category]}</div>
                            </div>
                            {ticket.booking && (
                                <div>
                                    <div className="text-muted-foreground">Booking</div>
                                    <div className="font-medium">#{ticket.booking.pnr}</div>
                                </div>
                            )}
                            {ticket.assigned_admin && (
                                <div>
                                    <div className="text-muted-foreground">Assigned To</div>
                                    <div className="font-medium">{ticket.assigned_admin.name}</div>
                                </div>
                            )}
                            <div>
                                <div className="text-muted-foreground">Last Updated</div>
                                <div className="font-medium">{formatDate(ticket.updated_at)}</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                            {!isClosed && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCloseTicket}
                                    disabled={actionLoading}
                                >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Close Ticket
                                </Button>
                            )}
                            {canReopen && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReopenTicket}
                                    disabled={actionLoading}
                                >
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Reopen Ticket
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Messages */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Conversation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4 pr-2">
                            {ticket.messages.map((message) => {
                                const isAdmin = message.user?.role === 'admin';
                                const isOwn = message.user_id === user?.id;

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {isAdmin ? (
                                                <Headphones className="w-5 h-5" />
                                            ) : (
                                                <User className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className={`flex-1 max-w-[80%] ${isOwn ? 'text-right' : ''}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">
                                                    {message.user?.name || 'Unknown'}
                                                </span>
                                                {isAdmin && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Support
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(message.created_at)}
                                                </span>
                                            </div>
                                            <div
                                                className={`p-3 rounded-lg ${isOwn
                                                    ? 'bg-primary text-primary-foreground'
                                                    : isAdmin
                                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                                        : 'bg-gray-100 dark:bg-gray-800'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Form */}
                        {!isClosed ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <textarea
                                    className="flex-1 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Type your reply..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={sending}
                                />
                                <Button type="submit" disabled={sending || !newMessage.trim()} className="self-end">
                                    {sending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center py-4 text-muted-foreground bg-gray-50 dark:bg-gray-900 rounded-lg">
                                This ticket is closed. Reopen it to add more messages.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </UserLayout>
    );
}
