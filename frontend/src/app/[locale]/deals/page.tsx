'use client';

import { useState, useEffect } from 'react';
import { PublicLayout } from "@/components/layouts/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Clock, ArrowRight, MapPin, Calendar, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import api from "@/lib/api";

interface Promotion {
    id: number;
    title: string;
    description: string;
    discount: string;
    code: string;
    image: string;
    valid_until: string;
    destinations: string[];
    min_price: number;
    type: string;
}

export default function DealsPage() {
    const [deals, setDeals] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const response = await api.get('/promotions');
                setDeals(response.data);
            } catch (error) {
                console.error('Failed to fetch deals', error);
                // Fallback data
                setDeals([
                    {
                        id: 1,
                        title: 'Summer in Paris',
                        description: 'Round trip from Dubai starting at $450',
                        discount: '20% OFF',
                        code: 'SUMMER20',
                        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
                        valid_until: '2025-06-30',
                        destinations: ['Paris'],
                        min_price: 450,
                        type: 'percentage',
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchDeals();
    }, []);

    return (
        <PublicLayout>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 py-16 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Exclusive Deals</h1>
                    <p className="text-xl text-orange-100 max-w-2xl mx-auto">
                        Unbeatable prices for your next adventure. Don't miss out!
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {deals.map((deal) => (
                            <DealCard key={deal.id} deal={deal} />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

function DealCard({ deal }: { deal: Promotion }) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(deal.code);
        setCopied(true);
        toast({
            title: "Code Copied!",
            description: `Use code ${deal.code} at checkout`,
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const daysRemaining = Math.ceil((new Date(deal.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysRemaining <= 7;

    return (
        <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
            <div className="relative h-48 overflow-hidden">
                <img
                    src={deal.image}
                    alt={deal.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                    <Badge className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {deal.discount}
                    </Badge>
                </div>
                {isExpiringSoon && (
                    <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-orange-500 text-white">
                            Ending Soon!
                        </Badge>
                    </div>
                )}
            </div>
            <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {deal.title}
                </h3>
                <p className="text-muted-foreground mb-4">{deal.description}</p>

                {/* Destinations */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{deal.destinations.join(', ')}</span>
                </div>

                {/* Promo Code */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 font-mono text-sm flex items-center justify-between">
                        <span>{deal.code}</span>
                        <button
                            onClick={copyCode}
                            className="text-primary hover:text-primary/80"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <div className={`flex items-center gap-1 font-medium ${isExpiringSoon ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        <Calendar className="w-4 h-4" />
                        {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expires today'}
                    </div>
                    <Link href="/flights">
                        <Button variant="ghost" className="gap-1 hover:gap-2 transition-all p-0 h-auto font-bold text-primary">
                            Book Now <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
