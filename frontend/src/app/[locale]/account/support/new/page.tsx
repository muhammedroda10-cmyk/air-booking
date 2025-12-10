'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { UserLayout } from '@/components/layouts/user-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Send } from 'lucide-react';

interface Booking {
    id: number;
    pnr: string;
    status: string;
    created_at: string;
    flight_details?: {
        origin?: string;
        destination?: string;
    };
    external_booking_data?: {
        flight?: {
            origin?: string;
            destination?: string;
        };
    };
}

interface Options {
    categories: Record<string, string>;
    priorities: Record<string, string>;
}

export default function NewTicketPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [options, setOptions] = useState<Options>({
        categories: {},
        priorities: {},
    });

    // Get query params for pre-filling
    const prefilledBookingId = searchParams.get('booking') || '';
    const prefilledCategory = searchParams.get('category') || '';

    const [formData, setFormData] = useState({
        subject: '',
        category: prefilledCategory,
        priority: 'medium',
        message: '',
        booking_id: prefilledBookingId,
    });

    useEffect(() => {
        fetchOptions();
        fetchBookings();
    }, []);

    const fetchOptions = async () => {
        try {
            const { data } = await api.get('/support-tickets/options');
            setOptions({
                categories: data.categories || {},
                priorities: data.priorities || {},
            });
        } catch (error) {
            console.error('Failed to load options:', error);
        }
    };

    const fetchBookings = async () => {
        try {
            const { data } = await api.get('/bookings');
            setBookings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.subject || !formData.category || !formData.message) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        if (formData.message.length < 10) {
            toast({
                title: 'Error',
                description: 'Message must be at least 10 characters',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                booking_id: formData.booking_id ? parseInt(formData.booking_id) : null,
            };
            const { data } = await api.post('/support-tickets', payload);
            toast({
                title: 'Ticket Created',
                description: `Your support ticket #${data.ticket?.ticket_number} has been created.`,
            });
            router.push(`/account/support/${data.ticket?.id}`);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create ticket',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getBookingLabel = (booking: Booking) => {
        const flightInfo = booking.flight_details || booking.external_booking_data?.flight;
        const route = flightInfo ? `${flightInfo.origin || '?'} → ${flightInfo.destination || '?'}` : '';
        return `#${booking.pnr}${route ? ` - ${route}` : ''} (${booking.status})`;
    };

    return (
        <UserLayout>
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 gap-2"
                    onClick={() => router.push('/account/support')}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tickets
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Support Ticket</CardTitle>
                        <CardDescription>
                            Describe your issue and we&apos;ll get back to you as soon as possible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(options.categories).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Related Booking (Optional) */}
                            {bookings.length > 0 && (
                                <div className="space-y-2">
                                    <Label htmlFor="booking">Related Booking (Optional)</Label>
                                    <Select
                                        value={formData.booking_id || 'none'}
                                        onValueChange={(value) => setFormData({ ...formData, booking_id: value === 'none' ? '' : value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a booking (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {bookings.map((booking) => (
                                                <SelectItem key={booking.id} value={booking.id.toString()}>
                                                    {getBookingLabel(booking)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Subject */}
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject *</Label>
                                <Input
                                    id="subject"
                                    placeholder="Brief description of your issue"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    maxLength={255}
                                    required
                                />
                            </div>

                            {/* Priority */}
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(options.priorities).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Please select appropriately. Urgent tickets are for critical issues only.
                                </p>
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <Label htmlFor="message">Message *</Label>
                                <textarea
                                    id="message"
                                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Please describe your issue in detail. Include any relevant information such as booking reference numbers, dates, or error messages."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {formData.message.length} characters (minimum 10)
                                </p>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/account/support')}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading} className="flex-1 gap-2">
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Ticket
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </UserLayout>
    );
}
