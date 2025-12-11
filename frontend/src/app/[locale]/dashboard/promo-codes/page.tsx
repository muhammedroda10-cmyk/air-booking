'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag, Search, Loader2, Plus, Calendar, Percent, Copy, Trash2, Edit, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface PromoCode {
    id: number;
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_value: number;
    max_discount: number | null;
    usage_limit: number | null;
    used_count: number;
    starts_at: string;
    expires_at: string;
    is_active: boolean;
}

const initialFormData = { code: '', description: '', discount_type: 'percentage' as 'percentage' | 'fixed', discount_value: '', min_order_value: '0', max_discount: '', usage_limit: '', starts_at: '', expires_at: '', is_active: true };

export default function PromoCodesPage() {
    const { toast } = useToast();
    const { hasPermission } = useAuth();
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => { fetchPromoCodes(); }, []);

    const fetchPromoCodes = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/promo-codes');
            setPromoCodes(data.data || data || []);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load promo codes', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const openCreateDialog = () => { setEditingPromo(null); setFormData(initialFormData); setIsDialogOpen(true); };
    const openEditDialog = (promo: PromoCode) => {
        setEditingPromo(promo);
        setFormData({ code: promo.code, description: promo.description || '', discount_type: promo.discount_type, discount_value: String(promo.discount_value), min_order_value: String(promo.min_order_value || 0), max_discount: promo.max_discount ? String(promo.max_discount) : '', usage_limit: promo.usage_limit ? String(promo.usage_limit) : '', starts_at: promo.starts_at?.slice(0, 16) || '', expires_at: promo.expires_at?.slice(0, 16) || '', is_active: promo.is_active });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = { ...formData, discount_value: Number(formData.discount_value), min_order_value: Number(formData.min_order_value), max_discount: formData.max_discount ? Number(formData.max_discount) : null, usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null };
            if (editingPromo) { await api.put(`/admin/promo-codes/${editingPromo.id}`, payload); toast({ title: 'Promo code updated' }); }
            else { await api.post('/admin/promo-codes', payload); toast({ title: 'Promo code created' }); }
            setIsDialogOpen(false); fetchPromoCodes();
        } catch (error: any) { toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save', variant: 'destructive' }); }
        finally { setSaving(false); }
    };

    const handleDelete = async (promo: PromoCode) => {
        if (!confirm(`Delete "${promo.code}"?`)) return;
        try { await api.delete(`/admin/promo-codes/${promo.id}`); toast({ title: 'Promo code deleted' }); fetchPromoCodes(); }
        catch (error: any) { toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete', variant: 'destructive' }); }
    };

    const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast({ title: 'Copied!', description: `"${code}" copied` }); };
    const formatDate = (dt: string) => new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const getStatusBadge = (promo: PromoCode) => {
        const now = new Date();
        if (!promo.is_active) return <Badge variant="secondary">Inactive</Badge>;
        if (now < new Date(promo.starts_at)) return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
        if (now > new Date(promo.expires_at)) return <Badge className="bg-gray-100 text-gray-700">Expired</Badge>;
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
    };

    const filteredPromoCodes = promoCodes.filter((p) => p.code?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold">Promo Codes</h1><p className="text-muted-foreground">Manage discounts</p></div>
                {hasPermission('promo_codes.create') && <Button onClick={openCreateDialog}><Plus className="w-4 h-4 mr-2" />Create Code</Button>}
            </div>
            <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5" />All Promo Codes ({filteredPromoCodes.length})</CardTitle></CardHeader>
                <CardContent>
                    {filteredPromoCodes.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Tag className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No promo codes found</p></div> : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Usage</TableHead><TableHead>Valid Period</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {filteredPromoCodes.map((promo) => (
                                    <TableRow key={promo.id}>
                                        <TableCell><div className="flex items-center gap-2"><code className="px-2 py-1 bg-muted rounded font-mono">{promo.code}</code><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(promo.code)}><Copy className="w-3 h-3" /></Button></div><div className="text-sm text-muted-foreground mt-1">{promo.description}</div></TableCell>
                                        <TableCell><div className="flex items-center gap-1">{promo.discount_type === 'percentage' ? <><Percent className="w-4 h-4" />{promo.discount_value}%</> : <><DollarSign className="w-4 h-4" />{promo.discount_value}</>}</div></TableCell>
                                        <TableCell>{promo.used_count} / {promo.usage_limit || '∞'}</TableCell>
                                        <TableCell><div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-muted-foreground" />{formatDate(promo.starts_at)} - {formatDate(promo.expires_at)}</div></TableCell>
                                        <TableCell>{getStatusBadge(promo)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {hasPermission('promo_codes.edit') && <Button variant="ghost" size="icon" onClick={() => openEditDialog(promo)}><Edit className="w-4 h-4" /></Button>}
                                                {hasPermission('promo_codes.delete') && <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(promo)}><Trash2 className="w-4 h-4" /></Button>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Code</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="SUMMER2025" /></div>
                            <div className="space-y-2"><Label>Discount Type</Label><Select value={formData.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed ($)</SelectItem></SelectContent></Select></div>
                        </div>
                        <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>Discount Value</Label><Input type="number" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Min Order ($)</Label><Input type="number" value={formData.min_order_value} onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Max Discount ($)</Label><Input type="number" value={formData.max_discount} onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })} placeholder="Optional" /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>Usage Limit</Label><Input type="number" value={formData.usage_limit} onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })} placeholder="Unlimited" /></div>
                            <div className="space-y-2"><Label>Starts At</Label><Input type="datetime-local" value={formData.starts_at} onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Expires At</Label><Input type="datetime-local" value={formData.expires_at} onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} /></div>
                        </div>
                        <div className="flex items-center gap-2"><Checkbox id="is_active" checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: !!c })} /><Label htmlFor="is_active">Active</Label></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingPromo ? 'Update' : 'Create'}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
