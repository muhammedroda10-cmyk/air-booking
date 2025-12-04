"use client"

import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { CreditCard, Lock } from "lucide-react"

export function PaymentForm() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium">Secure SSL Connection</span>
                    </div>
                    <div className="flex gap-2">
                        {/* Card Icons Placeholder */}
                        <div className="w-8 h-5 bg-slate-200 rounded" />
                        <div className="w-8 h-5 bg-slate-200 rounded" />
                        <div className="w-8 h-5 bg-slate-200 rounded" />
                    </div>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Card Number"
                        placeholder="0000 0000 0000 0000"
                        icon={<CreditCard className="w-4 h-4" />}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Expiry Date" placeholder="MM/YY" />
                        <Input label="CVC" placeholder="123" />
                    </div>

                    <Input label="Cardholder Name" placeholder="Name on card" />
                </div>
            </CardContent>
        </Card>
    )
}
