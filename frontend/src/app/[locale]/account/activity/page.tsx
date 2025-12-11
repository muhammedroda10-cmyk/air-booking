'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { UserLayout } from '@/components/layouts/user-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    Loader2,
    RefreshCw,
    LogIn,
    LogOut,
    Plane,
    Wallet,
    Settings,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface ActivityLog {
    id: number;
    action: string;
    description: string;
    properties: Record<string, any> | null;
    created_at: string;
}

const actionIcons: Record<string, React.ReactNode> = {
    auth: <LogIn className="w-4 h-4" />,
    login: <LogIn className="w-4 h-4" />,
    logout: <LogOut className="w-4 h-4" />,
    booking: <Plane className="w-4 h-4" />,
    wallet: <Wallet className="w-4 h-4" />,
    payment: <Wallet className="w-4 h-4" />,
    profile: <Settings className="w-4 h-4" />,
    support: <MessageSquare className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
    auth: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    login: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    logout: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    register: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    booking: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    wallet: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    payment: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    profile: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    support: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function UserActivityPage() {
    const { toast } = useToast();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });

    useEffect(() => {
        fetchActivities();
    }, [pagination.currentPage]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/activity?page=${pagination.currentPage}`);
            setActivities(data.data || []);
            setPagination({
                currentPage: data.current_page || 1,
                lastPage: data.last_page || 1,
                total: data.total || 0,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load activity history',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getActionCategory = (action: string): string => {
        return action.split('.')[0];
    };

    const getActionIcon = (action: string) => {
        const category = getActionCategory(action);
        return actionIcons[category] || <Activity className="w-4 h-4" />;
    };

    const getIconBgClass = (action: string) => {
        const category = getActionCategory(action);
        const colors: Record<string, string> = {
            auth: 'bg-blue-100 dark:bg-blue-900/30',
            login: 'bg-green-100 dark:bg-green-900/30',
            logout: 'bg-gray-100 dark:bg-gray-800',
            booking: 'bg-orange-100 dark:bg-orange-900/30',
            wallet: 'bg-emerald-100 dark:bg-emerald-900/30',
            payment: 'bg-green-100 dark:bg-green-900/30',
            profile: 'bg-blue-100 dark:bg-blue-900/30',
            support: 'bg-purple-100 dark:bg-purple-900/30',
        };
        return colors[category] || 'bg-gray-100 dark:bg-gray-800';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDate(dateString);
    };

    if (loading && activities.length === 0) {
        return (
            <UserLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Activity History</h1>
                        <p className="text-muted-foreground">Your recent account activity</p>
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchActivities} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {/* Timeline */}
                <Card>
                    <CardContent className="p-6">
                        {activities.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
                                <p className="text-muted-foreground">Your account activity will appear here</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

                                <div className="space-y-6">
                                    {activities.map((activity, index) => (
                                        <div key={activity.id} className="relative flex gap-4">
                                            {/* Timeline dot */}
                                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${getIconBgClass(activity.action)}`}>
                                                {getActionIcon(activity.action)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 pb-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="font-medium">{activity.description}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {activity.action}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                                                        {formatRelativeTime(activity.created_at)}
                                                    </div>
                                                </div>

                                                {/* Additional details */}
                                                {activity.properties && Object.keys(activity.properties).length > 0 && (
                                                    <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                                                        {activity.properties.amount && (
                                                            <p>Amount: ${activity.properties.amount}</p>
                                                        )}
                                                        {activity.properties.total_price && (
                                                            <p>Total: ${activity.properties.total_price}</p>
                                                        )}
                                                        {activity.properties.fields_changed && (
                                                            <p>Updated: {activity.properties.fields_changed.join(', ')}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {pagination.lastPage > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {pagination.currentPage} of {pagination.lastPage}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                                disabled={pagination.currentPage <= 1}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                                disabled={pagination.currentPage >= pagination.lastPage}
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
