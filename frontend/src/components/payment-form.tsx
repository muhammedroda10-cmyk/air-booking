"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Lock, Wallet, AlertCircle, CheckCircle2 } from "lucide-react"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

export type PaymentMethod = 'wallet' | 'credit_card'

interface CardDetails {
    cardNumber: string
    expiryDate: string
    cvc: string
    cardholderName: string
}

interface PaymentFormProps {
    totalAmount: number
    onSubmit: (method: PaymentMethod, cardDetails?: CardDetails) => void
    isProcessing?: boolean
    error?: string | null
}

export interface PaymentFormRef {
    submit: () => void
}

export const PaymentForm = React.forwardRef<PaymentFormRef, PaymentFormProps>(
    ({ totalAmount, onSubmit, isProcessing, error }, ref) => {
        const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('wallet')
        const [walletBalance, setWalletBalance] = React.useState<number | null>(null)
        const [loadingWallet, setLoadingWallet] = React.useState(true)

        // Card details state
        const [cardNumber, setCardNumber] = React.useState('')
        const [expiryDate, setExpiryDate] = React.useState('')
        const [cvc, setCvc] = React.useState('')
        const [cardholderName, setCardholderName] = React.useState('')
        const [validationError, setValidationError] = React.useState<string | null>(null)

        // Fetch wallet balance
        React.useEffect(() => {
            const fetchWalletBalance = async () => {
                try {
                    const response = await api.get('/wallet')
                    const balance = response.data.balance
                    setWalletBalance(typeof balance === 'number' ? balance : parseFloat(balance || '0'))
                } catch (error) {
                    console.error('Failed to fetch wallet balance', error)
                    setWalletBalance(0)
                } finally {
                    setLoadingWallet(false)
                }
            }
            fetchWalletBalance()
        }, [])

        const hasInsufficientFunds = walletBalance !== null && walletBalance < totalAmount

        const formatCardNumber = (value: string) => {
            const cleaned = value.replace(/\D/g, '')
            const groups = cleaned.match(/.{1,4}/g)
            return groups ? groups.join(' ').substr(0, 19) : ''
        }

        const formatExpiryDate = (value: string) => {
            const cleaned = value.replace(/\D/g, '')
            if (cleaned.length >= 2) {
                return cleaned.substr(0, 2) + '/' + cleaned.substr(2, 2)
            }
            return cleaned
        }

        const validateForm = (): boolean => {
            setValidationError(null)

            if (paymentMethod === 'wallet') {
                if (hasInsufficientFunds) {
                    setValidationError('Insufficient wallet balance. Please add funds or use a credit card.')
                    return false
                }
                return true
            }

            // Validate credit card
            const cleanCardNumber = cardNumber.replace(/\s/g, '')
            if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
                setValidationError('Please enter a valid card number')
                return false
            }

            const [month, year] = expiryDate.split('/')
            if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
                setValidationError('Please enter a valid expiry date (MM/YY)')
                return false
            }

            if (cvc.length < 3 || cvc.length > 4) {
                setValidationError('Please enter a valid CVC')
                return false
            }

            if (!cardholderName.trim()) {
                setValidationError('Please enter the cardholder name')
                return false
            }

            return true
        }

        const handleSubmit = () => {
            if (!validateForm()) return

            if (paymentMethod === 'wallet') {
                onSubmit('wallet')
            } else {
                onSubmit('credit_card', {
                    cardNumber: cardNumber.replace(/\s/g, ''),
                    expiryDate,
                    cvc,
                    cardholderName
                })
            }
        }

        // Expose submit method to parent
        React.useImperativeHandle(ref, () => ({
            submit: handleSubmit
        }))

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>Choose how you'd like to pay for your booking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Error Display */}
                    {(error || validationError) && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <span className="text-sm text-red-600 dark:text-red-400">{error || validationError}</span>
                        </div>
                    )}

                    {/* Payment Method Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('wallet')}
                            className={cn(
                                "p-4 rounded-lg border-2 transition-all text-left",
                                paymentMethod === 'wallet'
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            )}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    paymentMethod === 'wallet' ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800"
                                )}>
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium">Wallet</div>
                                    <div className="text-xs text-muted-foreground">
                                        {loadingWallet ? 'Loading...' : `Balance: $${walletBalance?.toFixed(2)}`}
                                    </div>
                                </div>
                            </div>
                            {!loadingWallet && hasInsufficientFunds && (
                                <div className="text-xs text-red-500 mt-2">Insufficient balance</div>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setPaymentMethod('credit_card')}
                            className={cn(
                                "p-4 rounded-lg border-2 transition-all text-left",
                                paymentMethod === 'credit_card'
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    paymentMethod === 'credit_card' ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800"
                                )}>
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium">Credit Card</div>
                                    <div className="text-xs text-muted-foreground">Visa, Mastercard, Amex</div>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Wallet Payment Info */}
                    {paymentMethod === 'wallet' && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-muted-foreground">Payment Amount</span>
                                <span className="font-bold text-lg">${totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-muted-foreground">Wallet Balance</span>
                                <span className={cn(
                                    "font-medium",
                                    hasInsufficientFunds ? "text-red-500" : "text-green-500"
                                )}>
                                    ${walletBalance?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                            {!hasInsufficientFunds && walletBalance !== null && (
                                <div className="flex items-center justify-between pt-3 border-t">
                                    <span className="text-sm text-muted-foreground">Remaining Balance</span>
                                    <span className="font-medium">${(walletBalance - totalAmount).toFixed(2)}</span>
                                </div>
                            )}
                            {hasInsufficientFunds && (
                                <div className="mt-3 pt-3 border-t">
                                    <Button variant="outline" className="w-full" onClick={() => window.open('/dashboard/wallet', '_blank')}>
                                        Add Funds to Wallet
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Credit Card Form */}
                    {paymentMethod === 'credit_card' && (
                        <>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-green-500" />
                                    <span className="text-sm font-medium">Secure SSL Connection</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">V</div>
                                    <div className="w-8 h-5 bg-gradient-to-r from-red-500 to-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">M</div>
                                    <div className="w-8 h-5 bg-gradient-to-r from-blue-400 to-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">A</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Card Number</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm"
                                            maxLength={19}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Expiry Date</label>
                                        <input
                                            type="text"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                                            placeholder="MM/YY"
                                            className="w-full h-10 px-4 rounded-md border border-input bg-background text-sm"
                                            maxLength={5}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">CVC</label>
                                        <input
                                            type="text"
                                            value={cvc}
                                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substr(0, 4))}
                                            placeholder="123"
                                            className="w-full h-10 px-4 rounded-md border border-input bg-background text-sm"
                                            maxLength={4}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Cardholder Name</label>
                                    <input
                                        type="text"
                                        value={cardholderName}
                                        onChange={(e) => setCardholderName(e.target.value)}
                                        placeholder="Name on card"
                                        className="w-full h-10 px-4 rounded-md border border-input bg-background text-sm"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Security Notice */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>Your payment information is encrypted and secure</span>
                    </div>
                </CardContent>
            </Card>
        )
    }
)

PaymentForm.displayName = 'PaymentForm'
