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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    Users,
    Loader2,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
}

interface Role {
    id: number;
    name: string;
    slug: string;
    description: string;
    is_system: boolean;
    users_count: number;
    permissions: Permission[];
}

export default function RolesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        permissions: [] as number[],
    });

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/dashboard/roles');
            setRoles(data.roles || []);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load roles',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const { data } = await api.get('/dashboard/permissions');
            setPermissions(data.permissions || {});
        } catch (error) {
            console.error('Failed to load permissions:', error);
        }
    };

    const handleSave = async () => {
        try {
            if (editingRole) {
                await api.put(`/dashboard/roles/${editingRole.id}`, formData);
                toast({ title: 'Role updated successfully' });
            } else {
                await api.post('/dashboard/roles', formData);
                toast({ title: 'Role created successfully' });
            }
            setIsDialogOpen(false);
            resetForm();
            fetchRoles();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save role',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (role: Role) => {
        if (role.is_system) {
            toast({
                title: 'Cannot delete system role',
                variant: 'destructive',
            });
            return;
        }

        if (!confirm(`Are you sure you want to delete "${role.name}"?`)) return;

        try {
            await api.delete(`/dashboard/roles/${role.id}`);
            toast({ title: 'Role deleted successfully' });
            fetchRoles();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete role',
                variant: 'destructive',
            });
        }
    };

    const openEditDialog = (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            slug: role.slug,
            description: role.description || '',
            permissions: role.permissions.map(p => p.id),
        });
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingRole(null);
        setFormData({
            name: '',
            slug: '',
            description: '',
            permissions: [],
        });
    };

    const toggleModule = (module: string) => {
        setExpandedModules(prev =>
            prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]
        );
    };

    const togglePermission = (permId: number) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permId)
                ? prev.permissions.filter(id => id !== permId)
                : [...prev.permissions, permId],
        }));
    };

    const toggleAllInModule = (module: string) => {
        const modulePerms = permissions[module] || [];
        const modulePermIds = modulePerms.map(p => p.id);
        const allSelected = modulePermIds.every(id => formData.permissions.includes(id));

        setFormData(prev => ({
            ...prev,
            permissions: allSelected
                ? prev.permissions.filter(id => !modulePermIds.includes(id))
                : [...new Set([...prev.permissions, ...modulePermIds])],
        }));
    };

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Roles & Permissions</h1>
                    <p className="text-muted-foreground">Manage staff roles and their permissions</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRole ? 'Edit Role' : 'Create New Role'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Sales Manager"
                                    />
                                </div>
                                <div>
                                    <Label>Slug</Label>
                                    <Input
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        placeholder="e.g., sales_manager"
                                        disabled={editingRole?.is_system}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of this role"
                                />
                            </div>

                            <div>
                                <Label className="text-base font-semibold">Permissions</Label>
                                <div className="mt-3 border rounded-lg divide-y">
                                    {Object.entries(permissions).map(([module, perms]) => (
                                        <div key={module}>
                                            <div
                                                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                                            >
                                                <div
                                                    className="flex items-center gap-2 cursor-pointer flex-1"
                                                    onClick={() => toggleModule(module)}
                                                >
                                                    {expandedModules.includes(module) ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )}
                                                    <span className="font-medium capitalize">
                                                        {module.replace('_', ' ')}
                                                    </span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {perms.filter(p => formData.permissions.includes(p.id)).length}/{perms.length}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleAllInModule(module)}
                                                >
                                                    Toggle All
                                                </Button>
                                            </div>
                                            {expandedModules.includes(module) && (
                                                <div className="px-4 py-2 bg-muted/30 grid grid-cols-2 gap-2">
                                                    {perms.map((perm) => (
                                                        <label
                                                            key={perm.id}
                                                            className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted"
                                                        >
                                                            <Checkbox
                                                                checked={formData.permissions.includes(perm.id)}
                                                                onCheckedChange={() => togglePermission(perm.id)}
                                                            />
                                                            <span className="text-sm">{perm.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave}>
                                    {editingRole ? 'Save Changes' : 'Create Role'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Roles List */}
            <div className="grid gap-4">
                {roles.map((role) => (
                    <Card key={role.id}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{role.name}</h3>
                                            {role.is_system && (
                                                <Badge variant="secondary">System</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{role.description}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {role.users_count} users
                                            </span>
                                            <span>{role.permissions.length} permissions</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditDialog(role)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    {!role.is_system && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-500"
                                            onClick={() => handleDelete(role)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
