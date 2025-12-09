'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { UserLayout } from "@/components/layouts/user-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Trash2, Loader2, Plane, CreditCard, Tag, AlertCircle, Info, CheckCheck } from "lucide-react";
import { format } from 'date-fns';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    data?: any;
    read: boolean;
    created_at: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingAllRead, setMarkingAllRead] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            // Backend returns { notifications: { data: [...] }, unread_count }
            const data = response.data;
            const notificationsList = data.notifications?.data || data.notifications || data.data || [];
            setNotifications(Array.isArray(notificationsList) ? notificationsList : []);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        setMarkingAllRead(true);
        try {
            await api.post('/notifications/read-all');
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
        } catch (error) {
            console.error('Failed to mark all as read', error);
        } finally {
            setMarkingAllRead(false);
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const clearAll = async () => {
        try {
            await api.delete('/notifications');
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'booking_confirmed':
            case 'booking':
                return <Plane className="w-5 h-5 text-blue-500" />;
            case 'payment':
            case 'payment_received':
                return <CreditCard className="w-5 h-5 text-green-500" />;
            case 'promo':
            case 'promotion':
                return <Tag className="w-5 h-5 text-purple-500" />;
            case 'alert':
            case 'booking_cancelled':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Info className="w-5 h-5 text-slate-500" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <UserLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-muted-foreground">
                            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={markAllAsRead}
                                disabled={markingAllRead}
                            >
                                {markingAllRead ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCheck className="w-4 h-4 mr-2" />
                                )}
                                Mark all as read
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearAll}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear all
                            </Button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" />
                            All Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">No notifications</h3>
                                <p className="text-muted-foreground">You're all caught up! Check back later for updates.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notification.read ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shrink-0">
                                                        New
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {!notification.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => markAsRead(notification.id)}
                                                    title="Mark as read"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                                onClick={() => deleteNotification(notification.id)}
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </UserLayout>
    );
}
