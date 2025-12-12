'use client';

import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    Plane,
    MapPin,
    Building2,
    LogOut,
    Users,
    Ticket,
    Hotel,
    Tag,
    Star,
    ServerCog,
    Headphones,
    Shield,
    UserCog,
    DollarSign,
    Wallet,
    Menu,
    X,
    Activity,
    BarChart3,
    Bell,
    Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Permission {
    id: number;
    slug: string;
    name: string;
}

interface NavItem {
    name: string;
    href: string;
    icon: any;
    permission?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            // Check if user is a staff member
            if (!user || (!user.role_id && user.role !== 'admin')) {
                router.push('/login');
            } else {
                fetchPermissions();
            }
        }
    }, [user, isLoading, router]);

    const fetchPermissions = async () => {
        try {
            const { data } = await api.get('/user');
            // For super admins (role='admin' legacy), grant all permissions
            if (user?.role === 'admin') {
                setPermissions(['*']);
            } else if (data.permissions) {
                setPermissions(data.permissions.map((p: Permission) => p.slug));
            }
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
        }
    };

    const hasPermission = (permission?: string): boolean => {
        if (!permission) return true;
        if (permissions.includes('*')) return true;
        return permissions.includes(permission);
    };

    if (isLoading || !user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Navigation sections with permission requirements
    const navSections = [
        {
            title: null, // No header for overview
            items: [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Live Bookings', href: '/dashboard/live', icon: Activity, permission: 'bookings.view' },
            ]
        },
        {
            title: 'Sales & Bookings',
            items: [
                { name: 'Flight Bookings', href: '/dashboard/bookings', icon: Ticket, permission: 'bookings.view' },
                { name: 'Hotel Bookings', href: '/dashboard/hotel-bookings', icon: Hotel, permission: 'bookings.view' },
                { name: 'Passengers', href: '/dashboard/passengers', icon: UserCog, permission: 'passengers.view' },
            ]
        },
        {
            title: 'Accounting',
            items: [
                { name: 'Transactions', href: '/dashboard/transactions', icon: Wallet, permission: 'transactions.view' },
                { name: 'Refunds', href: '/dashboard/refunds', icon: DollarSign, permission: 'refunds.view' },
                { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, permission: 'transactions.view' },
            ]
        },
        {
            title: 'Catalog',
            items: [
                { name: 'Flights', href: '/dashboard/flights', icon: Plane, permission: 'flights.view' },
                { name: 'Airlines', href: '/dashboard/airlines', icon: Plane, permission: 'airlines.view' },
                { name: 'Airports', href: '/dashboard/airports', icon: MapPin, permission: 'airports.view' },
                { name: 'Hotels', href: '/dashboard/hotels', icon: Building2, permission: 'hotels.view' },
            ]
        },
        {
            title: 'Marketing',
            items: [
                { name: 'Promo Codes', href: '/dashboard/promo-codes', icon: Tag, permission: 'promo_codes.view' },
                { name: 'Reviews', href: '/dashboard/reviews', icon: Star, permission: 'reviews.view' },
            ]
        },
        {
            title: 'Support',
            items: [
                { name: 'Support Tickets', href: '/dashboard/support', icon: Headphones, permission: 'support.view' },
                { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, permission: 'users.view' },
            ]
        },
        {
            title: 'Administration',
            items: [
                { name: 'Users', href: '/dashboard/users', icon: Users, permission: 'users.view' },
                { name: 'Roles', href: '/dashboard/roles', icon: Shield, permission: 'roles.view' },
                { name: 'Suppliers', href: '/dashboard/suppliers', icon: ServerCog, permission: 'suppliers.view' },
                { name: 'Activity Log', href: '/dashboard/activity', icon: Activity, permission: 'users.view' },
                { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'users.view' },
            ]
        },
    ];


    // Filter sections based on permissions
    const getVisibleItems = (items: NavItem[]) => items.filter(item => hasPermission(item.permission));

    const getRoleBadge = () => {
        if (user.role === 'admin') return 'Super Admin';
        // Could be extended to show the actual role name
        return 'Staff';
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            {/* Mobile menu button */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar */}
            <aside className={cn(
                "w-64 bg-white dark:bg-slate-950 border-r flex-col fixed h-screen z-40 transition-transform overflow-y-auto",
                mobileMenuOpen ? "flex" : "hidden md:flex"
            )}>
                <div className="p-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-blue-900 dark:text-white">Dashboard</span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {navSections.map((section, sectionIndex) => {
                        const visibleItems = getVisibleItems(section.items);
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={sectionIndex} className={sectionIndex > 0 ? "pt-4" : ""}>
                                {section.title && (
                                    <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {section.title}
                                    </div>
                                )}
                                {visibleItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-4 border-t space-y-3">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                            {user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{user?.name}</div>
                            <div className="text-xs text-muted-foreground">{getRoleBadge()}</div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={logout}
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto md:ml-64">
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
