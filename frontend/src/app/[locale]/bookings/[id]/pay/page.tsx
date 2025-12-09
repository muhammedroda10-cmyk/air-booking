'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, Wallet, Plane, AlertCircle, CheckCircle2, Lock, Download, Star } from "lucide-react";
import { PublicLayout } from "@/components/layouts/public-layout";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function PaymentPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { toast } = useToast();

    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
    const [processing, setProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Card form state (simulated)
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardError, setCardError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    // Loyalty points state
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);
    const [pointsValueUsd, setPointsValueUsd] = useState(0);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchData();
        }
    }, [id, user, authLoading]);

    const fetchData = async () => {
        try {
            const [bookingRes, walletRes, loyaltyRes] = await Promise.all([
                api.get(`/bookings/${id}`),
                api.get('/wallet'),
                api.get('/loyalty').catch(() => ({ data: { points: 0 } }))
            ]);
            setBooking(bookingRes.data.data || bookingRes.data);
            setWalletBalance(walletRes.data.balance || 0);
            setLoyaltyPoints(loyaltyRes.data.points || loyaltyRes.data.balance || 0);
        } catch (error) {
            console.error('Failed to load data', error);
            toast({
                title: "Error",
                description: "Failed to load booking details",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const validateCard = () => {
        const numberClean = cardNumber.replace(/\s/g, '');
        if (numberClean.length < 13 || numberClean.length > 19) {
            setCardError('Please enter a valid card number');
            return false;
        }
        if (cardExpiry.length !== 5) {
            setCardError('Please enter a valid expiry date (MM/YY)');
            return false;
        }
        if (cardCvc.length < 3 || cardCvc.length > 4) {
            setCardError('Please enter a valid CVC');
            return false;
        }
        if (cardName.trim().length < 2) {
            setCardError('Please enter the cardholder name');
            return false;
        }
        setCardError(null);
        return true;
    };

    // Loyalty points: 100 points = $1 USD
    const POINTS_PER_DOLLAR = 100;
    const maxPointsValue = Math.min(loyaltyPoints / POINTS_PER_DOLLAR, Number(booking?.total_price || 0));
    const discountedPrice = Math.max(0, Number(booking?.total_price || 0) - pointsValueUsd);

    const handlePointsChange = (value: number) => {
        const maxPoints = Math.min(loyaltyPoints, Number(booking?.total_price || 0) * POINTS_PER_DOLLAR);
        const points = Math.min(Math.max(0, value), maxPoints);
        setPointsToRedeem(points);
        setPointsValueUsd(points / POINTS_PER_DOLLAR);
    };

    const handleCardPayment = async () => {
        if (!validateCard()) return;

        setProcessing(true);
        try {
            // Simulated card payment - just send to backend payments endpoint
            await api.post('/payments', {
                booking_id: booking.id,
                payment_method: 'credit_card',
                points_to_redeem: pointsToRedeem,
                card_details: {
                    last_four: cardNumber.replace(/\s/g, '').slice(-4),
                    brand: cardNumber.startsWith('4') ? 'visa' :
                        cardNumber.startsWith('5') ? 'mastercard' : 'card'
                }
            });
            handleSuccess();
        } catch (error: any) {
            toast({
                title: "Payment Failed",
                description: error.response?.data?.message || "An error occurred processing your payment",
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleWalletPayment = async () => {
        setProcessing(true);
        try {
            await api.post('/payments', {
                booking_id: booking.id,
                payment_method: 'wallet',
                points_to_redeem: pointsToRedeem
            });
            handleSuccess();
        } catch (error: any) {
            toast({
                title: "Payment Failed",
                description: error.response?.data?.message || "Insufficient balance or error occurred",
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleSuccess = () => {
        toast({
            title: "Success",
            description: "Payment successful! Redirecting to confirmation...",
        });
        // Redirect to confirmation page
        router.push(`/bookings/${id}/confirmation`);
    };

    if (loading || authLoading) {
        return (
            <PublicLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
            </PublicLayout>
        );
    }

    if (!booking) return null;

    if (completed) {
        return (
            <PublicLayout>
                <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50 dark:from-slate-950 dark:via-green-950/20 dark:to-emerald-950/30 relative overflow-hidden">
                    {/* Animated confetti-like particles */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-3 h-3 rounded-full"
                                style={{
                                    background: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
                                    left: `${Math.random() * 100}%`,
                                    top: '-5%',
                                }}
                                animate={{
                                    y: ['0vh', '110vh'],
                                    x: [0, Math.random() * 100 - 50],
                                    rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                                    opacity: [1, 0.8, 0],
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    delay: Math.random() * 1.5,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="w-full max-w-lg border-none shadow-2xl text-center overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                            {/* Success Header */}
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                                    className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30"
                                >
                                    <CheckCircle2 className="w-14 h-14 text-white" />
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-3xl font-bold mb-2"
                                >
                                    Payment Successful!
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-green-100"
                                >
                                    Your booking has been confirmed
                                </motion.p>
                            </div>

                            {/* Booking Details */}
                            <CardContent className="p-6 space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm text-slate-500">Booking Reference</span>
                                        <span className="font-mono font-bold text-lg text-primary">{booking.pnr}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm text-slate-500">Amount Paid</span>
                                        <span className="font-bold text-lg">${Number(booking.total_price).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">Flight</span>
                                        <span className="font-semibold">{booking.flight?.flight_number || 'External Flight'}</span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                                            <Plane className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-slate-500">Route</p>
                                            <p className="font-semibold">
                                                {booking.flight?.origin_airport?.code || booking.flight?.originAirport?.code || '---'} → {booking.flight?.destination_airport?.code || booking.flight?.destinationAirport?.code || '---'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300">
                                        Confirmed
                                    </Badge>
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="text-sm text-slate-500 text-center"
                                >
                                    A confirmation email has been sent to your registered email address.
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.9 }}
                                    className="space-y-3 pt-4"
                                >
                                    {/* Download Ticket Button - Full Width */}
                                    <Button
                                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 gap-2"
                                        onClick={async () => {
                                            setDownloading(true);
                                            try {
                                                const response = await api.get(`/bookings/${booking.id}/download`, {
                                                    responseType: 'blob'
                                                });

                                                // Get content type and determine file extension
                                                const contentType = response.headers['content-type'] || 'application/pdf';
                                                const extension = contentType.includes('html') ? 'html' : 'pdf';

                                                const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `ticket-${booking.pnr}.${extension}`);
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                                window.URL.revokeObjectURL(url);

                                                if (extension === 'html') {
                                                    toast({
                                                        title: "Ticket Downloaded",
                                                        description: "Open the HTML file in your browser and print to save as PDF.",
                                                    });
                                                }
                                            } catch (error) {
                                                console.error('Failed to download ticket', error);
                                                toast({
                                                    title: "Download Failed",
                                                    description: "Could not download ticket. Please try from your dashboard.",
                                                    variant: "destructive"
                                                });
                                            } finally {
                                                setDownloading(false);
                                            }
                                        }}
                                        disabled={downloading}
                                    >
                                        {downloading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Preparing...</>
                                        ) : (
                                            <><Download className="w-4 h-4" /> Download E-Ticket</>
                                        )}
                                    </Button>

                                    {/* Other buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => router.push(`/account/tickets/${booking.id}`)}
                                        >
                                            View Ticket
                                        </Button>
                                        <Button
                                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                            onClick={() => router.push('/account/trips')}
                                        >
                                            My Trips
                                        </Button>
                                    </div>
                                </motion.div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Booking Summary */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-none shadow-lg sticky top-24">
                            <CardHeader className="bg-slate-900 text-white rounded-t-xl">
                                <CardTitle className="flex items-center gap-2"><Plane className="w-5 h-5" /> Trip Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500">Flight</p>
                                    <div className="font-semibold">{booking.flight?.airline?.name || 'External Flight'}</div>
                                    <div className="text-xs text-slate-400">{booking.flight?.flight_number || booking.pnr}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-lg">{booking.flight?.origin_airport?.code || booking.flight?.originAirport?.code || '---'}</div>
                                        <div className="text-xs text-slate-500">{booking.flight?.origin_airport?.city || booking.flight?.originAirport?.city || ''}</div>
                                    </div>
                                    <div className="h-0.5 w-8 bg-slate-300"></div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg">{booking.flight?.destination_airport?.code || booking.flight?.destinationAirport?.code || '---'}</div>
                                        <div className="text-xs text-slate-500">{booking.flight?.destination_airport?.city || booking.flight?.destinationAirport?.city || ''}</div>
                                    </div>
                                </div>
                                <div className="border-t pt-4 space-y-3">
                                    {/* Loyalty Points Redemption */}
                                    {loyaltyPoints > 0 && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Star className="w-4 h-4 text-amber-500" />
                                                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                                                    {loyaltyPoints.toLocaleString()} points available
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={loyaltyPoints}
                                                    step={100}
                                                    value={pointsToRedeem || ''}
                                                    onChange={(e) => handlePointsChange(Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-24 h-8 text-sm"
                                                />
                                                <span className="text-xs text-slate-500">= ${pointsValueUsd.toFixed(2)} off</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">100 points = $1</p>
                                        </div>
                                    )}

                                    {/* Price Summary */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>Subtotal</span>
                                            <span>${Number(booking.total_price).toFixed(2)}</span>
                                        </div>
                                        {pointsValueUsd > 0 && (
                                            <div className="flex justify-between text-sm text-green-600">
                                                <span>Points Discount</span>
                                                <span>-${pointsValueUsd.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                            <span>Total</span>
                                            <span>${discountedPrice.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment Method */}
                    <div className="md:col-span-2">
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle>Payment Method</CardTitle>
                                <CardDescription>Select how you would like to pay</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-1 gap-4 mb-8">
                                    <div className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`} onClick={() => setPaymentMethod('card')}>
                                        <div className="flex items-center gap-3">
                                            <RadioGroupItem value="card" id="card" className="h-5 w-5" />
                                            <Label htmlFor="card" className="cursor-pointer font-semibold flex items-center gap-2">
                                                <CreditCard className="w-5 h-5 text-slate-600" /> Credit / Debit Card
                                            </Label>
                                        </div>
                                        <div className="flex gap-1 text-xs">
                                            <Badge variant="secondary">Visa</Badge>
                                            <Badge variant="secondary">MC</Badge>
                                        </div>
                                    </div>

                                    <div className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`} onClick={() => setPaymentMethod('wallet')}>
                                        <div className="flex items-center gap-3">
                                            <RadioGroupItem value="wallet" id="wallet" className="h-5 w-5" />
                                            <Label htmlFor="wallet" className="cursor-pointer font-semibold flex items-center gap-2">
                                                <Wallet className="w-5 h-5 text-slate-600" /> Wallet Balance
                                            </Label>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-green-600">${Number(walletBalance).toFixed(2)}</span>
                                            <p className="text-xs text-slate-400">Available</p>
                                        </div>
                                    </div>
                                </RadioGroup>

                                {paymentMethod === 'wallet' && (
                                    <div className="space-y-4">
                                        {Number(walletBalance) < Number(booking.total_price) ? (
                                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-xl flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-bold">Insufficient Balance</h4>
                                                    <p className="text-sm mt-1">
                                                        You need ${(Number(booking.total_price) - Number(walletBalance)).toFixed(2)} more to pay with wallet.
                                                        Please deposit funds or use a card.
                                                    </p>
                                                    <Button variant="outline" className="mt-3 bg-white" onClick={() => router.push('/account/wallet')}>
                                                        Go to Wallet
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl text-center">
                                                <p className="mb-4 text-slate-600">You are about to pay <strong>${Number(booking.total_price).toFixed(2)}</strong> from your wallet.</p>
                                                <Button size="lg" className="w-full" onClick={handleWalletPayment} disabled={processing}>
                                                    {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Confirm & Pay'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {paymentMethod === 'card' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <Label htmlFor="cardNumber">Card Number</Label>
                                                <Input
                                                    id="cardNumber"
                                                    placeholder="1234 5678 9012 3456"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                    maxLength={19}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="cardName">Cardholder Name</Label>
                                                <Input
                                                    id="cardName"
                                                    placeholder="John Doe"
                                                    value={cardName}
                                                    onChange={(e) => setCardName(e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="cardExpiry">Expiry Date</Label>
                                                    <Input
                                                        id="cardExpiry"
                                                        placeholder="MM/YY"
                                                        value={cardExpiry}
                                                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                                        maxLength={5}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="cardCvc">CVC</Label>
                                                    <Input
                                                        id="cardCvc"
                                                        placeholder="123"
                                                        value={cardCvc}
                                                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                        maxLength={4}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {cardError && (
                                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                {cardError}
                                            </div>
                                        )}

                                        <Button
                                            size="lg"
                                            className="w-full"
                                            onClick={handleCardPayment}
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                            ) : (
                                                `Pay $${Number(booking.total_price).toFixed(2)}`
                                            )}
                                        </Button>

                                        <div className="flex justify-center items-center gap-2 text-xs text-slate-400">
                                            <Lock className="w-3 h-3" />
                                            <span>Secure payment processing</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
