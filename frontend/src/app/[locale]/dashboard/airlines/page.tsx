'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Star, Plane, Clock } from 'lucide-react';

interface Airline {
    id: number;
    name: string;
    code: string;
    logo_url: string | null;
    country: string | null;
    cancel_full_refund_hours: number;
    cancel_75_refund_hours: number;
    cancel_50_refund_hours: number;
    cancellation_fee: number;
    flights_count?: number;
    reviews_count?: number;
    average_rating?: number;
}

export default function AirlinesPage() {
    const [airlines, setAirlines] = useState<Airline[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAirlines();
    }, []);

    const fetchAirlines = async () => {
        try {
            const response = await api.get('/airlines');
            setAirlines(response.data);
        } catch (error) {
            console.error('Failed to fetch airlines', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this airline? This will also delete all associated flights.')) return;
        try {
            await api.delete(`/airlines/${id}`);
            setAirlines(airlines.filter((airline) => airline.id !== id));
        } catch (error) {
            console.error('Failed to delete airline', error);
            alert('Failed to delete airline');
        }
    };

    if (isLoading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Airlines</h1>
                    <p className="text-muted-foreground">Manage airlines and their cancellation policies</p>
                </div>
                <Link href="/dashboard/airlines/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Airline
                    </Button>
                </Link>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Airline</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Country</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Cancellation Policy</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Stats</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {airlines.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            No airlines found
                                        </td>
                                    </tr>
                                ) : (
                                    airlines.map((airline) => (
                                        <tr key={airline.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    {airline.logo_url ? (
                                                        <img src={airline.logo_url} alt={airline.name} className="w-10 h-10 rounded object-contain bg-white" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                                            <Plane className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold">{airline.name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{airline.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {airline.country || '-'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-xs space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 text-green-500" />
                                                        <span>100% refund: {airline.cancel_full_refund_hours / 24}+ days</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 text-yellow-500" />
                                                        <span>75% refund: {airline.cancel_75_refund_hours / 24}-{airline.cancel_full_refund_hours / 24} days</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 text-orange-500" />
                                                        <span>50% refund: {airline.cancel_50_refund_hours / 24}-{airline.cancel_75_refund_hours / 24} days</span>
                                                    </div>
                                                    <p className="text-muted-foreground">Fee: ${airline.cancellation_fee}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1 text-sm">
                                                    {airline.flights_count !== undefined && (
                                                        <div className="flex items-center gap-1">
                                                            <Plane className="w-3 h-3" />
                                                            <span>{airline.flights_count} flights</span>
                                                        </div>
                                                    )}
                                                    {airline.average_rating && (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                            <span>{airline.average_rating} ({airline.reviews_count} reviews)</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex gap-2">
                                                    <Link href={`/dashboard/airlines/${airline.id}/edit`}>
                                                        <Button size="sm" variant="ghost">
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-500"
                                                        onClick={() => handleDelete(airline.id)}
                                                    >
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
