'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/context/toast-context';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CreateFlightPage() {
    const [formData, setFormData] = useState({
        airline_id: '',
        flight_number: '',
        origin_airport_id: '',
        destination_airport_id: '',
        departure_time: '',
        arrival_time: '',
        aircraft_type: '',
        base_price: '',
    });
    const [airlines, setAirlines] = useState<any[]>([]);
    const [airports, setAirports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const [airlinesRes, airportsRes] = await Promise.all([
                api.get('/airlines'),
                api.get('/airports'),
            ]);
            setAirlines(airlinesRes.data);
            setAirports(airportsRes.data);
        } catch (error) {
            console.error('Failed to fetch options', error);
            showToast('Failed to load airlines and airports', 'error');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/flights', formData);
            showToast('Flight created successfully', 'success');
            router.push('/admin/flights');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to create flight', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/admin/flights" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Flights
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Add New Flight</h1>
                <p className="text-muted-foreground">Schedule a new flight.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Flight Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Airline</label>
                                <select
                                    className={selectClassName}
                                    name="airline_id"
                                    value={formData.airline_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Airline</option>
                                    {airlines.map((airline) => (
                                        <option key={airline.id} value={airline.id}>
                                            {airline.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Flight Number</label>
                                <Input
                                    name="flight_number"
                                    placeholder="e.g. EK123"
                                    value={formData.flight_number}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Origin</label>
                                <select
                                    className={selectClassName}
                                    name="origin_airport_id"
                                    value={formData.origin_airport_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Origin</option>
                                    {airports.map((airport) => (
                                        <option key={airport.id} value={airport.id}>
                                            {airport.name} ({airport.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Destination</label>
                                <select
                                    className={selectClassName}
                                    name="destination_airport_id"
                                    value={formData.destination_airport_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Destination</option>
                                    {airports.map((airport) => (
                                        <option key={airport.id} value={airport.id}>
                                            {airport.name} ({airport.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Departure Time</label>
                                <Input
                                    name="departure_time"
                                    type="datetime-local"
                                    value={formData.departure_time}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Arrival Time</label>
                                <Input
                                    name="arrival_time"
                                    type="datetime-local"
                                    value={formData.arrival_time}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Aircraft Type</label>
                                <Input
                                    name="aircraft_type"
                                    placeholder="e.g. Boeing 777"
                                    value={formData.aircraft_type}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Base Price ($)</label>
                                <Input
                                    name="base_price"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.base_price}
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
                                {isLoading ? 'Creating...' : 'Create Flight'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
