"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Globe, User, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/context/language-context"

export function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)
    const { toggleLanguage, t } = useLanguage()

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
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Plane className="w-5 h-5 text-primary rotate-[-45deg]" />
                    </div>
                    <span className="text-xl font-bold tracking-widest text-slate-900 dark:text-white uppercase">
                        Voyager
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-10">
                    <Link href="/flights" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300">
                        {t.nav.flights}
                    </Link>
                    <Link href="/hotels" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300">
                        {t.nav.hotels}
                    </Link>
                    <Link href="/deals" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300">
                        {t.nav.deals}
                    </Link>
                    <Link href="/support" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300">
                        {t.nav.support}
                    </Link>
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={toggleLanguage} className="text-slate-600 dark:text-slate-300 hover:text-primary">
                        <Globe className="w-4 h-4 mr-2" />
                        <span className="text-xs uppercase font-semibold">EN</span>
                    </Button>
                    <Link href="/login">
                        <Button variant="default" size="sm" className="rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                            <User className="w-4 h-4 mr-2" />
                            {t.nav.signin}
                        </Button>
                    </Link>
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
                            <Link href="/flights" className="text-base font-medium py-2 text-slate-900 dark:text-white">
                                {t.nav.flights}
                            </Link>
                            <Link href="/hotels" className="text-base font-medium py-2 text-slate-900 dark:text-white">
                                {t.nav.hotels}
                            </Link>
                            <Link href="/deals" className="text-base font-medium py-2 text-slate-900 dark:text-white">
                                {t.nav.deals}
                            </Link>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                            <Link href="/login">
                                <Button className="w-full justify-center gap-2 rounded-full">
                                    <User className="w-4 h-4" />
                                    {t.nav.signin}
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}

