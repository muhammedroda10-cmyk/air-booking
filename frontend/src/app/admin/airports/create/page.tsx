'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/context/toast-context';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateAirportPage() {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        city: '',
        country: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/airports', formData);
            showToast('Airport created successfully', 'success');
            router.push('/admin/airports');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to create airport', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link href="/admin/airports" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Airports
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Add New Airport</h1>
                <p className="text-muted-foreground">Create a new airport location.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Airport Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="name">
                                    Airport Name
                                </label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Dubai International"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="code">
                                    IATA Code
                                </label>
                                <Input
                                    id="code"
                                    name="code"
                                    placeholder="e.g. DXB"
                                    maxLength={3}
                                    value={formData.code}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="city">
                                    City
                                </label>
                                <Input
                                    id="city"
                                    name="city"
                                    placeholder="e.g. Dubai"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="country">
                                    Country
                                </label>
                                <Input
                                    id="country"
                                    name="country"
                                    placeholder="e.g. UAE"
                                    value={formData.country}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating...' : 'Create Airport'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
