"use client"

import * as React from "react"
import { UserLayout } from "@/components/layouts/user-layout"
import { LoyaltyStatus } from "@/components/loyalty-status"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading"
import { AlertCircle, Gift, History, TrendingUp, CheckCircle2 } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

interface LoyaltyData {
    balance: number
    lifetime_points: number
    tier: string
    tier_color: string
    tier_benefits: {
        earn_rate: string
        redeem_rate: string
        perks: string[]
    }
    points_to_next_tier: number | null
    points_value: number
    recent_transactions: Transaction[]
}

interface Transaction {
    id: number
    points: number
    type: string
    description: string
    reference: string
    created_at: string
    is_earn: boolean
}

export default function LoyaltyPage() {
    const { dir } = useLanguage()
    const [data, setData] = React.useState<LoyaltyData | null>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        fetchLoyaltyData()
    }, [])

    const fetchLoyaltyData = async () => {
        try {
            const response = await api.get("/loyalty")
            setData(response.data)
        } catch (error) {
            console.error("Failed to fetch loyalty data:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <UserLayout>
                <div className="flex justify-center items-center min-h-[400px]">
                    <LoadingSpinner size="lg" />
                </div>
            </UserLayout>
        )
    }

    if (!data) return null

    return (
        <UserLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        {dir === 'rtl' ? 'برنامج الولاء' : 'Loyalty Program'}
                    </h1>
                    <p className="text-muted-foreground">
                        {dir === 'rtl'
                            ? 'اكسب النقاط مع كل رحلة واستبدلها بخصومات حصرية'
                            : 'Earn points with every flight and redeem them for exclusive discounts'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Status Card */}
                    <div className="md:col-span-2">
                        <LoyaltyStatus
                            tier={data.tier}
                            tierColor={data.tier_color}
                            balance={data.balance}
                            lifetimePoints={data.lifetime_points}
                            pointsToNextTier={data.points_to_next_tier}
                            className="h-full"
                        />
                    </div>

                    {/* Value Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Gift className="w-5 h-5 text-primary" />
                                {dir === 'rtl' ? 'قيمة النقاط' : 'Points Value'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-6">
                                <div className="text-4xl font-bold text-green-600 mb-2">
                                    ${data.points_value.toFixed(2)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {dir === 'rtl'
                                        ? 'يمكنك استخدامها في حجزك القادم'
                                        : 'Available for your next booking'}
                                </p>
                                <Button className="mt-6 w-full">
                                    {dir === 'rtl' ? 'احجز الآن' : 'Book a Flight'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="benefits">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="benefits">
                            {dir === 'rtl' ? 'المميزات' : 'My Benefits'}
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            {dir === 'rtl' ? 'سجل النقاط' : 'Points History'}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="benefits" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {dir === 'rtl' ? 'معدلات التحويل' : 'Earning & Redemption'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="w-5 h-5 text-blue-500" />
                                            <div>
                                                <p className="font-medium">{dir === 'rtl' ? 'معدل الكسب' : 'Earning Rate'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {dir === 'rtl' ? 'لكل دولار تنفقه' : 'Per $1 spent'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-blue-600">
                                            {data.tier_benefits.earn_rate}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Gift className="w-5 h-5 text-green-500" />
                                            <div>
                                                <p className="font-medium">{dir === 'rtl' ? 'معدل الاستبدال' : 'Redemption Rate'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {dir === 'rtl' ? 'قيمة 100 نقطة' : 'Value of 100 pts'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-green-600">
                                            {data.tier_benefits.redeem_rate}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {dir === 'rtl' ? 'مميزات العضوية' : 'Tier Perks'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {data.tier_benefits.perks.map((perk, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                                <span className="text-slate-700 dark:text-slate-300">{perk}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="w-5 h-5" />
                                    {dir === 'rtl' ? 'آخر المعاملات' : 'Recent Transactions'}
                                </CardTitle>
                                <CardDescription>
                                    {dir === 'rtl' ? 'آخر نشاطات النقاط' : 'Your recent points activity'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{dir === 'rtl' ? 'التاريخ' : 'Date'}</TableHead>
                                            <TableHead>{dir === 'rtl' ? 'الوصف' : 'Description'}</TableHead>
                                            <TableHead>{dir === 'rtl' ? 'المرجع' : 'Reference'}</TableHead>
                                            <TableHead className="text-right">{dir === 'rtl' ? 'النقاط' : 'Points'}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.recent_transactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    {dir === 'rtl' ? 'لا توجد معاملات حتى الآن' : 'No transactions yet'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.recent_transactions.map((tx) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="whitespace-nowrap">
                                                        {new Date(tx.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>{tx.description}</TableCell>
                                                    <TableCell className="font-mono text-xs">{tx.reference || '-'}</TableCell>
                                                    <TableCell className={cn(
                                                        "text-right font-medium",
                                                        tx.is_earn ? "text-green-600" : "text-red-500"
                                                    )}>
                                                        {tx.is_earn ? '+' : ''}{tx.points}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </UserLayout>
    )
}
