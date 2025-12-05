'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search, Tag, Calendar, Percent, DollarSign } from 'lucide-react';
import api from '@/lib/api';

interface PromoCode {
    id: number;
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_booking_amount: number;
    max_discount: number | null;
    valid_from: string;
    valid_until: string;
    usage_limit: number | null;
    used_count: number;
    applicable_to: 'flight' | 'hotel' | 'both';
    status: 'active' | 'inactive';
}

export default function PromoCodesPage() {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: 0,
        min_booking_amount: 0,
        max_discount: '',
        valid_from: '',
        valid_until: '',
        usage_limit: '',
        applicable_to: 'both' as 'flight' | 'hotel' | 'both',
        status: 'active' as 'active' | 'inactive',
    });

    useEffect(() => {
        fetchPromoCodes();
    }, []);

    const fetchPromoCodes = async () => {
        try {
            const response = await api.get('/admin/promo-codes');
            setPromoCodes(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching promo codes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
            };

            if (editingCode) {
                await api.put(`/admin/promo-codes/${editingCode.id}`, payload);
            } else {
                await api.post('/admin/promo-codes', payload);
            }
            setShowForm(false);
            setEditingCode(null);
            resetForm();
            fetchPromoCodes();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error saving promo code');
        }
    };

    const handleEdit = (code: PromoCode) => {
        setEditingCode(code);
        setFormData({
            code: code.code,
            description: code.description || '',
            discount_type: code.discount_type,
            discount_value: code.discount_value,
            min_booking_amount: code.min_booking_amount,
            max_discount: code.max_discount?.toString() || '',
            valid_from: code.valid_from.split('T')[0],
            valid_until: code.valid_until.split('T')[0],
            usage_limit: code.usage_limit?.toString() || '',
            applicable_to: code.applicable_to,
            status: code.status,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this promo code?')) return;
        try {
            await api.delete(`/admin/promo-codes/${id}`);
            fetchPromoCodes();
        } catch (error) {
            alert('Error deleting promo code');
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            discount_type: 'percentage',
            discount_value: 0,
            min_booking_amount: 0,
            max_discount: '',
            valid_from: '',
            valid_until: '',
            usage_limit: '',
            applicable_to: 'both',
            status: 'active',
        });
    };

    const filteredCodes = promoCodes.filter(code =>
        code.code.toLowerCase().includes(search.toLowerCase()) ||
        code.description?.toLowerCase().includes(search.toLowerCase())
    );

    const isExpired = (date: string) => new Date(date) < new Date();
    const isActive = (code: PromoCode) => code.status === 'active' && !isExpired(code.valid_until);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Promo Codes</h1>
                    <p className="text-muted-foreground">Manage discount codes and promotions</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingCode(null); resetForm(); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Promo Code
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search promo codes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Form Modal */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingCode ? 'Edit Promo Code' : 'Create Promo Code'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium">Code *</label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., SUMMER20"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Summer sale discount"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Discount Type *</label>
                                <select
                                    value={formData.discount_type}
                                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                                    className="w-full h-10 px-3 rounded-md border bg-background"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount ($)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Discount Value *</label>
                                <Input
                                    type="number"
                                    value={formData.discount_value}
                                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                                    min={0}
                                    step={formData.discount_type === 'percentage' ? 1 : 0.01}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Min Booking Amount ($)</label>
                                <Input
                                    type="number"
                                    value={formData.min_booking_amount}
                                    onChange={(e) => setFormData({ ...formData, min_booking_amount: parseFloat(e.target.value) })}
                                    min={0}
                                    step={0.01}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Max Discount ($)</label>
                                <Input
                                    type="number"
                                    value={formData.max_discount}
                                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                                    placeholder="Optional"
                                    min={0}
                                    step={0.01}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Valid From *</label>
                                <Input
                                    type="date"
                                    value={formData.valid_from}
                                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Valid Until *</label>
                                <Input
                                    type="date"
                                    value={formData.valid_until}
                                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Usage Limit</label>
                                <Input
                                    type="number"
                                    value={formData.usage_limit}
                                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                    placeholder="Unlimited"
                                    min={1}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Applicable To *</label>
                                <select
                                    value={formData.applicable_to}
                                    onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value as any })}
                                    className="w-full h-10 px-3 rounded-md border bg-background"
                                >
                                    <option value="both">Flights & Hotels</option>
                                    <option value="flight">Flights Only</option>
                                    <option value="hotel">Hotels Only</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Status *</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full h-10 px-3 rounded-md border bg-background"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingCode ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Promo Codes Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Code</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Discount</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Validity</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Usage</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Applies To</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : filteredCodes.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                            No promo codes found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCodes.map((code) => (
                                        <tr key={code.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="w-4 h-4 text-primary" />
                                                    <span className="font-mono font-bold">{code.code}</span>
                                                </div>
                                                {code.description && (
                                                    <p className="text-xs text-muted-foreground mt-1">{code.description}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {code.discount_type === 'percentage' ? (
                                                        <>
                                                            <Percent className="w-4 h-4 text-green-500" />
                                                            <span className="font-bold text-green-600">{code.discount_value}%</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DollarSign className="w-4 h-4 text-green-500" />
                                                            <span className="font-bold text-green-600">${code.discount_value}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {code.max_discount && (
                                                    <p className="text-xs text-muted-foreground">Max: ${code.max_discount}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(code.valid_from).toLocaleDateString()}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    to {new Date(code.valid_until).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium">{code.used_count}</span>
                                                {code.usage_limit && (
                                                    <span className="text-muted-foreground"> / {code.usage_limit}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${code.applicable_to === 'flight' ? 'bg-blue-100 text-blue-700' :
                                                        code.applicable_to === 'hotel' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-green-100 text-green-700'
                                                    }`}>
                                                    {code.applicable_to === 'both' ? 'All' : code.applicable_to}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive(code)
                                                        ? 'bg-green-100 text-green-700'
                                                        : isExpired(code.valid_until)
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {isExpired(code.valid_until) ? 'Expired' : code.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(code)}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(code.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
