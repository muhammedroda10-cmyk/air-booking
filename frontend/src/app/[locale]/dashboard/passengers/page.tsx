'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    UserCog,
    Search,
    Loader2,
    Edit,
    History,
    User,
    Plane,
} from 'lucide-react';

interface Passenger {
    id: number;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    passport_number: string;
    passport_expiry: string;
    nationality: string;
    email: string;
    phone_number: string;
    passenger_type: string;
    corrected_at: string | null;
    corrected_by: number | null;
    correction_reason: string | null;
    original_data: Record<string, any> | null;
    booking: {
        id: number;
        pnr: string;
        status: string;
    };
}

interface Booking {
    id: number;
    pnr: string;
    status: string;
    passengers: Passenger[];
}

export default function PassengersPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Edit dialog state
    const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        passport_number: '',
        passport_expiry: '',
        nationality: '',
        email: '',
        phone_number: '',
        reason: '',
    });
    const [saving, setSaving] = useState(false);

    // History dialog
    const [historyPassenger, setHistoryPassenger] = useState<Passenger | null>(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/bookings');
            // Filter bookings with passengers
            const bookingsWithPassengers = (data.bookings?.data || data.bookings || [])
                .filter((b: Booking) => b.passengers && b.passengers.length > 0);
            setBookings(bookingsWithPassengers);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load bookings',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const openEditDialog = (passenger: Passenger, booking: Booking) => {
        setEditingPassenger({ ...passenger, booking });
        setFormData({
            first_name: passenger.first_name || '',
            last_name: passenger.last_name || '',
            date_of_birth: passenger.date_of_birth?.split('T')[0] || '',
            passport_number: passenger.passport_number || '',
            passport_expiry: passenger.passport_expiry?.split('T')[0] || '',
            nationality: passenger.nationality || '',
            email: passenger.email || '',
            phone_number: passenger.phone_number || '',
            reason: '',
        });
    };

    const saveChanges = async () => {
        if (!editingPassenger) return;

        if (!formData.reason.trim()) {
            toast({
                title: 'Reason required',
                description: 'Please provide a reason for this correction',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);
        try {
            await api.put(`/dashboard/passengers/${editingPassenger.id}`, formData);
            toast({
                title: 'Success',
                description: 'Passenger details updated successfully',
            });
            setEditingPassenger(null);
            fetchBookings();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update passenger',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const viewHistory = async (passenger: Passenger) => {
        try {
            const { data } = await api.get(`/dashboard/passengers/${passenger.id}/history`);
            setHistoryPassenger({
                ...passenger,
                ...data,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load correction history',
                variant: 'destructive',
            });
        }
    };

    // Filter passengers based on search
    const filteredBookings = bookings.filter(booking => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            booking.pnr.toLowerCase().includes(query) ||
            booking.passengers.some(p =>
                `${p.first_name} ${p.last_name}`.toLowerCase().includes(query) ||
                p.passport_number?.toLowerCase().includes(query) ||
                p.email?.toLowerCase().includes(query)
            )
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Passenger Corrections</h1>
                <p className="text-muted-foreground">Correct passenger details with audit trail</p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search by PNR, name, passport, or email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Bookings & Passengers */}
            <div className="space-y-6">
                {filteredBookings.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <UserCog className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Passengers Found</h3>
                            <p className="text-muted-foreground">
                                No passengers match your search criteria.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredBookings.map((booking) => (
                        <Card key={booking.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <Plane className="w-4 h-4" />
                                    <CardTitle className="text-base">
                                        Booking #{booking.pnr}
                                    </CardTitle>
                                    <Badge variant="outline">{booking.status}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y">
                                    {booking.passengers.map((passenger) => (
                                        <div key={passenger.id} className="py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">
                                                        {passenger.first_name} {passenger.last_name}
                                                        {passenger.corrected_at && (
                                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                                Corrected
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {passenger.passenger_type} • {passenger.passport_number || 'No passport'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {passenger.corrected_at && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => viewHistory(passenger)}
                                                    >
                                                        <History className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditDialog(passenger, booking)}
                                                >
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    Correct
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingPassenger} onOpenChange={(open) => !open && setEditingPassenger(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Correct Passenger Details</DialogTitle>
                    </DialogHeader>
                    {editingPassenger && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>First Name</Label>
                                    <Input
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Last Name</Label>
                                    <Input
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Date of Birth</Label>
                                    <Input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Nationality</Label>
                                    <Input
                                        value={formData.nationality}
                                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Passport Number</Label>
                                    <Input
                                        value={formData.passport_number}
                                        onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Passport Expiry</Label>
                                    <Input
                                        type="date"
                                        value={formData.passport_expiry}
                                        onChange={(e) => setFormData({ ...formData, passport_expiry: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Reason for Correction *</Label>
                                <textarea
                                    className="w-full mt-1 p-3 border rounded-lg text-sm"
                                    rows={2}
                                    placeholder="Why is this correction needed?"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setEditingPassenger(null)}>
                                    Cancel
                                </Button>
                                <Button onClick={saveChanges} disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={!!historyPassenger} onOpenChange={(open) => !open && setHistoryPassenger(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Correction History</DialogTitle>
                    </DialogHeader>
                    {historyPassenger && (
                        <div className="space-y-4 py-4">
                            <div className="text-sm">
                                <strong>Corrected:</strong>{' '}
                                {new Date(historyPassenger.corrected_at!).toLocaleDateString('en-US', {
                                    dateStyle: 'medium',
                                })}
                            </div>
                            <div className="text-sm">
                                <strong>Reason:</strong> {historyPassenger.correction_reason}
                            </div>
                            {historyPassenger.original_data && (
                                <div>
                                    <strong className="text-sm">Original Values:</strong>
                                    <div className="mt-2 bg-muted p-3 rounded-lg text-sm space-y-1">
                                        {Object.entries(historyPassenger.original_data).map(([key, value]) => (
                                            <div key={key} className="flex justify-between">
                                                <span className="text-muted-foreground capitalize">
                                                    {key.replace('_', ' ')}:
                                                </span>
                                                <span>{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
