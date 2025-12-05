'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Clock, DollarSign, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface CancellationModalProps {
    booking: {
        id: number;
        pnr: string;
        total_price: number;
        flight?: {
            airline: { name: string };
            flight_number: string;
            departure_time: string;
        };
    };
    onClose: () => void;
    onCancelled: () => void;
}

interface RefundDetails {
    can_cancel: boolean;
    refund_percentage: number;
    refund_amount: number;
    cancellation_fee: number;
    hours_until_departure: number;
    message: string;
    airline_policy?: any;
}

export function CancellationModal({ booking, onClose, onCancelled }: CancellationModalProps) {
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [refundDetails, setRefundDetails] = useState<RefundDetails | null>(null);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRefundPreview();
    }, []);

    const fetchRefundPreview = async () => {
        try {
            const response = await api.get(`/bookings/${booking.id}/cancel-preview`);
            setRefundDetails({
                can_cancel: response.data.can_cancel,
                ...response.data.refund_details,
                airline_policy: response.data.airline_policy,
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load cancellation details');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        setError('');

        try {
            await api.post(`/bookings/${booking.id}/cancel`, { reason });
            onCancelled();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel booking');
            setCancelling(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Cancel Booking</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-lg">
                            {error}
                        </div>
                    ) : refundDetails && !refundDetails.can_cancel ? (
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-700 dark:text-red-400">
                                        Cannot Cancel This Booking
                                    </p>
                                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                        {refundDetails.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : refundDetails ? (
                        <>
                            {/* Booking Info */}
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                <p className="text-sm text-muted-foreground">Booking Reference</p>
                                <p className="font-mono font-bold">{booking.pnr}</p>
                                {booking.flight && (
                                    <p className="text-sm mt-1">
                                        {booking.flight.airline.name} {booking.flight.flight_number}
                                    </p>
                                )}
                            </div>

                            {/* Warning */}
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-amber-700 dark:text-amber-400">
                                            Are you sure you want to cancel?
                                        </p>
                                        <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                                            This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Refund Details */}
                            <div className="space-y-3">
                                <h3 className="font-medium flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Refund Details
                                </h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Original Amount</span>
                                        <span className="font-medium">${booking.total_price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Refund Percentage</span>
                                        <span className={`font-medium ${refundDetails.refund_percentage === 100 ? 'text-green-600' : refundDetails.refund_percentage === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                            {refundDetails.refund_percentage}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Cancellation Fee</span>
                                        <span className="font-medium text-red-600">-${refundDetails.cancellation_fee.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between">
                                        <span className="font-medium">Refund Amount</span>
                                        <span className="font-bold text-green-600">${refundDetails.refund_amount.toFixed(2)}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {refundDetails.message}
                                </p>
                            </div>

                            {/* Reason Input */}
                            <div>
                                <label className="text-sm font-medium">Reason (optional)</label>
                                <Input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Why are you cancelling?"
                                    className="mt-1"
                                />
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={cancelling}>
                        Keep Booking
                    </Button>
                    {refundDetails?.can_cancel && (
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleCancel}
                            disabled={cancelling}
                        >
                            {cancelling ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                'Confirm Cancellation'
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
