'use client';

import { PublicLayout } from "@/components/layouts/public-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function BlogPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold mb-8">SkyWings Blog</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <BlogCard
                        title="Top 10 Destinations for Summer 2024"
                        excerpt="Discover the hottest spots to visit this summer, from pristine beaches to vibrant cities."
                        date="May 15, 2024"
                        image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"
                    />
                    <BlogCard
                        title="Travel Tips for Long-Haul Flights"
                        excerpt="Stay comfortable and refreshed on your next long journey with these expert tips."
                        date="April 28, 2024"
                        image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop"
                    />
                    <BlogCard
                        title="Experience Luxury in the Sky"
                        excerpt="A look inside our new First Class suites and premium amenities."
                        date="April 10, 2024"
                        image="https://images.unsplash.com/photo-1540339832862-43d696ab1544?q=80&w=2070&auto=format&fit=crop"
                    />
                </div>
            </div>
        </PublicLayout>
    );
}

function BlogCard({ title, excerpt, date, image }: { title: string, excerpt: string, date: string, image: string }) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div className="h-48 overflow-hidden">
                <img src={image} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">{date}</p>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{excerpt}</p>
            </CardContent>
        </Card>
    )
}
