'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Hotel, Search, Loader2, MapPin, Star, Plus, Edit, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface HotelItem {
    id: number;
    name: string;
    city: string;
    country: string;
    address: string;
    rating: number;
    price_per_night: number;
    description: string;
    amenities: string[];
    status: string;
}

const initialFormData = { name: '', city: '', country: '', address: '', rating: '4.0', price_per_night: '', description: '', amenities: '', status: 'active' };

export default function HotelsPage() {
    const { toast } = useToast();
    const { hasPermission } = useAuth();
    const [hotels, setHotels] = useState<HotelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingHotel, setEditingHotel] = useState<HotelItem | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [deleteTarget, setDeleteTarget] = useState<HotelItem | null>(null);

    useEffect(() => { fetchHotels(); }, []);

    const fetchHotels = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.get('/hotels');
            const hotelList = data.data || data.hotels || data || [];
            setHotels(Array.isArray(hotelList) ? hotelList : []);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to load hotels';
            setError(message);
            toast({ title: 'Error', description: message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const openCreateDialog = () => { setEditingHotel(null); setFormData(initialFormData); setIsDialogOpen(true); };
    const openEditDialog = (hotel: HotelItem) => {
        setEditingHotel(hotel);
        setFormData({
            name: hotel.name || '',
            city: hotel.city || '',
            country: hotel.country || '',
            address: hotel.address || '',
            rating: String(hotel.rating || 4),
            price_per_night: String(hotel.price_per_night || 0),
            description: hotel.description || '',
            amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : '',
            status: hotel.status || 'active'
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.city || !formData.country) {
            toast({ title: 'Validation Error', description: 'Please fill in required fields', variant: 'destructive' });
            return;
        }
        try {
            setSaving(true);
            const payload = {
                ...formData,
                rating: Number(formData.rating),
                price_per_night: Number(formData.price_per_night),
                amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean)
            };
            if (editingHotel) {
                await api.put(`/admin/hotels/${editingHotel.id}`, payload);
                toast({ title: 'Success', description: 'Hotel updated successfully' });
            } else {
                await api.post('/admin/hotels', payload);
                toast({ title: 'Success', description: 'Hotel created successfully' });
            }
            setIsDialogOpen(false);
            fetchHotels();
        } catch (err: any) {
            toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save hotel', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/admin/hotels/${deleteTarget.id}`);
            toast({ title: 'Success', description: 'Hotel deleted successfully' });
            setDeleteTarget(null);
            fetchHotels();
        } catch (err: any) {
            toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete hotel', variant: 'destructive' });
        }
    };

    const filteredHotels = hotels.filter((h) =>
        h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.country?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading hotels...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-lg font-semibold">Failed to load hotels</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={fetchHotels} variant="outline">
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
                    <h1 className="text-2xl font-bold">Hotels</h1>
                    <p className="text-muted-foreground">Manage all hotels ({hotels.length} total)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchHotels} title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    {hasPermission('hotels.create') && (
                        <Button onClick={openCreateDialog}>
                            <Plus className="w-4 h-4 mr-2" />Add Hotel
                        </Button>
                    )}
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search hotels..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Hotel className="w-5 h-5" />Hotels ({filteredHotels.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredHotels.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Hotel className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No hotels found</p>
                            <p className="text-sm">Try adjusting your search</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Hotel</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Price/Night</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHotels.slice(0, 50).map((hotel) => (
                                        <TableRow key={hotel.id}>
                                            <TableCell className="font-medium">{hotel.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                                    {hotel.city}, {hotel.country}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    {Number(hotel.rating || 0).toFixed(1)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">${Number(hotel.price_per_night || 0).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge className={hotel.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                                    {hotel.status || 'Active'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {hasPermission('hotels.edit') && (
                                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(hotel)} title="Edit">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('hotels.delete') && (
                                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteTarget(hotel)} title="Delete">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {filteredHotels.length > 50 && (
                                <p className="text-center text-muted-foreground text-sm py-4">Showing first 50 of {filteredHotels.length} hotels</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editingHotel ? 'Edit Hotel' : 'Create Hotel'}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2"><Label>Hotel Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Grand Plaza Hotel" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>City *</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Country *</Label><Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>Rating</Label><Input type="number" min="1" max="5" step="0.1" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Price/Night ($)</Label><Input type="number" value={formData.price_per_night} onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
                        </div>
                        <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
                        <div className="space-y-2"><Label>Amenities (comma separated)</Label><Input value={formData.amenities} onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} placeholder="WiFi, Pool, Gym" /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingHotel ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Hotel?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
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
