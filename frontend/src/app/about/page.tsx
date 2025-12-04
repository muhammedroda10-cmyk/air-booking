'use client';

import { PublicLayout } from "@/components/layouts/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Globe, Users, Award } from "lucide-react";

export default function AboutPage() {
    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="relative bg-slate-900 text-white py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <Badge variant="secondary" className="mb-4">Established 2024</Badge>
                    <h1 className="text-5xl font-bold mb-6 tracking-tight">Redefining Air Travel</h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        SkyWings is dedicated to connecting the world with safety, comfort, and innovation at the heart of everything we do.
                    </p>
                </div>
            </div>

            {/* Stats Section */}
            <div className="container mx-auto px-4 -mt-12 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatsCard icon={<Globe className="w-6 h-6 text-blue-500" />} value="150+" label="Destinations" />
                    <StatsCard icon={<Plane className="w-6 h-6 text-indigo-500" />} value="500+" label="Daily Flights" />
                    <StatsCard icon={<Users className="w-6 h-6 text-teal-500" />} value="10M+" label="Happy Passengers" />
                    <StatsCard icon={<Award className="w-6 h-6 text-amber-500" />} value="#1" label="Customer Service" />
                </div>
            </div>

            {/* Mission & Values */}
            <div className="container mx-auto px-4 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                        <p className="text-lg text-muted-foreground mb-6">
                            To inspire and enable the world to travel by providing the safest, most reliable, and most comfortable air travel experience.
                        </p>
                        <div className="space-y-4">
                            <ValueItem title="Safety First" description="We never compromise on the safety of our passengers and crew." />
                            <ValueItem title="Customer Obsession" description="We go above and beyond to exceed customer expectations." />
                            <ValueItem title="Innovation" description="We embrace technology to improve every aspect of the journey." />
                            <ValueItem title="Sustainability" description="We are committed to reducing our environmental footprint." />
                        </div>
                    </div>
                    <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556388169-db19adc96088?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center" />
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

function StatsCard({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
    return (
        <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    {icon}
                </div>
                <p className="text-3xl font-bold mb-1">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
        </Card>
    )
}

function ValueItem({ title, description }: { title: string, description: string }) {
    return (
        <div className="flex gap-4">
            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2.5 shrink-0" />
            <div>
                <h3 className="font-bold">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}
