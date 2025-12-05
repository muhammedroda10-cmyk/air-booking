'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface PromoCodeInputProps {
    amount: number;
    type: 'flight' | 'hotel';
    onApply: (code: string, discount: number) => void;
    onRemove: () => void;
    appliedCode?: string;
    appliedDiscount?: number;
}

export function PromoCodeInput({ amount, type, onApply, onRemove, appliedCode, appliedDiscount }: PromoCodeInputProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleApply = async () => {
        if (!code.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/promo-codes/validate', {
                code: code.toUpperCase(),
                amount,
                type,
            });

            if (response.data.valid) {
                onApply(response.data.promo_code.code, response.data.discount_amount);
                setCode('');
            } else {
                setError(response.data.message);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid promo code');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        onRemove();
        setCode('');
        setError('');
    };

    if (appliedCode) {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <div>
                            <span className="font-mono font-bold text-green-700 dark:text-green-400">{appliedCode}</span>
                            <span className="text-green-600 dark:text-green-400 ml-2">applied</span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 -mr-2"
                        onClick={handleRemove}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    You save ${appliedDiscount?.toFixed(2)}!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value.toUpperCase());
                            setError('');
                        }}
                        placeholder="Enter promo code"
                        className="pl-10 uppercase"
                        disabled={loading}
                    />
                </div>
                <Button
                    onClick={handleApply}
                    disabled={!code.trim() || loading}
                    variant="outline"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        'Apply'
                    )}
                </Button>
            </div>
            {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {error}
                </p>
            )}
        </div>
    );
}
