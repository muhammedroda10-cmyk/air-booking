'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Star, Search, Loader2, Check, X, MessageSquare, User, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface Review {
    id: number;
    user: { id: number; name: string; email: string };
    rating: number;
    title: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_response?: string;
    created_at: string;
}

export default function ReviewsPage() {
    const { toast } = useToast();
    const { hasPermission } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [respondingReview, setRespondingReview] = useState<Review | null>(null);
    const [response, setResponse] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchReviews(); }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/reviews');
            setReviews(data.data || data.reviews || data || []);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load reviews', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try { await api.post(`/admin/reviews/${id}/approve`); toast({ title: 'Review approved' }); fetchReviews(); }
        catch { toast({ title: 'Error', description: 'Failed to approve', variant: 'destructive' }); }
    };
    const handleReject = async (id: number) => {
        try { await api.post(`/admin/reviews/${id}/reject`); toast({ title: 'Review rejected' }); fetchReviews(); }
        catch { toast({ title: 'Error', description: 'Failed to reject', variant: 'destructive' }); }
    };
    const handleDelete = async (review: Review) => {
        if (!confirm('Delete this review?')) return;
        try { await api.delete(`/admin/reviews/${review.id}`); toast({ title: 'Review deleted' }); fetchReviews(); }
        catch { toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }); }
    };
    const handleSendResponse = async () => {
        if (!respondingReview) return;
        try { setSaving(true); await api.post(`/admin/reviews/${respondingReview.id}/respond`, { response }); toast({ title: 'Response sent' }); setRespondingReview(null); fetchReviews(); }
        catch { toast({ title: 'Error', description: 'Failed to send', variant: 'destructive' }); }
        finally { setSaving(false); }
    };

    const getStatusBadge = (s: string) => {
        const c: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };
        return <Badge className={c[s] || 'bg-gray-100'}>{s}</Badge>;
    };
    const renderStars = (r: number) => <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= r ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />)}</div>;
    const formatDate = (dt: string) => new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const filteredReviews = reviews.filter((r) => {
        const match = r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.content?.toLowerCase().includes(searchQuery.toLowerCase()) || r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return match && (statusFilter === 'all' || r.status === statusFilter);
    });

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold">Reviews</h1><p className="text-muted-foreground">Moderate customer reviews</p></div>
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
            </div>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5" />All Reviews ({filteredReviews.length})</CardTitle></CardHeader>
                <CardContent>
                    {filteredReviews.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Star className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No reviews found</p></div> : (
                        <Table>
                            <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Rating</TableHead><TableHead>Review</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {filteredReviews.map((review) => (
                                    <TableRow key={review.id}>
                                        <TableCell><div className="flex items-center gap-2"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-blue-600" /></div><div><div className="font-medium">{review.user?.name}</div><div className="text-sm text-muted-foreground">{review.user?.email}</div></div></div></TableCell>
                                        <TableCell>{renderStars(review.rating)}</TableCell>
                                        <TableCell className="max-w-md"><div className="font-medium">{review.title}</div><div className="text-sm text-muted-foreground line-clamp-2">{review.content}</div>{review.admin_response && <div className="mt-2 p-2 bg-blue-50 rounded text-sm"><span className="font-medium">Response:</span> {review.admin_response}</div>}</TableCell>
                                        <TableCell>{formatDate(review.created_at)}</TableCell>
                                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {review.status === 'pending' && hasPermission('reviews.moderate') && <>
                                                    <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleApprove(review.id)}><Check className="w-4 h-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleReject(review.id)}><X className="w-4 h-4" /></Button>
                                                </>}
                                                <Button variant="ghost" size="icon" onClick={() => { setRespondingReview(review); setResponse(review.admin_response || ''); }}><MessageSquare className="w-4 h-4" /></Button>
                                                {hasPermission('reviews.delete') && <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(review)}><Trash2 className="w-4 h-4" /></Button>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <Dialog open={!!respondingReview} onOpenChange={(o) => !o && setRespondingReview(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Respond to Review</DialogTitle></DialogHeader>
                    <div className="py-4">
                        {respondingReview && <div className="mb-4 p-3 bg-muted rounded"><div className="flex items-center gap-2 mb-2">{renderStars(respondingReview.rating)}<span className="font-medium">{respondingReview.user?.name}</span></div><div className="font-medium">{respondingReview.title}</div><div className="text-sm text-muted-foreground">{respondingReview.content}</div></div>}
                        <div className="space-y-2"><Label>Your Response</Label><Textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={4} /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setRespondingReview(null)}>Cancel</Button><Button onClick={handleSendResponse} disabled={saving || !response.trim()}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Send</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
