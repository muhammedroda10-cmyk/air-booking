'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';

interface Airport {
    id: number;
    name: string;
    code: string;
    city: string;
    country: string;
}

export default function AirportsPage() {
    const [airports, setAirports] = useState<Airport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAirports();
    }, []);

    const fetchAirports = async () => {
        try {
            const response = await api.get('/airports');
            setAirports(response.data);
        } catch (error) {
            console.error('Failed to fetch airports', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this airport?')) return;
        try {
            await api.delete(`/airports/${id}`);
            setAirports(airports.filter((airport) => airport.id !== id));
        } catch (error) {
            console.error('Failed to delete airport', error);
            alert('Failed to delete airport');
        }
    };

    if (isLoading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Airports</h1>
                    <p className="text-muted-foreground">Manage airport locations</p>
                </div>
                <Link href="/dashboard/airports/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Airport
                    </Button>
                </Link>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Code</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">City</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Country</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {airports.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            No airports found
                                        </td>
                                    </tr>
                                ) : (
                                    airports.map((airport) => (
                                        <tr key={airport.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                        <MapPin className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <span className="font-mono font-semibold">{airport.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm">{airport.name}</td>
                                            <td className="px-4 py-4 text-sm">{airport.city}</td>
                                            <td className="px-4 py-4 text-sm">{airport.country}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex gap-2">
                                                    <Link href={`/dashboard/airports/${airport.id}/edit`}>
                                                        <Button size="sm" variant="ghost">
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-500"
                                                        onClick={() => handleDelete(airport.id)}
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
