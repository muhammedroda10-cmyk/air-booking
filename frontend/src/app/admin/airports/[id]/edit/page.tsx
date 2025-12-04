'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/context/toast-context';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditAirportPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        city: '',
        country: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAirport();
    }, []);

    const fetchAirport = async () => {
        try {
            const response = await api.get(`/airports/${params.id}`);
            setFormData({
                name: response.data.name,
                code: response.data.code,
                city: response.data.city,
                country: response.data.country,
            });
        } catch (error) {
            console.error('Failed to fetch airport', error);
            showToast('Failed to fetch airport details', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put(`/airports/${params.id}`, formData);
            showToast('Airport updated successfully', 'success');
            router.push('/admin/airports');
        } catch (error: any) {
            console.error('Failed to update airport', error);
            showToast(error.response?.data?.message || 'Failed to update airport', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link href="/admin/airports" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Airports
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Edit Airport</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Airport Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Airport Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">IATA Code</label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    maxLength={3}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">City</label>
                                <Input
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Country</label>
                                <Input
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Update Airport'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
