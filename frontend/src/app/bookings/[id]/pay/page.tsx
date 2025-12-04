'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { PublicLayout } from "@/components/layouts/public-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Wallet, ShieldCheck, Lock, Plane } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [walletBalance, setWalletBalance] = useState<number | null>(null);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push('/login');
            return;
        }
        fetchBooking();
        fetchWalletBalance();
    }, [id, user, isAuthLoading]);

    const fetchBooking = async () => {
        try {
            const response = await api.get(`/bookings/${id}`);
            setBooking(response.data);
        } catch (error) {
            console.error('Failed to fetch booking', error);
            setError('Failed to load booking details');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWalletBalance = async () => {
        try {
            const response = await api.get('/wallet');
            setWalletBalance(response.data.balance);
        } catch (error) {
            console.error('Failed to fetch wallet balance', error);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError('');

        try {
            await api.post(
                '/payments',
                {
                    booking_id: id,
                    payment_method: paymentMethod,
                }
            );
            router.push(`/bookings/${id}/confirmation`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Payment failed');
            setIsProcessing(false);
        }
    };

    if (isLoading || isAuthLoading) return (
        <PublicLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
            </div>
        </PublicLayout>
    );

    if (!booking) return (
        <PublicLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Booking Not Found</h2>
                    <Button onClick={() => router.push('/')} className="mt-4">Back to Home</Button>
                </div>
            </div>
        </PublicLayout>
    );

    return (
        <PublicLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Secure Payment</h1>
                        <p className="text-slate-600 dark:text-slate-400">Complete your booking securely using your preferred payment method.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border-none shadow-lg rounded-[1.5rem] overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-primary" />
                                        Payment Details
                                    </CardTitle>
                                    <CardDescription>All transactions are secure and encrypted.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handlePayment} className="space-y-8">
                                        <div className="space-y-4">
                                            <Label className="text-base font-semibold">Select Payment Method</Label>
                                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <RadioGroupItem value="credit_card" id="credit_card" className="peer sr-only" />
                                                    <Label
                                                        htmlFor="credit_card"
                                                        className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                                                    >
                                                        <CreditCard className="mb-3 h-6 w-6 text-slate-600 dark:text-slate-400" />
                                                        <span className="font-semibold text-slate-900 dark:text-white">Credit Card</span>
                                                    </Label>
                                                </div>
                                                <div>
                                                    <RadioGroupItem value="wallet" id="wallet" className="peer sr-only" />
                                                    <Label
                                                        htmlFor="wallet"
                                                        className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                                                    >
                                                        <Wallet className="mb-3 h-6 w-6 text-slate-600 dark:text-slate-400" />
                                                        <span className="font-semibold text-slate-900 dark:text-white">My Wallet</span>
                                                        {walletBalance !== null && (
                                                            <span className="mt-1 text-xs text-slate-500">Balance: ${walletBalance}</span>
                                                        )}
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {paymentMethod === 'credit_card' && (
                                                <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <div className="space-y-2">
                                                        <Label>Card Number</Label>
                                                        <Input placeholder="0000 0000 0000 0000" className="bg-white dark:bg-slate-800" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Expiry Date</Label>
                                                            <Input placeholder="MM/YY" className="bg-white dark:bg-slate-800" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>CVC</Label>
                                                            <Input placeholder="123" className="bg-white dark:bg-slate-800" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {paymentMethod === 'wallet' && walletBalance !== null && booking && walletBalance < booking.total_price && (
                                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/30 text-sm">
                                                    Insufficient wallet balance. Please deposit funds or use a credit card.
                                                </div>
                                            )}
                                        </motion.div>

                                        <Button
                                            type="submit"
                                            disabled={isProcessing || (paymentMethod === 'wallet' && walletBalance !== null && booking && walletBalance < booking.total_price)}
                                            className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 rounded-xl"
                                        >
                                            {isProcessing ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                `Pay $${booking?.total_price}`
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                                <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-6 flex justify-center">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        <span>Payments are processed securely by Stripe</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>

                        <div className="md:col-span-1">
                            <Card className="border-none shadow-lg rounded-[1.5rem] overflow-hidden bg-slate-900 text-white sticky top-24">
                                <CardHeader className="border-b border-white/10 pb-6">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Plane className="w-5 h-5 text-indigo-400" />
                                        Order Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Base Fare</span>
                                            <span className="font-medium">${booking.total_price}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Taxes & Fees</span>
                                            <span className="font-medium">$0.00</span>
                                        </div>
                                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                            <span className="font-bold text-lg">Total</span>
                                            <span className="font-bold text-2xl text-indigo-400">${booking.total_price}</span>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
                                        By proceeding with payment, you agree to our Terms and Conditions and Privacy Policy.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

