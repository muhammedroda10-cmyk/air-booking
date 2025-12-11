'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Plane,
    Search,
    Loader2,
    Calendar,
    MapPin,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface Airport {
    id: number;
    code: string;
    name: string;
    city: string;
}

interface Airline {
    id: number;
    code: string;
    name: string;
}

interface Flight {
    id: number;
    flight_number: string;
    airline_id: number;
    airline: Airline;
    departure_airport_id: number;
    arrival_airport_id: number;
    departure_airport: Airport;
    arrival_airport: Airport;
    origin_airport?: Airport;
    destination_airport?: Airport;
    departure_time: string;
    arrival_time: string;
    duration: number;
    base_price: number;
    available_seats: number;
    status: string;
}

const initialFormData = {
    flight_number: '',
    airline_id: '',
    departure_airport_id: '',
    arrival_airport_id: '',
    departure_time: '',
    arrival_time: '',
    base_price: '',
    available_seats: '',
    status: 'scheduled',
};

export default function FlightsPage() {
    const { toast } = useToast();
    const { hasPermission } = useAuth();
    const [flights, setFlights] = useState<Flight[]>([]);
    const [airports, setAirports] = useState<Airport[]>([]);
    const [airlines, setAirlines] = useState<Airline[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [deleteTarget, setDeleteTarget] = useState<Flight | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchFlights();
        fetchAirports();
        fetchAirlines();
    }, []);

    const fetchFlights = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.get('/flights');
            const flightList = data.data || data.flights || data || [];
            setFlights(Array.isArray(flightList) ? flightList : []);
            setTotalCount(data.total || flightList.length || 0);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to load flights';
            setError(message);
            toast({ title: 'Error', description: message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAirports = async () => {
        try {
            const { data } = await api.get('/airports');
            setAirports(data.data || data || []);
        } catch { /* ignore */ }
    };

    const fetchAirlines = async () => {
        try {
            const { data } = await api.get('/airlines');
            setAirlines(data.data || data || []);
        } catch { /* ignore */ }
    };

    const openCreateDialog = () => {
        setEditingFlight(null);
        setFormData(initialFormData);
        setIsDialogOpen(true);
    };

    const openEditDialog = (flight: Flight) => {
        setEditingFlight(flight);
        setFormData({
            flight_number: flight.flight_number,
            airline_id: String(flight.airline_id),
            departure_airport_id: String(flight.departure_airport_id),
            arrival_airport_id: String(flight.arrival_airport_id),
            departure_time: flight.departure_time?.slice(0, 16) || '',
            arrival_time: flight.arrival_time?.slice(0, 16) || '',
            base_price: String(flight.base_price),
            available_seats: String(flight.available_seats),
            status: flight.status,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.flight_number || !formData.airline_id || !formData.departure_airport_id) {
            toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
            return;
        }
        try {
            setSaving(true);
            const payload = {
                ...formData,
                airline_id: Number(formData.airline_id),
                departure_airport_id: Number(formData.departure_airport_id),
                arrival_airport_id: Number(formData.arrival_airport_id),
                base_price: Number(formData.base_price),
                available_seats: Number(formData.available_seats),
            };

            if (editingFlight) {
                await api.put(`/flights/${editingFlight.id}`, payload);
                toast({ title: 'Success', description: 'Flight updated successfully' });
            } else {
                await api.post('/flights', payload);
                toast({ title: 'Success', description: 'Flight created successfully' });
            }
            setIsDialogOpen(false);
            fetchFlights();
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'Failed to save flight',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/flights/${deleteTarget.id}`);
            toast({ title: 'Success', description: 'Flight deleted successfully' });
            setDeleteTarget(null);
            fetchFlights();
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'Failed to delete flight',
                variant: 'destructive',
            });
        }
    };

    const formatDuration = (minutes: number) => {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatTime = (dateTime: string) => {
        if (!dateTime) return '-';
        return new Date(dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateTime: string) => {
        if (!dateTime) return '-';
        return new Date(dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            scheduled: 'bg-blue-100 text-blue-700',
            active: 'bg-green-100 text-green-700',
            delayed: 'bg-yellow-100 text-yellow-700',
            cancelled: 'bg-red-100 text-red-700',
            completed: 'bg-gray-100 text-gray-700',
        };
        return <Badge className={statusColors[status] || 'bg-gray-100 text-gray-700'}>{status || 'Unknown'}</Badge>;
    };

    const getAirport = (flight: Flight, type: 'departure' | 'arrival') => {
        if (type === 'departure') {
            return flight.departure_airport || flight.origin_airport;
        }
        return flight.arrival_airport || flight.destination_airport;
    };

    const filteredFlights = flights.filter((flight) => {
        const depAirport = getAirport(flight, 'departure');
        const arrAirport = getAirport(flight, 'arrival');
        const matchesSearch =
            flight.flight_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            flight.airline?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            depAirport?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            arrAirport?.city?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || flight.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading flights...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-lg font-semibold">Failed to load flights</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={fetchFlights} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Flights</h1>
                    <p className="text-muted-foreground">Manage and view all flights ({totalCount.toLocaleString()} total, showing {flights.length})</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchFlights} title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    {hasPermission('flights.create') && (
                        <Button onClick={openCreateDialog}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Flight
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search flights..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Plane className="w-5 h-5" />Flights ({filteredFlights.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredFlights.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Plane className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No flights found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Flight</TableHead>
                                        <TableHead>Route</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Seats</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredFlights.slice(0, 50).map((flight) => {
                                        const depAirport = getAirport(flight, 'departure');
                                        const arrAirport = getAirport(flight, 'arrival');
                                        return (
                                            <TableRow key={flight.id}>
                                                <TableCell>
                                                    <div className="font-medium">{flight.flight_number}</div>
                                                    <div className="text-sm text-muted-foreground">{flight.airline?.name || '-'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        {depAirport?.code || '?'} → {arrAirport?.code || '?'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />{formatDate(flight.departure_time)}</div>
                                                    <div className="text-sm text-muted-foreground">{formatTime(flight.departure_time)} - {formatTime(flight.arrival_time)}</div>
                                                </TableCell>
                                                <TableCell>{formatDuration(flight.duration)}</TableCell>
                                                <TableCell className="font-medium">${flight.base_price?.toLocaleString() || 0}</TableCell>
                                                <TableCell>{flight.available_seats ?? '-'}</TableCell>
                                                <TableCell>{getStatusBadge(flight.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {hasPermission('flights.edit') && (
                                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(flight)} title="Edit">
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {hasPermission('flights.delete') && (
                                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setDeleteTarget(flight)} title="Delete">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            {filteredFlights.length > 50 && (
                                <p className="text-center text-muted-foreground text-sm py-4">Showing first 50 of {filteredFlights.length} flights</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editingFlight ? 'Edit Flight' : 'Create Flight'}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Flight Number *</Label><Input value={formData.flight_number} onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })} placeholder="e.g. AA101" /></div>
                            <div className="space-y-2"><Label>Airline *</Label><Select value={formData.airline_id} onValueChange={(v) => setFormData({ ...formData, airline_id: v })}><SelectTrigger><SelectValue placeholder="Select airline" /></SelectTrigger><SelectContent>{airlines.map((a) => (<SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>))}</SelectContent></Select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Departure Airport *</Label><Select value={formData.departure_airport_id} onValueChange={(v) => setFormData({ ...formData, departure_airport_id: v })}><SelectTrigger><SelectValue placeholder="Select airport" /></SelectTrigger><SelectContent>{airports.map((a) => (<SelectItem key={a.id} value={String(a.id)}>{a.code} - {a.city}</SelectItem>))}</SelectContent></Select></div>
                            <div className="space-y-2"><Label>Arrival Airport *</Label><Select value={formData.arrival_airport_id} onValueChange={(v) => setFormData({ ...formData, arrival_airport_id: v })}><SelectTrigger><SelectValue placeholder="Select airport" /></SelectTrigger><SelectContent>{airports.map((a) => (<SelectItem key={a.id} value={String(a.id)}>{a.code} - {a.city}</SelectItem>))}</SelectContent></Select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Departure Time</Label><Input type="datetime-local" value={formData.departure_time} onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Arrival Time</Label><Input type="datetime-local" value={formData.arrival_time} onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>Base Price ($)</Label><Input type="number" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Available Seats</Label><Input type="number" value={formData.available_seats} onChange={(e) => setFormData({ ...formData, available_seats: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="delayed">Delayed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingFlight ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Flight?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete flight <strong>{deleteTarget?.flight_number}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
