'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Headphones, XCircle } from 'lucide-react';

interface BookingErrorAlertProps {
    errorCode?: string;
    errorMessage?: string;
    bookingId?: number;
    onRetry?: () => void;
    retryLoading?: boolean;
}

const errorDisplayMessages: Record<string, { title: string; description: string }> = {
    PAYMENT_FAILED: {
        title: 'Payment Failed',
        description: 'Your payment could not be processed. Please try again or use a different payment method.',
    },
    SUPPLIER_ERROR: {
        title: 'Booking Failed',
        description: 'The airline could not complete your booking. Please try again in a few moments.',
    },
    VALIDATION_FAILED: {
        title: 'Invalid Information',
        description: 'Some of your booking information was invalid. Please review and correct your details.',
    },
    SEAT_UNAVAILABLE: {
        title: 'Seats Unavailable',
        description: 'The selected seats are no longer available. Please choose different seats.',
    },
    OFFER_EXPIRED: {
        title: 'Offer Expired',
        description: 'This flight offer has expired. Please search for new flights.',
    },
    BOOKING_REJECTED: {
        title: 'Booking Rejected',
        description: 'The airline has rejected this booking. Please contact support for assistance.',
    },
};

export function BookingErrorAlert({
    errorCode,
    errorMessage,
    bookingId,
    onRetry,
    retryLoading,
}: BookingErrorAlertProps) {
    const router = useRouter();

    const errorInfo = errorCode ? errorDisplayMessages[errorCode] : null;
    const title = errorInfo?.title || 'Booking Error';
    const description = errorInfo?.description || errorMessage || 'An unexpected error occurred with your booking.';

    const handleContactSupport = () => {
        // Navigate to create support ticket with booking context
        if (bookingId) {
            router.push(`/account/support/new?booking=${bookingId}&category=booking_issue`);
        } else {
            router.push('/account/support/new?category=booking_issue');
        }
    };

    return (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">
                            {title}
                        </h3>
                        <p className="text-red-700 dark:text-red-400 mb-4">{description}</p>

                        {errorCode && (
                            <p className="text-xs text-red-500 dark:text-red-500 mb-4">
                                Error Code: {errorCode}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-3">
                            {onRetry && (
                                <Button
                                    onClick={onRetry}
                                    disabled={retryLoading}
                                    className="gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${retryLoading ? 'animate-spin' : ''}`} />
                                    {retryLoading ? 'Retrying...' : 'Try Again'}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleContactSupport}
                                className="gap-2"
                            >
                                <Headphones className="w-4 h-4" />
                                Contact Support
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function BookingStatusBanner({ status, errorCode }: { status: string; errorCode?: string }) {
    if (status !== 'failed' && !errorCode) {
        return null;
    }

    return (
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-800 dark:text-red-300">
                    This booking has failed
                </span>
            </div>
            {errorCode && (
                <p className="text-sm text-red-700 dark:text-red-400 mt-1 ml-7">
                    Error: {errorCode}
                </p>
            )}
        </div>
    );
}
