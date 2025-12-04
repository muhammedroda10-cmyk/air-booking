'use client';

import { useState, useEffect } from 'react';
import { PublicLayout } from "@/components/layouts/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    image: string;
    category: string;
    author: string;
    date: string;
    read_time: string;
}

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const url = selectedCategory ? `/blog?category=${selectedCategory}` : '/blog';
                const response = await api.get(url);
                setPosts(response.data);
            } catch (error) {
                console.error('Failed to fetch blog posts', error);
                // Fallback data
                setPosts([
                    {
                        id: 1,
                        title: 'Top 10 Destinations for Summer 2024',
                        slug: 'top-10-destinations',
                        excerpt: 'Discover the hottest spots to visit this summer.',
                        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
                        category: 'Travel Tips',
                        author: 'Sarah Johnson',
                        date: '2024-05-15',
                        read_time: '5 min read',
                    },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [selectedCategory]);

    const categories = ['Travel Tips', 'Tips & Tricks', 'Budget Travel', 'Airlines'];

    return (
        <PublicLayout>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">SkyWings Blog</h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Travel tips, destination guides, and insider advice for your next adventure
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <Badge
                        variant={selectedCategory === null ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(null)}
                    >
                        All Posts
                    </Badge>
                    {categories.map((cat) => (
                        <Badge
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </Badge>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <BlogCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

function BlogCard({ post }: { post: BlogPost }) {
    return (
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="h-48 overflow-hidden relative">
                <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <Badge className="absolute top-3 left-3">{post.category}</Badge>
            </div>
            <CardContent className="p-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.read_time}
                    </span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        {post.author}
                    </span>
                    <Link
                        href={`/blog/${post.slug}`}
                        className="text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
                    >
                        Read More <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
