'use client';

import { useState, useCallback } from 'react';
import { getFlightOrder, cancelFlightOrder, FlightOrder, OrderCancellation } from '@/lib/amadeus';

interface UseFlightOrderReturn {
    order: FlightOrder | null;
    cancellation: OrderCancellation | null;
    isLoading: boolean;
    isCancelling: boolean;
    error: string | null;
    fetchOrder: (orderId: string) => Promise<FlightOrder | null>;
    cancelOrder: (orderId: string) => Promise<OrderCancellation | null>;
    reset: () => void;
}

/**
 * Hook for managing Amadeus flight orders
 * Provides methods to fetch and cancel orders
 */
export function useFlightOrder(): UseFlightOrderReturn {
    const [order, setOrder] = useState<FlightOrder | null>(null);
    const [cancellation, setCancellation] = useState<OrderCancellation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrder = useCallback(async (orderId: string): Promise<FlightOrder | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await getFlightOrder(orderId);

            if (result.success) {
                setOrder(result);
                return result;
            } else {
                setError(result.error || 'Failed to fetch order');
                return null;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const cancelOrder = useCallback(async (orderId: string): Promise<OrderCancellation | null> => {
        setIsCancelling(true);
        setError(null);

        try {
            const result = await cancelFlightOrder(orderId);

            if (result.success) {
                setCancellation(result);
                return result;
            } else {
                setError(result.error || 'Failed to cancel order');
                return null;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to cancel order';
            setError(errorMessage);
            return null;
        } finally {
            setIsCancelling(false);
        }
    }, []);

    const reset = useCallback(() => {
        setOrder(null);
        setCancellation(null);
        setIsLoading(false);
        setIsCancelling(false);
        setError(null);
    }, []);

    return {
        order,
        cancellation,
        isLoading,
        isCancelling,
        error,
        fetchOrder,
        cancelOrder,
        reset,
    };
}

export default useFlightOrder;
