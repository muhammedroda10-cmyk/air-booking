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
import { cn } from '@/lib/utils';

interface Airline {
    id: number;
    name: string;
}

interface Airport {
    id: number;
    name: string;
    code: string;
}

export default function EditFlightPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [airlines, setAirlines] = useState<Airline[]>([]);
    const [airports, setAirports] = useState<Airport[]>([]);
    const [formData, setFormData] = useState({
        flight_number: '',
        airline_id: '',
        origin_airport_id: '',
        destination_airport_id: '',
        departure_time: '',
        arrival_time: '',
        price: '', // Keep for backward compatibility if needed, but base_price is main
        base_price: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [airlinesRes, airportsRes, flightRes] = await Promise.all([
                    api.get('/airlines'),
                    api.get('/airports'),
                    api.get(`/flights/${params.id}`)
                ]);
                setAirlines(airlinesRes.data);
                setAirports(airportsRes.data);

                const flight = flightRes.data;
                setFormData({
                    flight_number: flight.flight_number,
                    airline_id: flight.airline_id.toString(),
                    origin_airport_id: flight.origin_airport_id.toString(),
                    destination_airport_id: flight.destination_airport_id.toString(),
                    departure_time: flight.departure_time.slice(0, 16), // Format for datetime-local
                    arrival_time: flight.arrival_time.slice(0, 16),
                    price: flight.price,
                    base_price: flight.base_price,
                });
            } catch (error) {
                console.error('Failed to fetch data', error);
                showToast('Failed to fetch flight details', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put(`/flights/${params.id}`, formData);
            showToast('Flight updated successfully', 'success');
            router.push('/admin/flights');
        } catch (error: any) {
            console.error('Failed to update flight', error);
            showToast(error.response?.data?.message || 'Failed to update flight', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/admin/flights" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Flights
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Edit Flight</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Flight Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Flight Number</label>
                            <Input
                                value={formData.flight_number}
                                onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Airline</label>
                                <select
                                    className={selectClassName}
                                    value={formData.airline_id}
                                    onChange={(e) => setFormData({ ...formData, airline_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Airline</option>
                                    {airlines.map((airline) => (
                                        <option key={airline.id} value={airline.id}>{airline.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Base Price ($)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.base_price}
                                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Origin</label>
                                <select
                                    className={selectClassName}
                                    value={formData.origin_airport_id}
                                    onChange={(e) => setFormData({ ...formData, origin_airport_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Origin</option>
                                    {airports.map((airport) => (
                                        <option key={airport.id} value={airport.id}>{airport.name} ({airport.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Destination</label>
                                <select
                                    className={selectClassName}
                                    value={formData.destination_airport_id}
                                    onChange={(e) => setFormData({ ...formData, destination_airport_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Destination</option>
                                    {airports.map((airport) => (
                                        <option key={airport.id} value={airport.id}>{airport.name} ({airport.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Departure Time</label>
                                <Input
                                    type="datetime-local"
                                    value={formData.departure_time}
                                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Arrival Time</label>
                                <Input
                                    type="datetime-local"
                                    value={formData.arrival_time}
                                    onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Update Flight'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
