'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    ServerCog,
    Power,
    Wifi,
    WifiOff,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Settings
} from 'lucide-react';
import api from '@/lib/api';

interface Supplier {
    id: number;
    name: string;
    code: string;
    driver: string;
    api_base_url: string | null;
    is_active: boolean;
    is_healthy: boolean;
    priority: number;
    timeout: number;
    retry_times: number;
    last_health_check: string | null;
    config: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

interface ConnectionTestResult {
    supplier: string;
    success: boolean;
    message: string;
    latency_ms?: number;
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [availableDrivers, setAvailableDrivers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [testingConnection, setTestingConnection] = useState<number | null>(null);
    const [connectionResult, setConnectionResult] = useState<ConnectionTestResult | null>(null);
    const [togglingStatus, setTogglingStatus] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        driver: '',
        api_base_url: '',
        api_key: '',
        api_secret: '',
        is_active: true,
        priority: 100,
        timeout: 30,
        retry_times: 3,
        config: '{}',
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/admin/suppliers');
            setSuppliers(response.data.suppliers || []);
            setAvailableDrivers(response.data.available_drivers || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let config = {};
            try {
                config = formData.config ? JSON.parse(formData.config) : {};
            } catch {
                alert('Invalid JSON in config field');
                return;
            }

            const payload = {
                ...formData,
                api_base_url: formData.api_base_url || null,
                api_key: formData.api_key || null,
                api_secret: formData.api_secret || null,
                config,
            };

            if (editingSupplier) {
                await api.put(`/admin/suppliers/${editingSupplier.id}`, payload);
            } else {
                await api.post('/admin/suppliers', payload);
            }
            setShowForm(false);
            setEditingSupplier(null);
            resetForm();
            fetchSuppliers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error saving supplier');
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            code: supplier.code,
            driver: supplier.driver,
            api_base_url: supplier.api_base_url || '',
            api_key: '', // Don't pre-fill sensitive data
            api_secret: '', // Don't pre-fill sensitive data
            is_active: supplier.is_active,
            priority: supplier.priority,
            timeout: supplier.timeout,
            retry_times: supplier.retry_times,
            config: JSON.stringify(supplier.config || {}, null, 2),
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) return;
        try {
            await api.delete(`/admin/suppliers/${id}`);
            fetchSuppliers();
        } catch (error) {
            alert('Error deleting supplier');
        }
    };

    const handleToggleStatus = async (supplier: Supplier) => {
        setTogglingStatus(supplier.id);
        try {
            await api.post(`/admin/suppliers/${supplier.id}/toggle-status`);
            fetchSuppliers();
        } catch (error) {
            alert('Error toggling supplier status');
        } finally {
            setTogglingStatus(null);
        }
    };

    const handleTestConnection = async (supplier: Supplier) => {
        setTestingConnection(supplier.id);
        setConnectionResult(null);
        try {
            const response = await api.post(`/admin/suppliers/${supplier.id}/test`);
            setConnectionResult(response.data);
        } catch (error: any) {
            setConnectionResult({
                supplier: supplier.code,
                success: false,
                message: error.response?.data?.message || 'Connection test failed',
            });
        } finally {
            setTestingConnection(null);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            driver: availableDrivers[0] || '',
            api_base_url: '',
            api_key: '',
            api_secret: '',
            is_active: true,
            priority: 100,
            timeout: 30,
            retry_times: 3,
            config: '{}',
        });
    };

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(search.toLowerCase()) ||
        supplier.code.toLowerCase().includes(search.toLowerCase()) ||
        supplier.driver.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Flight Suppliers</h1>
                    <p className="text-muted-foreground">Manage flight data providers and API integrations</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingSupplier(null); resetForm(); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Supplier
                </Button>
            </div>

            {/* Connection Test Result Toast */}
            {connectionResult && (
                <div className={`p-4 rounded-lg border flex items-center gap-3 ${connectionResult.success
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }`}>
                    {connectionResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div className="flex-1">
                        <p className={`font-medium ${connectionResult.success ? 'text-green-700' : 'text-red-700'}`}>
                            {connectionResult.supplier}: {connectionResult.message}
                        </p>
                        {connectionResult.latency_ms && (
                            <p className="text-sm text-muted-foreground">Latency: {connectionResult.latency_ms}ms</p>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setConnectionResult(null)}>
                        Dismiss
                    </Button>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search suppliers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Form Modal */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ServerCog className="w-5 h-5" />
                            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium">Name *</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., FlightBuffer"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Code *</label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                                    placeholder="e.g., flightbuffer"
                                    required
                                    disabled={!!editingSupplier}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Unique identifier (lowercase)</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Driver *</label>
                                <select
                                    value={formData.driver}
                                    onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md border bg-background"
                                    required
                                >
                                    <option value="">Select driver...</option>
                                    {availableDrivers.map(driver => (
                                        <option key={driver} value={driver}>{driver}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground mt-1">API adapter implementation</p>
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                                <label className="text-sm font-medium">API Base URL</label>
                                <Input
                                    type="url"
                                    value={formData.api_base_url}
                                    onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
                                    placeholder="https://api.example.com"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">API Key</label>
                                <Input
                                    type="password"
                                    value={formData.api_key}
                                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                                    placeholder={editingSupplier ? '(unchanged if empty)' : 'Enter API key'}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">API Secret</label>
                                <Input
                                    type="password"
                                    value={formData.api_secret}
                                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                                    placeholder={editingSupplier ? '(unchanged if empty)' : 'Enter API secret'}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Priority</label>
                                <Input
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                    min={0}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Higher = checked first</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Timeout (seconds)</label>
                                <Input
                                    type="number"
                                    value={formData.timeout}
                                    onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) || 30 })}
                                    min={1}
                                    max={120}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Retry Times</label>
                                <Input
                                    type="number"
                                    value={formData.retry_times}
                                    onChange={(e) => setFormData({ ...formData, retry_times: parseInt(e.target.value) || 0 })}
                                    min={0}
                                    max={10}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <select
                                    value={formData.is_active ? 'active' : 'inactive'}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                                    className="w-full h-10 px-3 rounded-md border bg-background"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                                <label className="text-sm font-medium">Configuration (JSON)</label>
                                <textarea
                                    value={formData.config}
                                    onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                                    placeholder='{"key": "value"}'
                                    className="w-full h-24 px-3 py-2 rounded-md border bg-background font-mono text-sm resize-none"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Additional supplier-specific configuration</p>
                            </div>
                            <div className="md:col-span-2 lg:col-span-3 flex gap-2 justify-end border-t pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Suppliers Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : filteredSuppliers.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <ServerCog className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No suppliers found</h3>
                        <p className="text-muted-foreground mb-4">
                            {search ? 'Try adjusting your search.' : 'Add your first flight data supplier to get started.'}
                        </p>
                        {!search && (
                            <Button onClick={() => { setShowForm(true); setEditingSupplier(null); resetForm(); }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Supplier
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredSuppliers.map((supplier) => (
                        <Card key={supplier.id} className={`relative overflow-hidden ${!supplier.is_active ? 'opacity-60' : ''
                            }`}>
                            {/* Status indicator bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1 ${supplier.is_active && supplier.is_healthy
                                    ? 'bg-green-500'
                                    : supplier.is_active && !supplier.is_healthy
                                        ? 'bg-amber-500'
                                        : 'bg-slate-300'
                                }`} />

                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${supplier.is_active
                                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                            }`}>
                                            <ServerCog className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{supplier.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground font-mono">{supplier.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {supplier.is_active ? (
                                            supplier.is_healthy ? (
                                                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                                    <Wifi className="w-3 h-3" /> Healthy
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                                                    <WifiOff className="w-3 h-3" /> Unhealthy
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-xs text-slate-500">Inactive</span>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Settings className="w-3.5 h-3.5" />
                                        <span>Driver:</span>
                                        <span className="font-medium text-foreground">{supplier.driver}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Timeout:</span>
                                        <span className="font-medium text-foreground">{supplier.timeout}s</span>
                                    </div>
                                </div>

                                {/* Priority Badge */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Priority:</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${supplier.priority >= 100
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : supplier.priority >= 50
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                        {supplier.priority}
                                    </span>
                                    {supplier.last_health_check && (
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            Last check: {new Date(supplier.last_health_check).toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleTestConnection(supplier)}
                                        disabled={testingConnection === supplier.id}
                                    >
                                        {testingConnection === supplier.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Wifi className="w-4 h-4 mr-1" />
                                                Test
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleToggleStatus(supplier)}
                                        disabled={togglingStatus === supplier.id}
                                        className={supplier.is_active ? 'text-amber-600' : 'text-green-600'}
                                    >
                                        {togglingStatus === supplier.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Power className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(supplier)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(supplier.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
