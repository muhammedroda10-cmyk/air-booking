'use client';

import { useState, useCallback } from 'react';
import { priceFlightOffer, PricedOffer } from '@/lib/amadeus';

interface UseFlightPricingReturn {
    pricedOffer: PricedOffer | null;
    isLoading: boolean;
    error: string | null;
    priceFlight: (offerId: string) => Promise<PricedOffer | null>;
    reset: () => void;
}

/**
 * Hook for pricing flight offers before booking
 * Confirms real-time pricing with Amadeus API
 */
export function useFlightPricing(): UseFlightPricingReturn {
    const [pricedOffer, setPricedOffer] = useState<PricedOffer | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const priceFlight = useCallback(async (offerId: string): Promise<PricedOffer | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await priceFlightOffer(offerId);

            if (result.success) {
                setPricedOffer(result);
                return result;
            } else {
                setError('Failed to confirm pricing');
                return null;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Pricing failed';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setPricedOffer(null);
        setIsLoading(false);
        setError(null);
    }, []);

    return {
        pricedOffer,
        isLoading,
        error,
        priceFlight,
        reset,
    };
}

export default useFlightPricing;
