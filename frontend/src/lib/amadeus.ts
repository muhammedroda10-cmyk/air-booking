import api from './api';

/**
 * Amadeus API Client
 * Provides methods to interact with Amadeus endpoints for location search,
 * airline lookup, flight pricing, and order management.
 */

export interface Location {
    iataCode: string;
    name: string;
    type: 'AIRPORT' | 'CITY';
    city: string;
    cityCode: string;
    country: string;
    countryCode: string;
    detailedName: string;
}

export interface Airline {
    success: boolean;
    code: string;
    icaoCode?: string;
    name: string;
    commonName?: string;
}

export interface PricedOffer {
    success: boolean;
    offer: Record<string, unknown>;
    price: {
        total: string | number;
        base: string | number;
        currency: string;
        grandTotal: string | number;
    };
    cache_key: string;
}

export interface FlightOrder {
    success: boolean;
    order_id: string;
    pnr: string;
    type: string;
    travelers: Array<Record<string, unknown>>;
    flightOffers: Array<Record<string, unknown>>;
    contacts: Array<Record<string, unknown>>;
    ticketingAgreement?: Record<string, unknown>;
    raw?: Record<string, unknown>;
    error?: string;
}

export interface OrderCancellation {
    success: boolean;
    order_id: string;
    message?: string;
    error?: string;
    code?: number;
}

/**
 * Search for airports and cities
 */
export async function searchLocations(
    keyword: string,
    type: string = 'AIRPORT,CITY',
    limit: number = 5
): Promise<{ success: boolean; locations: Location[]; error?: string }> {
    try {
        const response = await api.get('/locations/search', {
            params: { keyword, type, limit }
        });
        return response.data;
    } catch (error: unknown) {
        console.error('Location search failed:', error);
        return { success: false, locations: [], error: 'Failed to search locations' };
    }
}

/**
 * Get airline information by IATA code
 */
export async function getAirlineInfo(code: string): Promise<Airline> {
    try {
        const response = await api.get(`/airlines/lookup/${code.toUpperCase()}`);
        return response.data;
    } catch (error: unknown) {
        console.error('Airline lookup failed:', error);
        return { success: false, code, name: code };
    }
}

/**
 * Price a flight offer for real-time pricing confirmation
 */
export async function priceFlightOffer(offerId: string): Promise<PricedOffer> {
    try {
        const response = await api.post('/flights/price', { offer_id: offerId });
        return response.data;
    } catch (error: unknown) {
        console.error('Flight pricing failed:', error);
        throw error;
    }
}

/**
 * Get flight order details
 */
export async function getFlightOrder(orderId: string): Promise<FlightOrder> {
    try {
        const response = await api.get(`/flights/orders/${orderId}`);
        return response.data;
    } catch (error: unknown) {
        console.error('Get flight order failed:', error);
        return {
            success: false,
            order_id: orderId,
            pnr: '',
            type: '',
            travelers: [],
            flightOffers: [],
            contacts: [],
            error: 'Failed to get order details'
        };
    }
}

/**
 * Cancel a flight order
 */
export async function cancelFlightOrder(orderId: string): Promise<OrderCancellation> {
    try {
        const response = await api.delete(`/flights/orders/${orderId}`);
        return response.data;
    } catch (error: unknown) {
        console.error('Cancel flight order failed:', error);
        return {
            success: false,
            order_id: orderId,
            error: 'Failed to cancel order'
        };
    }
}
