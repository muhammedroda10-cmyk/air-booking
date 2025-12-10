'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    Loader2,
    Send,
    User,
    Headphones,
    ExternalLink,
} from 'lucide-react';

interface Message {
    id: number;
    user_id: number;
    message: string;
    is_internal_note: boolean;
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
    user?: { id: number; name: string; email: string };
    booking?: {
        id: number;
        pnr: string;
        status: string;
        total_price: number;
    };
    assigned_admin?: { id: number; name: string };
    messages: Message[];
}

interface Admin {
    id: number;
    name: string;
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

export default function AdminTicketDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [replyStatus, setReplyStatus] = useState('');

    useEffect(() => {
        if (params.id) {
            fetchTicket();
            fetchAdmins();
        }
    }, [params.id]);

    useEffect(() => {
        scrollToBottom();
    }, [ticket?.messages]);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/admin/support-tickets/${params.id}`);
            setTicket(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load ticket details',
                variant: 'destructive',
            });
            router.push('/admin/support');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdmins = async () => {
        try {
            const { data } = await api.get('/admin/support-tickets/statistics');
            setAdmins(data.admins || []);
        } catch (error) {
            console.error('Failed to load admins:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleUpdate = async (updates: Record<string, string | null>) => {
        setUpdating(true);
        try {
            await api.put(`/admin/support-tickets/${params.id}`, updates);
            fetchTicket();
            toast({
                title: 'Updated',
                description: 'Ticket updated successfully',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update ticket',
                variant: 'destructive',
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const payload: Record<string, any> = {
                message: newMessage,
                is_internal_note: isInternalNote,
            };
            if (replyStatus) {
                payload.status = replyStatus;
            }

            await api.post(`/admin/support-tickets/${params.id}/reply`, payload);
            setNewMessage('');
            setIsInternalNote(false);
            setReplyStatus('');
            fetchTicket();
            toast({
                title: isInternalNote ? 'Note Added' : 'Reply Sent',
                description: isInternalNote
                    ? 'Internal note has been added.'
                    : 'Your reply has been sent to the customer.',
            });
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!ticket) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/admin/support')}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold">#{ticket.ticket_number}</h1>
                        <Badge className={statusColors[ticket.status]}>
                            {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={priorityColors[ticket.priority]}>
                            {ticket.priority}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{ticket.subject}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Messages */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Conversation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4 pr-2">
                                {ticket.messages.map((message) => {
                                    const isAdmin = message.user?.role === 'admin';

                                    return (
                                        <div key={message.id} className="flex gap-3">
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
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm">
                                                        {message.user?.name || 'Unknown'}
                                                    </span>
                                                    {isAdmin && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Staff
                                                        </Badge>
                                                    )}
                                                    {message.is_internal_note && (
                                                        <Badge variant="outline" className="text-xs bg-yellow-50">
                                                            Internal Note
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(message.created_at)}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`p-3 rounded-lg ${message.is_internal_note
                                                        ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                                                        : isAdmin
                                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                                            : 'bg-gray-100 dark:bg-gray-800'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap">
                                                        {message.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Form */}
                            <form onSubmit={handleSendReply} className="space-y-4 border-t pt-4">
                                <textarea
                                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Type your reply..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={sending}
                                />

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="internal"
                                            checked={isInternalNote}
                                            onCheckedChange={(checked) =>
                                                setIsInternalNote(checked === true)
                                            }
                                        />
                                        <Label htmlFor="internal" className="text-sm cursor-pointer">
                                            Internal note (not visible to customer)
                                        </Label>
                                    </div>

                                    <Select value={replyStatus || 'no_change'} onValueChange={(value) => setReplyStatus(value === 'no_change' ? '' : value)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Update status..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="no_change">No status change</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="awaiting_customer">
                                                Awaiting Customer
                                            </SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="ml-auto gap-2"
                                    >
                                        {sending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        {isInternalNote ? 'Add Note' : 'Send Reply'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Ticket Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">Status</Label>
                                <Select
                                    value={ticket.status}
                                    onValueChange={(value) => handleUpdate({ status: value })}
                                    disabled={updating}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="awaiting_customer">
                                            Awaiting Customer
                                        </SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Priority</Label>
                                <Select
                                    value={ticket.priority}
                                    onValueChange={(value) => handleUpdate({ priority: value })}
                                    disabled={updating}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Assigned To</Label>
                                <Select
                                    value={ticket.assigned_admin?.id?.toString() || 'unassigned'}
                                    onValueChange={(value) =>
                                        handleUpdate({ assigned_to: value === 'unassigned' ? null : value })
                                    }
                                    disabled={updating}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Unassigned" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Unassign</SelectItem>
                                        {admins.map((admin) => (
                                            <SelectItem key={admin.id} value={admin.id.toString()}>
                                                {admin.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Category</Label>
                                <p className="text-sm font-medium">
                                    {categoryLabels[ticket.category]}
                                </p>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Created</Label>
                                <p className="text-sm">{formatDate(ticket.created_at)}</p>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Last Updated</Label>
                                <p className="text-sm">{formatDate(ticket.updated_at)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <Label className="text-muted-foreground">Name</Label>
                                <p className="text-sm font-medium">{ticket.user?.name}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Email</Label>
                                <p className="text-sm">{ticket.user?.email}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Related Booking */}
                    {ticket.booking && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Related Booking</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">#{ticket.booking.pnr}</div>
                                        <div className="text-sm text-muted-foreground">
                                            ${ticket.booking.total_price}
                                        </div>
                                    </div>
                                    <Badge>{ticket.booking.status}</Badge>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    onClick={() =>
                                        router.push(`/admin/bookings?id=${ticket.booking?.id}`)
                                    }
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View Booking
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
