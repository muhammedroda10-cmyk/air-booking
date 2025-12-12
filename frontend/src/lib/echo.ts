import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Echo
if (typeof window !== 'undefined') {
    (window as any).Pusher = Pusher;
}

let echoInstance: Echo<any> | null = null;

/**
 * Get or create the Echo instance for WebSocket connections
 * Uses Laravel Reverb as the WebSocket server
 */
export function getEcho(): Echo<any> {
    if (echoInstance) {
        return echoInstance;
    }

    if (typeof window === 'undefined') {
        throw new Error('Echo can only be initialized on the client side');
    }

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'myapp',
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost',
        wsPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080', 10),
        wssPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080', 10),
        forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
    });

    return echoInstance;
}

/**
 * Disconnect the Echo instance
 */
export function disconnectEcho(): void {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }
}

/**
 * Subscribe to the bookings channel for real-time updates
 */
export function subscribeToBookings(
    onNewBooking: (booking: any) => void,
    onBookingUpdated?: (booking: any) => void
) {
    const echo = getEcho();

    const channel = echo.channel('bookings');

    channel.listen('.booking.created', (data: { booking: any }) => {
        onNewBooking(data.booking);
    });

    if (onBookingUpdated) {
        channel.listen('.booking.updated', (data: { booking: any }) => {
            onBookingUpdated(data.booking);
        });
    }

    return () => {
        channel.stopListening('.booking.created');
        if (onBookingUpdated) {
            channel.stopListening('.booking.updated');
        }
    };
}
