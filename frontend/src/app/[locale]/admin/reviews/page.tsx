'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Check, X, MessageSquare, Search, Filter } from 'lucide-react';
import api from '@/lib/api';

interface Review {
    id: number;
    user: { id: number; name: string; email: string };
    booking: {
        id: number;
        pnr: string;
        flight?: {
            flight_number: string;
            airline: { name: string };
        };
    };
    reviewable_type: string;
    reviewable_id: number;
    rating: number;
    title: string;
    comment: string;
    pros: string[] | null;
    cons: string[] | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_response: string | null;
    created_at: string;
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [respondingTo, setRespondingTo] = useState<number | null>(null);
    const [responseText, setResponseText] = useState('');

    useEffect(() => {
        fetchReviews();
    }, [filter]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const url = filter === 'all' ? '/admin/reviews' : `/admin/reviews?status=${filter}`;
            const response = await api.get(url);
            setReviews(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await api.post(`/admin/reviews/${id}/approve`);
            fetchReviews();
        } catch (error) {
            alert('Error approving review');
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('Are you sure you want to reject this review?')) return;
        try {
            await api.post(`/admin/reviews/${id}/reject`);
            fetchReviews();
        } catch (error) {
            alert('Error rejecting review');
        }
    };

    const handleRespond = async (id: number) => {
        if (!responseText.trim()) return;
        try {
            await api.post(`/admin/reviews/${id}/respond`, { response: responseText });
            setRespondingTo(null);
            setResponseText('');
            fetchReviews();
        } catch (error) {
            alert('Error adding response');
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Pending</span>;
            case 'approved':
                return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Rejected</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Reviews</h1>
                    <p className="text-muted-foreground">Moderate user reviews and feedback</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
                    <Button
                        key={status}
                        variant={filter === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                ))}
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {loading ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Loading reviews...
                        </CardContent>
                    </Card>
                ) : reviews.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No {filter === 'all' ? '' : filter} reviews found
                        </CardContent>
                    </Card>
                ) : (
                    reviews.map((review) => (
                        <Card key={review.id}>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            {renderStars(review.rating)}
                                            {getStatusBadge(review.status)}
                                        </div>
                                        <h3 className="font-semibold">{review.title || 'No Title'}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            By {review.user?.name || 'Anonymous'} • {new Date(review.created_at).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Booking: {review.booking?.pnr} •
                                            {review.booking?.flight?.airline?.name} {review.booking?.flight?.flight_number}
                                        </p>
                                    </div>
                                    {review.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(review.id)}>
                                                <Check className="w-4 h-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleReject(review.id)}>
                                                <X className="w-4 h-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {review.comment && (
                                    <p className="text-sm mb-4">{review.comment}</p>
                                )}

                                {(review.pros?.length || review.cons?.length) && (
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        {review.pros && review.pros.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-green-600 mb-2">Pros</h4>
                                                <ul className="text-sm space-y-1">
                                                    {review.pros.map((pro, i) => (
                                                        <li key={i} className="flex items-center gap-2">
                                                            <Check className="w-3 h-3 text-green-500" />
                                                            {pro}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {review.cons && review.cons.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-red-600 mb-2">Cons</h4>
                                                <ul className="text-sm space-y-1">
                                                    {review.cons.map((con, i) => (
                                                        <li key={i} className="flex items-center gap-2">
                                                            <X className="w-3 h-3 text-red-500" />
                                                            {con}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Admin Response */}
                                {review.admin_response && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-4">
                                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Admin Response:</p>
                                        <p className="text-sm">{review.admin_response}</p>
                                    </div>
                                )}

                                {/* Response Form */}
                                {respondingTo === review.id ? (
                                    <div className="mt-4 space-y-2">
                                        <Input
                                            value={responseText}
                                            onChange={(e) => setResponseText(e.target.value)}
                                            placeholder="Write your response..."
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleRespond(review.id)}>
                                                Send Response
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setRespondingTo(null)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    review.status === 'approved' && !review.admin_response && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="mt-4"
                                            onClick={() => setRespondingTo(review.id)}
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Add Response
                                        </Button>
                                    )
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
