"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Crown, Star, TrendingUp, Info } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import { cn } from "@/lib/utils"

interface LoyaltyStatusProps {
    tier: string
    tierColor: string
    balance: number
    lifetimePoints: number
    pointsToNextTier: number | null
    nextTier?: string
    className?: string
}

export function LoyaltyStatus({
    tier,
    tierColor,
    balance,
    lifetimePoints,
    pointsToNextTier,
    nextTier,
    className
}: LoyaltyStatusProps) {
    const { dir } = useLanguage()

    const getTierIcon = (tierName: string) => {
        switch (tierName.toLowerCase()) {
            case 'platinum': return Crown
            case 'gold': return Star
            case 'silver': return TrendingUp
            default: return Star
        }
    }

    const TierIcon = getTierIcon(tier)

    return (
        <Card className={cn("overflow-hidden", className)}>
            <div
                className="h-2"
                style={{ backgroundColor: tierColor }}
            />
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TierIcon className="w-5 h-5" style={{ color: tierColor }} />
                            <span className="capitalize">{tier} Status</span>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {dir === 'rtl' ? 'رصيد النقاط' : 'Points Balance'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                            {balance.toLocaleString()}
                        </div>
                        <Badge variant="outline" className="mt-1">
                            {dir === 'rtl' ? 'نقطة' : 'PTS'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {pointsToNextTier !== null ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                                {dir === 'rtl'
                                    ? `${pointsToNextTier.toLocaleString()} نقطة للترقية`
                                    : `${pointsToNextTier.toLocaleString()} pts to next tier`}
                            </span>
                            <span>{Math.floor((lifetimePoints / (lifetimePoints + pointsToNextTier)) * 100)}%</span>
                        </div>
                        <Progress
                            value={(lifetimePoints / (lifetimePoints + pointsToNextTier)) * 100}
                            className="h-2"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-2 rounded-lg">
                        <Crown className="w-4 h-4 text-primary" />
                        {dir === 'rtl'
                            ? 'لقد وصلت إلى أعلى مستوى!'
                            : 'You have reached the highest tier!'}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
