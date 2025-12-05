"use client"

import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { LocaleLink } from "@/components/locale-link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Plane, Building2, Wallet, User, Settings, History, LayoutDashboard } from "lucide-react"

interface UserLayoutProps {
    children: React.ReactNode
}

const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/trips", label: "My Trips", icon: Plane },
    { href: "/dashboard/hotel-bookings", label: "Hotels", icon: Building2 },
    { href: "/dashboard/history", label: "History", icon: History },
    { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function UserLayout({ children }: UserLayoutProps) {
    const pathname = usePathname()

    // Extract locale-independent path for comparison
    const getPathWithoutLocale = (path: string) => {
        const segments = path.split('/')
        // Remove locale segment (e.g., /en or /ar)
        if (segments[1] === 'en' || segments[1] === 'ar') {
            return '/' + segments.slice(2).join('/')
        }
        return path
    }

    const currentPath = getPathWithoutLocale(pathname)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <Navbar />

            {/* Hero Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-8">
                <div className="container mx-auto px-6">
                    <h1 className="text-3xl font-bold text-white mb-2">My Account</h1>
                    <p className="text-slate-400">Manage your trips, bookings, and account settings</p>
                </div>
            </div>

            {/* Sub Navigation */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-40">
                <div className="container mx-auto px-6">
                    <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = currentPath === item.href ||
                                (item.href !== '/dashboard' && currentPath.startsWith(item.href))

                            return (
                                <LocaleLink
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                                        isActive
                                            ? "bg-primary text-white shadow-md shadow-primary/20"
                                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </LocaleLink>
                            )
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-6 py-8">
                {children}
            </main>

            <Footer />
        </div>
    )
}
