'use client';

import { useState, useEffect } from 'react';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Activity,
    Search,
    Loader2,
    RefreshCw,
    User,
    LogIn,
    LogOut,
    Plane,
    Wallet,
    Settings,
    MessageSquare,
    Shield,
    Globe,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface ActivityLog {
    id: number;
    user_id: number | null;
    action: string;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    properties: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
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
    admin: <Shield className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
    auth: 'bg-blue-100 text-blue-700',
    login: 'bg-green-100 text-green-700',
    logout: 'bg-gray-100 text-gray-700',
    register: 'bg-purple-100 text-purple-700',
    booking: 'bg-orange-100 text-orange-700',
    wallet: 'bg-emerald-100 text-emerald-700',
    payment: 'bg-green-100 text-green-700',
    profile: 'bg-blue-100 text-blue-700',
    support: 'bg-purple-100 text-purple-700',
    admin: 'bg-red-100 text-red-700',
};

export default function ActivityLogPage() {
    const { toast } = useToast();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [actionTypes, setActionTypes] = useState<string[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });

    useEffect(() => {
        fetchActivities();
        fetchActionTypes();
    }, [actionFilter, pagination.currentPage]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', pagination.currentPage.toString());
            if (actionFilter !== 'all') {
                params.append('action_type', actionFilter);
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }
            const { data } = await api.get(`/admin/activity?${params.toString()}`);
            setActivities(data.data || []);
            setPagination({
                currentPage: data.current_page || 1,
                lastPage: data.last_page || 1,
                total: data.total || 0,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load activity logs',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchActionTypes = async () => {
        try {
            const { data } = await api.get('/admin/activity/types');
            setActionTypes(data.categories || []);
        } catch (error) {
            console.error('Failed to load action types');
        }
    };

    const getActionCategory = (action: string): string => {
        return action.split('.')[0];
    };

    const getActionIcon = (action: string) => {
        const category = getActionCategory(action);
        return actionIcons[category] || <Activity className="w-4 h-4" />;
    };

    const getActionBadge = (action: string) => {
        const category = getActionCategory(action);
        const colorClass = actionColors[category] || 'bg-gray-100 text-gray-700';
        return <Badge className={colorClass}>{action}</Badge>;
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

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchActivities();
    };

    if (loading && activities.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Activity Log</h1>
                    <p className="text-muted-foreground">Track all user and admin actions ({pagination.total} total)</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchActivities} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search in description..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPagination(prev => ({ ...prev, currentPage: 1 })); }}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Action Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        {actionTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Activity Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">IP Address</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {activities.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No activity logs found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">
                                                            {activity.user?.name || 'System'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {activity.user?.email || '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getActionBadge(activity.action)}
                                            </td>
                                            <td className="px-4 py-3 text-sm max-w-[300px] truncate">
                                                {activity.description}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3" />
                                                    {activity.ip_address || '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {formatDate(activity.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {activity.properties && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedActivity(activity)}
                                                    >
                                                        View
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
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
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                            disabled={pagination.currentPage >= pagination.lastPage}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Details Dialog */}
            <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Activity Details</DialogTitle>
                        <DialogDescription>
                            {selectedActivity?.action} - {selectedActivity && formatDate(selectedActivity.created_at)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">User</div>
                                <div className="font-medium">{selectedActivity?.user?.name || 'System'}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">IP Address</div>
                                <div className="font-medium">{selectedActivity?.ip_address || '-'}</div>
                            </div>
                        </div>
                        <div>
                            <div className="text-muted-foreground text-sm mb-2">Description</div>
                            <p>{selectedActivity?.description}</p>
                        </div>
                        {selectedActivity?.properties && (
                            <div>
                                <div className="text-muted-foreground text-sm mb-2">Additional Data</div>
                                <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-[300px]">
                                    {JSON.stringify(selectedActivity.properties, null, 2)}
                                </pre>
                            </div>
                        )}
                        {selectedActivity?.user_agent && (
                            <div>
                                <div className="text-muted-foreground text-sm mb-2">User Agent</div>
                                <p className="text-xs text-muted-foreground break-all">{selectedActivity.user_agent}</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
