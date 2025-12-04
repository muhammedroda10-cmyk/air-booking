'use client';

import { PublicLayout } from "@/components/layouts/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, Clock, ArrowRight } from "lucide-react";

export default function DealsPage() {
    return (
        <PublicLayout>
            <div className="bg-primary py-12 text-white">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Exclusive Deals</h1>
                    <p className="text-xl text-blue-100">Unbeatable prices for your next adventure.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <DealCard
                        title="Summer in Paris"
                        description="Round trip from Dubai starting at $450"
                        discount="20% OFF"
                        expiry="Expires in 2 days"
                        image="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop"
                    />
                    <DealCard
                        title="Tokyo Adventure"
                        description="Direct flights + 3 nights hotel"
                        discount="Save $200"
                        expiry="Limited time offer"
                        image="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1974&auto=format&fit=crop"
                    />
                    <DealCard
                        title="New York Getaway"
                        description="Business class upgrade available"
                        discount="Special Rate"
                        expiry="Valid until June 30"
                        image="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2070&auto=format&fit=crop"
                    />
                </div>
            </div>
        </PublicLayout>
    );
}

function DealCard({ title, description, discount, expiry, image }: { title: string, description: string, discount: string, expiry: string, image: string }) {
    return (
        <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
            <div className="relative h-48 overflow-hidden">
                <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {discount}
                </div>
            </div>
            <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-muted-foreground mb-4">{description}</p>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-orange-500 font-medium">
                        <Clock className="w-4 h-4" />
                        {expiry}
                    </div>
                    <Button variant="ghost" className="gap-1 hover:gap-2 transition-all p-0 h-auto font-bold text-primary">
                        View Deal <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
