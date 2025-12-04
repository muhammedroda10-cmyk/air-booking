'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Flight {
    id: number;
    flight_number: string;
    airline: { name: string };
    origin: { code: string; city: string };
    destination: { code: string; city: string };
    departure_time: string;
    arrival_time: string;
    price: number;
}

export default function ManageFlights() {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFlights();
    }, []);

    const fetchFlights = async () => {
        try {
            const response = await api.get('/flights');
            setFlights(response.data.data || []); // Assuming Laravel resource response
        } catch (error) {
            console.error('Failed to fetch flights', error);
            // Fallback mock data for demo
            setFlights([
                {
                    id: 1,
                    flight_number: 'SW-101',
                    airline: { name: 'SkyWings' },
                    origin: { code: 'DXB', city: 'Dubai' },
                    destination: { code: 'LHR', city: 'London' },
                    departure_time: '2025-12-15 08:00:00',
                    arrival_time: '2025-12-15 12:30:00',
                    price: 450
                },
                {
                    id: 2,
                    flight_number: 'EK-202',
                    airline: { name: 'Emirates' },
                    origin: { code: 'DXB', city: 'Dubai' },
                    destination: { code: 'JFK', city: 'New York' },
                    departure_time: '2025-12-16 10:00:00',
                    arrival_time: '2025-12-16 16:00:00',
                    price: 1200
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this flight?')) return;
        try {
            await api.delete(`/flights/${id}`);
            setFlights(flights.filter((flight) => flight.id !== id));
        } catch (error) {
            console.error('Failed to delete flight', error);
            alert('Failed to delete flight');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Manage Flights</h2>
                <Link href="/admin/flights/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Flight
                    </Button>
                </Link>
            </div>

            <div className="flex items-center space-x-2">
                <Input placeholder="Search flights..." className="max-w-sm" />
                <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Flights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Flight No</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Airline</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Route</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Departure</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Price</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {flights.map((flight) => (
                                    <tr key={flight.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{flight.flight_number}</td>
                                        <td className="p-4 align-middle">{flight.airline.name}</td>
                                        <td className="p-4 align-middle">{flight.origin.code} → {flight.destination.code}</td>
                                        <td className="p-4 align-middle">{new Date(flight.departure_time).toLocaleString()}</td>
                                        <td className="p-4 align-middle">${flight.price}</td>
                                        <td className="p-4 align-middle text-right">
                                            <Link href={`/admin/flights/${flight.id}/edit`}>
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500"
                                                onClick={() => handleDelete(flight.id)}
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
