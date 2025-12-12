'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Bell,
    Send,
    Loader2,
    RefreshCw,
    Plus,
    Users,
    Check,
    Clock,
    AlertCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    status: string;
    sent_at: string;
    recipients_count: number;
}

export default function NotificationsPage() {
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newNotification, setNewNotification] = useState({
        title: '',
        message: '',
        type: 'info',
        target: 'all',
    });

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/notifications');
            setNotifications(data.notifications || data || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            // Use mock data
            setNotifications([
                {
                    id: 1,
                    title: 'System Maintenance',
                    message: 'Scheduled maintenance on Dec 15th',
                    type: 'warning',
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    recipients_count: 1250,
                },
                {
                    id: 2,
                    title: 'New Feature: Hotel Bookings',
                    message: 'Book hotels directly through our platform',
                    type: 'info',
                    status: 'sent',
                    sent_at: new Date(Date.now() - 86400000).toISOString(),
                    recipients_count: 3420,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const sendNotification = async () => {
        if (!newNotification.title || !newNotification.message) {
            toast({ title: 'Error', description: 'Title and message are required', variant: 'destructive' });
            return;
        }

        try {
            setSending(true);
            await api.post('/admin/notifications', newNotification);
            toast({ title: 'Success', description: 'Notification sent successfully' });
            setDialogOpen(false);
            setNewNotification({ title: '', message: '', type: 'info', target: 'all' });
            fetchNotifications();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to send notification', variant: 'destructive' });
        } finally {
            setSending(false);
        }
    };

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            info: 'bg-blue-100 text-blue-700',
            warning: 'bg-yellow-100 text-yellow-700',
            success: 'bg-green-100 text-green-700',
            error: 'bg-red-100 text-red-700',
        };
        return <Badge className={styles[type] || 'bg-gray-100 text-gray-700'}>{type}</Badge>;
    };

    const getStatusIcon = (status: string) => {
        if (status === 'sent') return <Check className="w-4 h-4 text-green-500" />;
        if (status === 'pending') return <Clock className="w-4 h-4 text-yellow-500" />;
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading notifications...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bell className="w-6 h-6" />
                        Notifications
                    </h1>
                    <p className="text-muted-foreground">Manage and send system notifications</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="icon" onClick={fetchNotifications}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Send Notification
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Send New Notification</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                        value={newNotification.title}
                                        onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                                        placeholder="Notification title"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Message</label>
                                    <Textarea
                                        value={newNotification.message}
                                        onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                                        placeholder="Notification message"
                                        rows={4}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Type</label>
                                        <Select
                                            value={newNotification.type}
                                            onValueChange={(value) => setNewNotification({ ...newNotification, type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="info">Info</SelectItem>
                                                <SelectItem value="success">Success</SelectItem>
                                                <SelectItem value="warning">Warning</SelectItem>
                                                <SelectItem value="error">Error</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Target</label>
                                        <Select
                                            value={newNotification.target}
                                            onValueChange={(value) => setNewNotification({ ...newNotification, target: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Users</SelectItem>
                                                <SelectItem value="admins">Admins Only</SelectItem>
                                                <SelectItem value="customers">Customers Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button onClick={sendNotification} className="w-full" disabled={sending}>
                                    {sending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 mr-2" />
                                    )}
                                    Send Notification
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{notifications.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {notifications.reduce((acc, n) => acc + (n.recipients_count || 0), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {notifications.filter(n => {
                                const sentDate = new Date(n.sent_at);
                                const now = new Date();
                                return sentDate.getMonth() === now.getMonth() && sentDate.getFullYear() === now.getFullYear();
                            }).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notifications List */}
            <Card>
                <CardHeader>
                    <CardTitle>Sent Notifications</CardTitle>
                    <CardDescription>History of all notifications sent to users</CardDescription>
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No notifications sent yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Bell className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{notification.title}</span>
                                                {getTypeBadge(notification.type)}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {notification.recipients_count?.toLocaleString() || 0} recipients
                                                </span>
                                                <span>
                                                    {new Date(notification.sent_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {getStatusIcon(notification.status)}
                                        <span className="text-xs capitalize">{notification.status}</span>
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
