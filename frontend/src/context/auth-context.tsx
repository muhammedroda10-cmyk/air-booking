'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
}

interface RoleRelation {
    id: number;
    name: string;
    slug: string;
    description?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    role_id: number | null;
    role_relation?: RoleRelation;
    permissions?: Permission[];
}

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setIsLoading(false);
    }, []);

    const login = (token: string, user: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        // Staff users go to dashboard, customers go to account
        if (user.role === 'admin' || user.role_id) {
            router.push('/dashboard');
        } else {
            router.push('/account');
        }
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            router.push('/login');
        }
    };

    /**
     * Check if user has a specific permission.
     * Super admins (role='admin') bypass all checks.
     */
    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        // Super admin bypass
        if (user.role === 'admin') return true;
        // Check permission array
        return user.permissions?.some(p => p.slug === permission) ?? false;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Hook to check a specific permission.
 * Returns true if user has the permission or is a super admin.
 */
export const usePermission = (permission: string): boolean => {
    const { hasPermission } = useAuth();
    return hasPermission(permission);
};
