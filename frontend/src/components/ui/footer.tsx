"use client"

import Link from "next/link"
import { useLanguage } from "@/context/language-context"

import { useState } from "react"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Plane, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export function Footer() {
    const { t } = useLanguage()
    const { toast } = useToast()
    const [email, setEmail] = useState("")

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await api.post('/newsletter', { email })
            toast({
                title: "Subscribed!",
                description: "Thank you for subscribing to our newsletter.",
            })
            setEmail("")
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to subscribe. Please try again.",
                variant: "destructive"
            })
        }
    }

    return (
        <footer className="bg-slate-900 text-slate-200 pt-20 pb-10">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                <Plane className="w-5 h-5 text-white rotate-[-45deg]" />
                            </div>
                            <span className="text-2xl font-bold tracking-widest text-white uppercase">
                                Voyager
                            </span>
                        </Link>
                        <p className="text-slate-400 leading-relaxed">
                            {t.footer.tagline}
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors text-white">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors text-white">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors text-white">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors text-white">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">{t.footer.company}</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/about" className="text-slate-400 hover:text-primary transition-colors">{t.footer.about}</Link></li>
                            <li><Link href="/careers" className="text-slate-400 hover:text-primary transition-colors">{t.footer.careers}</Link></li>
                            <li><Link href="/blog" className="text-slate-400 hover:text-primary transition-colors">{t.footer.blog}</Link></li>
                            <li><Link href="/press" className="text-slate-400 hover:text-primary transition-colors">Press</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">{t.footer.support}</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/help" className="text-slate-400 hover:text-primary transition-colors">{t.footer.help}</Link></li>
                            <li><Link href="/contact" className="text-slate-400 hover:text-primary transition-colors">{t.footer.contact}</Link></li>
                            <li><Link href="/privacy" className="text-slate-400 hover:text-primary transition-colors">{t.footer.privacy}</Link></li>
                            <li><Link href="/terms" className="text-slate-400 hover:text-primary transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">{t.footer.newsletter}</h4>
                        <p className="text-sm text-slate-400 mb-4">{t.footer.newsletter_desc}</p>
                        <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-3">
                            <input
                                type="email"
                                placeholder={t.footer.email_placeholder}
                                className="bg-slate-800 border-none rounded-lg px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder:text-slate-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="bg-primary text-white px-4 py-3 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors uppercase tracking-wide">
                                {t.footer.join}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                    <p>© {new Date().getFullYear()} Voyager Inc. {t.footer.rights}</p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
                        <Link href="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
