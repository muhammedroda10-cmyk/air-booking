'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Clock, DollarSign, Info } from 'lucide-react';
import Link from 'next/link';

export default function EditAirlinePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        logo_url: '',
        country: '',
        cancel_full_refund_hours: 168, // 7 days
        cancel_75_refund_hours: 72,    // 3 days
        cancel_50_refund_hours: 24,    // 1 day
        cancellation_fee: 25,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAirline();
    }, []);

    const fetchAirline = async () => {
        try {
            const response = await api.get(`/airlines/${id}`);
            setFormData({
                name: response.data.name || '',
                code: response.data.code || '',
                logo_url: response.data.logo_url || '',
                country: response.data.country || '',
                cancel_full_refund_hours: response.data.cancel_full_refund_hours || 168,
                cancel_75_refund_hours: response.data.cancel_75_refund_hours || 72,
                cancel_50_refund_hours: response.data.cancel_50_refund_hours || 24,
                cancellation_fee: response.data.cancellation_fee || 25,
            });
        } catch (error) {
            console.error('Failed to fetch airline', error);
            toast({ title: 'Error', description: 'Failed to fetch airline details', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put(`/airlines/${id}`, formData);
            toast({ title: 'Airline updated successfully' });
            router.push('/dashboard/airlines');
        } catch (error: any) {
            console.error('Failed to update airline', error);
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update airline', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="mb-6">
                <Link href="/dashboard/airlines" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Airlines
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Edit Airline</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Airline Name *</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">IATA Code *</label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    maxLength={3}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Logo URL</label>
                                <Input
                                    value={formData.logo_url}
                                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Country</label>
                                <Input
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    placeholder="United States"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cancellation Policy Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Cancellation Policy
                        </CardTitle>
                        <CardDescription>
                            Configure refund percentages based on time before departure
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                            <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <p className="font-medium">How cancellation policy works:</p>
                                    <ul className="list-disc ml-4 mt-1 space-y-1">
                                        <li>100% refund if cancelled before the full refund threshold</li>
                                        <li>75% refund if cancelled before the 75% threshold</li>
                                        <li>50% refund if cancelled before the 50% threshold</li>
                                        <li>No refund if cancelled after the 50% threshold</li>
                                        <li>Cancellation fee is always deducted from refund</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    100% Refund Threshold (hours before departure)
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={formData.cancel_full_refund_hours}
                                        onChange={(e) => setFormData({ ...formData, cancel_full_refund_hours: parseInt(e.target.value) })}
                                        min={0}
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                        = {(formData.cancel_full_refund_hours / 24).toFixed(1)} days
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    75% Refund Threshold (hours before departure)
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={formData.cancel_75_refund_hours}
                                        onChange={(e) => setFormData({ ...formData, cancel_75_refund_hours: parseInt(e.target.value) })}
                                        min={0}
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                        = {(formData.cancel_75_refund_hours / 24).toFixed(1)} days
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    50% Refund Threshold (hours before departure)
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={formData.cancel_50_refund_hours}
                                        onChange={(e) => setFormData({ ...formData, cancel_50_refund_hours: parseInt(e.target.value) })}
                                        min={0}
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                        = {(formData.cancel_50_refund_hours / 24).toFixed(1)} days
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    <DollarSign className="w-4 h-4 inline" /> Cancellation Fee
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">$</span>
                                    <Input
                                        type="number"
                                        value={formData.cancellation_fee}
                                        onChange={(e) => setFormData({ ...formData, cancellation_fee: parseFloat(e.target.value) })}
                                        min={0}
                                        step={0.01}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Update Airline'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
