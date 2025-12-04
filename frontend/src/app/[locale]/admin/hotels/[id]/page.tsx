'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Hotel {
    id: number;
    name: string;
    address: string;
    city: string;
    country: string;
    description: string;
    rating: number;
    price_per_night: number;
    image_url: string;
}

export default function EditHotel() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        country: '',
        description: '',
        rating: '',
        price_per_night: '',
        image_url: '',
    });

    useEffect(() => {
        const fetchHotel = async () => {
            try {
                const response = await api.get(`/hotels/${params.id}`);
                const hotel: Hotel = response.data;
                setFormData({
                    name: hotel.name || '',
                    address: hotel.address || '',
                    city: hotel.city || '',
                    country: hotel.country || '',
                    description: hotel.description || '',
                    rating: hotel.rating?.toString() || '',
                    price_per_night: hotel.price_per_night?.toString() || '',
                    image_url: hotel.image_url || '',
                });
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load hotel details",
                    variant: "destructive"
                });
                router.push('/admin/hotels');
            } finally {
                setFetching(false);
            }
        };
        fetchHotel();
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.put(`/admin/hotels/${params.id}`, {
                ...formData,
                rating: formData.rating ? parseFloat(formData.rating) : null,
                price_per_night: parseFloat(formData.price_per_night),
            });
            toast({
                title: "Hotel Updated",
                description: "The hotel has been successfully updated.",
            });
            router.push('/admin/hotels');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update hotel",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link href="/admin/hotels" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Hotels
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Edit Hotel</h2>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Hotel Name *</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Grand Hyatt"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Address *</label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Street address"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">City *</label>
                                <Input
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="e.g., Dubai"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Country</label>
                                <Input
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    placeholder="e.g., UAE"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Rating (0-5)</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    value={formData.rating}
                                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                    placeholder="4.5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Price per Night ($) *</label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.price_per_night}
                                    onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                                    placeholder="150"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Image URL</label>
                                <Input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://example.com/hotel-image.jpg"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the hotel..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Link href="/admin/hotels">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
