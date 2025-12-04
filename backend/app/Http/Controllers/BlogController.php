<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BlogController extends Controller
{
    /**
     * Get all published blog posts
     */
    public function index(Request $request)
    {
        // For now, return static blog data
        // In production, this would come from a database
        $posts = [
            [
                'id' => 1,
                'title' => 'Top 10 Travel Destinations for 2025',
                'slug' => 'top-10-travel-destinations-2025',
                'excerpt' => 'Discover the most exciting destinations to visit this year, from hidden gems to popular hotspots.',
                'content' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
                'image' => 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
                'category' => 'Travel Tips',
                'author' => 'Sarah Johnson',
                'date' => '2025-01-15',
                'read_time' => '5 min read',
            ],
            [
                'id' => 2,
                'title' => 'How to Find the Best Flight Deals',
                'slug' => 'how-to-find-best-flight-deals',
                'excerpt' => 'Expert tips and tricks for scoring the cheapest flights for your next adventure.',
                'content' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
                'image' => 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
                'category' => 'Tips & Tricks',
                'author' => 'Mike Chen',
                'date' => '2025-01-10',
                'read_time' => '4 min read',
            ],
            [
                'id' => 3,
                'title' => 'Essential Packing Guide for Long Trips',
                'slug' => 'essential-packing-guide-long-trips',
                'excerpt' => 'Never overpack again with our comprehensive packing checklist for extended travel.',
                'content' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
                'image' => 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800',
                'category' => 'Travel Tips',
                'author' => 'Emma Wilson',
                'date' => '2025-01-05',
                'read_time' => '6 min read',
            ],
            [
                'id' => 4,
                'title' => 'Budget Travel: Europe on $50 a Day',
                'slug' => 'budget-travel-europe-50-day',
                'excerpt' => 'Yes, it\'s possible! Learn how to explore Europe without breaking the bank.',
                'content' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
                'image' => 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
                'category' => 'Budget Travel',
                'author' => 'Alex Rivera',
                'date' => '2024-12-28',
                'read_time' => '7 min read',
            ],
            [
                'id' => 5,
                'title' => 'The Ultimate Airport Survival Guide',
                'slug' => 'ultimate-airport-survival-guide',
                'excerpt' => 'Make your airport experience smooth and stress-free with these insider tips.',
                'content' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
                'image' => 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800',
                'category' => 'Tips & Tricks',
                'author' => 'Sarah Johnson',
                'date' => '2024-12-20',
                'read_time' => '5 min read',
            ],
            [
                'id' => 6,
                'title' => 'Best Airlines for Long-Haul Flights',
                'slug' => 'best-airlines-long-haul-flights',
                'excerpt' => 'Our ranking of the top airlines for comfort, service, and value on long journeys.',
                'content' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
                'image' => 'https://images.unsplash.com/photo-1540339832862-474599807836?w=800',
                'category' => 'Airlines',
                'author' => 'Mike Chen',
                'date' => '2024-12-15',
                'read_time' => '8 min read',
            ],
        ];

        // Apply category filter if provided
        if ($request->has('category')) {
            $posts = array_filter($posts, fn($post) => $post['category'] === $request->category);
        }

        return response()->json(array_values($posts));
    }

    /**
     * Get a single blog post by slug
     */
    public function show($slug)
    {
        $posts = $this->index(request())->original;

        $post = collect($posts)->firstWhere('slug', $slug);

        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        return response()->json($post);
    }
}
