'use client';

import { useState, useCallback } from 'react';
import { getAirlineInfo, Airline } from '@/lib/amadeus';

interface UseAirlineInfoReturn {
    airlines: Map<string, Airline>;
    isLoading: boolean;
    getAirline: (code: string) => Promise<Airline | null>;
    getCached: (code: string) => Airline | undefined;
}

/**
 * Hook for fetching and caching airline information
 */
export function useAirlineInfo(): UseAirlineInfoReturn {
    const [airlines, setAirlines] = useState<Map<string, Airline>>(new Map());
    const [isLoading, setIsLoading] = useState(false);

    const getAirline = useCallback(async (code: string): Promise<Airline | null> => {
        const upperCode = code.toUpperCase();

        // Check cache first
        const cached = airlines.get(upperCode);
        if (cached) {
            return cached;
        }

        setIsLoading(true);

        try {
            const result = await getAirlineInfo(upperCode);

            if (result.success) {
                setAirlines(prev => new Map(prev).set(upperCode, result));
                return result;
            }
            return null;
        } catch (err) {
            console.error('Failed to fetch airline:', err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [airlines]);

    const getCached = useCallback((code: string): Airline | undefined => {
        return airlines.get(code.toUpperCase());
    }, [airlines]);

    return {
        airlines,
        isLoading,
        getAirline,
        getCached,
    };
}

export default useAirlineInfo;
