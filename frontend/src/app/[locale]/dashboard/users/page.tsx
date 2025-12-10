'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Users,
    Search,
    Loader2,
    Shield,
    Mail,
    MoreVertical,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Role {
    id: number;
    name: string;
    slug: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    role_id: number | null;
    status: string;
    created_at: string;
    role_relation?: Role;
}

export default function UsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Assign role dialog
    const [assigningUser, setAssigningUser] = useState<User | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string>('none');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [roleFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/users');
            setUsers(data.users?.data || data.users || []);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load users',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const { data } = await api.get('/dashboard/roles');
            setRoles(data.roles || []);
        } catch (error) {
            console.error('Failed to load roles:', error);
        }
    };

    const openAssignDialog = (user: User) => {
        setAssigningUser(user);
        setSelectedRoleId(user.role_id?.toString() || 'none');
    };

    const assignRole = async () => {
        if (!assigningUser) return;

        setSaving(true);
        try {
            await api.post(`/dashboard/users/${assigningUser.id}/assign-role`, {
                role_id: selectedRoleId === 'none' ? null : parseInt(selectedRoleId),
            });
            toast({
                title: 'Success',
                description: 'Role assigned successfully',
            });
            setAssigningUser(null);
            fetchUsers();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to assign role',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const getRoleBadge = (user: User) => {
        if (user.role === 'admin') {
            return <Badge className="bg-purple-100 text-purple-700">Super Admin</Badge>;
        }
        if (user.role_relation) {
            return <Badge variant="secondary">{user.role_relation.name}</Badge>;
        }
        return <Badge variant="outline">Customer</Badge>;
    };

    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
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
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-muted-foreground">Manage users and assign roles</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="admin">Admins Only</SelectItem>
                        <SelectItem value="customer">Customers Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users List */}
            <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                        </CardContent>
                    </Card>
                ) : (
                    filteredUsers.map((user) => (
                        <Card key={user.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{user.name}</span>
                                                {getRoleBadge(user)}
                                                {user.status !== 'active' && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        {user.status}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openAssignDialog(user)}>
                                                <Shield className="w-4 h-4 mr-2" />
                                                Assign Role
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Assign Role Dialog */}
            <Dialog open={!!assigningUser} onOpenChange={(open) => !open && setAssigningUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Role</DialogTitle>
                    </DialogHeader>
                    {assigningUser && (
                        <div className="space-y-4 py-4">
                            <div className="bg-muted p-4 rounded-lg">
                                <div className="font-medium">{assigningUser.name}</div>
                                <div className="text-sm text-muted-foreground">{assigningUser.email}</div>
                            </div>

                            <div>
                                <Label>Select Role</Label>
                                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Role (Customer)</SelectItem>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id.toString()}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setAssigningUser(null)}>
                                    Cancel
                                </Button>
                                <Button onClick={assignRole} disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    Assign Role
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
