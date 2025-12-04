'use client';

import { PublicLayout } from "@/components/layouts/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, FileText, Users, Mail } from "lucide-react";

export default function PrivacyPage() {
    return (
        <PublicLayout>
            <div className="bg-slate-50 dark:bg-slate-900 py-12 border-b">
                <div className="container mx-auto px-4 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        We are committed to protecting your personal data and ensuring your privacy.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">Last updated: December 1, 2024</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Navigation (Desktop) */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-24 space-y-2">
                            <p className="font-bold mb-4 px-4">Contents</p>
                            <nav className="space-y-1">
                                <NavLink href="#introduction" label="1. Introduction" />
                                <NavLink href="#collection" label="2. Information We Collect" />
                                <NavLink href="#usage" label="3. How We Use Information" />
                                <NavLink href="#security" label="4. Data Security" />
                                <NavLink href="#contact" label="5. Contact Us" />
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9 max-w-3xl">
                        <div className="space-y-12">
                            <Section id="introduction" title="1. Introduction" icon={<FileText className="w-5 h-5" />}>
                                <p>
                                    At SkyWings, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services. By using our services, you consent to the data practices described in this statement.
                                </p>
                            </Section>

                            <Section id="collection" title="2. Information We Collect" icon={<Eye className="w-5 h-5" />}>
                                <p className="mb-4">We collect information that you provide directly to us, such as when you create an account, book a flight, or contact customer support. This may include:</p>
                                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                    <li>Personal identification information (Name, email address, phone number, etc.)</li>
                                    <li>Payment information (Credit card details, billing address)</li>
                                    <li>Travel preferences and history</li>
                                    <li>Passport and visa information</li>
                                </ul>
                            </Section>

                            <Section id="usage" title="3. How We Use Your Information" icon={<Users className="w-5 h-5" />}>
                                <p className="mb-4">We use the information we collect to:</p>
                                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                    <li>Process your bookings and payments securely</li>
                                    <li>Send you flight updates, travel information, and promotional offers</li>
                                    <li>Improve our website, services, and customer experience</li>
                                    <li>Comply with legal obligations and prevent fraud</li>
                                </ul>
                            </Section>

                            <Section id="security" title="4. Data Security" icon={<Lock className="w-5 h-5" />}>
                                <p>
                                    We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. We use industry-standard encryption technologies when transferring and receiving consumer data exchanged with our site.
                                </p>
                            </Section>

                            <Section id="contact" title="5. Contact Us" icon={<Mail className="w-5 h-5" />}>
                                <p>
                                    If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@skywings.com" className="text-primary hover:underline">privacy@skywings.com</a>.
                                </p>
                            </Section>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

function Section({ id, title, children, icon }: { id: string, title: string, children: React.ReactNode, icon?: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {icon}
                </div>
                <h2 className="text-2xl font-bold">{title}</h2>
            </div>
            <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                {children}
            </div>
        </section>
    )
}

function NavLink({ href, label }: { href: string, label: string }) {
    return (
        <a
            href={href}
            className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
            {label}
        </a>
    )
}


