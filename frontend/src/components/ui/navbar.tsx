"use client"

import * as React from "react"
import { LocaleLink } from "@/components/locale-link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Globe, User, Plane, LogOut, LayoutDashboard, Wallet, Settings, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/context/language-context"
import { useAuth } from "@/context/auth-context"
import { NotificationBell } from "@/components/notification-bell"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)
    const { language, switchLanguage, t } = useLanguage()
    const { user, isAuthenticated, isLoading, logout } = useAuth()

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                scrolled ? "bg-white/80 backdrop-blur-md shadow-sm dark:bg-slate-950/80 py-3" : "bg-transparent py-5"
            )}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <LocaleLink href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Plane className="w-5 h-5 text-primary rotate-[-45deg]" />
                    </div>
                    <span className="text-xl font-bold tracking-widest text-slate-900 dark:text-white uppercase">
                        Voyager
                    </span>
                </LocaleLink>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-10">
                    <LocaleLink href="/flights" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300">
                        {t.nav.flights}
                    </LocaleLink>
                    <LocaleLink href="/hotels" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300">
                        {t.nav.hotels}
                    </LocaleLink>
                    <LocaleLink href="/deals" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300">
                        {t.nav.deals}
                    </LocaleLink>
                    <LocaleLink href="/support" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300">
                        {t.nav.support}
                    </LocaleLink>
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => switchLanguage(language === 'en' ? 'ar' : 'en')}
                        className="text-slate-600 dark:text-slate-300 hover:text-primary gap-2"
                    >
                        <Globe className="w-4 h-4" />
                        <span className="text-xs uppercase font-semibold">
                            {language === 'en' ? 'عربي' : 'EN'}
                        </span>
                    </Button>

                    {isLoading ? (
                        <div className="w-24 h-9 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                    ) : isAuthenticated && user ? (
                        <>
                            <NotificationBell />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="default" size="sm" className="rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                                        <User className="w-4 h-4 mr-2" />
                                        {user.name}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{user.name}</span>
                                            <span className="text-xs text-slate-500 font-normal">{user.email}</span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <LocaleLink href={user.role === 'admin' || user.role_id ? '/dashboard' : '/account'} className="cursor-pointer">
                                            <LayoutDashboard className="w-4 h-4 mr-2" />
                                            {user.role === 'admin' || user.role_id ? (t.nav.dashboard || 'Dashboard') : (t.nav.dashboard || 'My Account')}
                                        </LocaleLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <LocaleLink href="/account/trips" className="cursor-pointer">
                                            <Plane className="w-4 h-4 mr-2" />
                                            My Trips
                                        </LocaleLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <LocaleLink href="/account/history" className="cursor-pointer">
                                            <Clock className="w-4 h-4 mr-2" />
                                            History
                                        </LocaleLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <LocaleLink href="/account/wallet" className="cursor-pointer">
                                            <Wallet className="w-4 h-4 mr-2" />
                                            {t.nav.wallet || 'Wallet'}
                                        </LocaleLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <LocaleLink href="/account/profile" className="cursor-pointer">
                                            <User className="w-4 h-4 mr-2" />
                                            Profile
                                        </LocaleLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <LocaleLink href="/account/settings" className="cursor-pointer">
                                            <Settings className="w-4 h-4 mr-2" />
                                            {t.nav.settings || 'Settings'}
                                        </LocaleLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 dark:text-red-400">
                                        <LogOut className="w-4 h-4 mr-2" />
                                        {t.nav.signout || 'Sign Out'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <LocaleLink href="/login">
                            <Button variant="default" size="sm" className="rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                                <User className="w-4 h-4 mr-2" />
                                {t.nav.signin}
                            </Button>
                        </LocaleLink>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-slate-900 dark:text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
                            <LocaleLink href="/flights" className="text-base font-medium py-2 text-slate-900 dark:text-white">
                                {t.nav.flights}
                            </LocaleLink>
                            <LocaleLink href="/hotels" className="text-base font-medium py-2 text-slate-900 dark:text-white">
                                {t.nav.hotels}
                            </LocaleLink>
                            <LocaleLink href="/deals" className="text-base font-medium py-2 text-slate-900 dark:text-white">
                                {t.nav.deals}
                            </LocaleLink>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                            <Button
                                variant="outline"
                                onClick={() => switchLanguage(language === 'en' ? 'ar' : 'en')}
                                className="w-full justify-center gap-2"
                            >
                                <Globe className="w-4 h-4" />
                                {language === 'en' ? 'العربية' : 'English'}
                            </Button>
                            <LocaleLink href="/login">
                                <Button className="w-full justify-center gap-2 rounded-full">
                                    <User className="w-4 h-4" />
                                    {t.nav.signin}
                                </Button>
                            </LocaleLink>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
