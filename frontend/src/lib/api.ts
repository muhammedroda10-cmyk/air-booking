import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// Public GET endpoints that don't require authentication
const publicGetEndpoints = [
    '/flights/search',
    '/flights/routes',
    '/flights',
    '/airports',
    '/airlines',
    '/hotels',
    '/hotels/search',
    '/blog',
    '/promotions',
];

// Public POST endpoints
const publicPostEndpoints = [
    '/register',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/contact',
    '/newsletter',
];

const isPublicEndpoint = (url: string | undefined, method: string | undefined): boolean => {
    if (!url) return false;
    const httpMethod = (method || 'get').toLowerCase();

    if (httpMethod === 'get') {
        return publicGetEndpoints.some(endpoint => url.includes(endpoint));
    }

    if (httpMethod === 'post') {
        return publicPostEndpoints.some(endpoint => url.includes(endpoint));
    }

    return false;
};

api.interceptors.request.use((config) => {
    // Only add token for non-public endpoints
    if (!isPublicEndpoint(config.url, config.method)) {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect to login for 401 on protected endpoints
        if (error.response?.status === 401 && !isPublicEndpoint(error.config?.url, error.config?.method)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
