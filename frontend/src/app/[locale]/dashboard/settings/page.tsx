'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Settings,
    Save,
    Loader2,
    Globe,
    Mail,
    CreditCard,
    Bell,
    Shield,
    RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SystemSettings {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    timezone: string;
    currency: string;
    enableHotelBookings: boolean;
    enableFlightBookings: boolean;
    enableWallet: boolean;
    enableRefunds: boolean;
    enableNotifications: boolean;
    maintenanceMode: boolean;
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    stripeEnabled: boolean;
    paypalEnabled: boolean;
}

export default function SettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SystemSettings>({
        siteName: 'Voyager',
        siteUrl: 'https://voyager.com',
        supportEmail: 'support@voyager.com',
        timezone: 'UTC',
        currency: 'USD',
        enableHotelBookings: true,
        enableFlightBookings: true,
        enableWallet: true,
        enableRefunds: true,
        enableNotifications: true,
        maintenanceMode: false,
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        stripeEnabled: true,
        paypalEnabled: false,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/settings');
            if (data) {
                setSettings({ ...settings, ...data });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            // Keep default settings
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            await api.post('/admin/settings', settings);
            toast({ title: 'Success', description: 'Settings saved successfully' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof SystemSettings, value: any) => {
        setSettings({ ...settings, [key]: value });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="w-6 h-6" />
                        System Settings
                    </h1>
                    <p className="text-muted-foreground">Configure your platform settings</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="icon" onClick={fetchSettings}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button onClick={saveSettings} disabled={saving}>
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">
                        <Globe className="w-4 h-4 mr-2" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="features">
                        <Shield className="w-4 h-4 mr-2" />
                        Features
                    </TabsTrigger>
                    <TabsTrigger value="email">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Payments
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Site Information</CardTitle>
                            <CardDescription>Basic information about your platform</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="siteName">Site Name</Label>
                                    <Input
                                        id="siteName"
                                        value={settings.siteName}
                                        onChange={(e) => updateSetting('siteName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="siteUrl">Site URL</Label>
                                    <Input
                                        id="siteUrl"
                                        value={settings.siteUrl}
                                        onChange={(e) => updateSetting('siteUrl', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="supportEmail">Support Email</Label>
                                    <Input
                                        id="supportEmail"
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={(e) => updateSetting('supportEmail', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Input
                                        id="timezone"
                                        value={settings.timezone}
                                        onChange={(e) => updateSetting('timezone', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Default Currency</Label>
                                    <Input
                                        id="currency"
                                        value={settings.currency}
                                        onChange={(e) => updateSetting('currency', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-red-600">Maintenance Mode</CardTitle>
                            <CardDescription>Enable to temporarily disable the site for users</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Maintenance Mode</p>
                                    <p className="text-sm text-muted-foreground">
                                        When enabled, users will see a maintenance message
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.maintenanceMode}
                                    onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Toggles</CardTitle>
                            <CardDescription>Enable or disable platform features</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Flight Bookings</p>
                                    <p className="text-sm text-muted-foreground">Allow users to book flights</p>
                                </div>
                                <Switch
                                    checked={settings.enableFlightBookings}
                                    onCheckedChange={(checked) => updateSetting('enableFlightBookings', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Hotel Bookings</p>
                                    <p className="text-sm text-muted-foreground">Allow users to book hotels</p>
                                </div>
                                <Switch
                                    checked={settings.enableHotelBookings}
                                    onCheckedChange={(checked) => updateSetting('enableHotelBookings', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Wallet System</p>
                                    <p className="text-sm text-muted-foreground">Enable virtual wallet for users</p>
                                </div>
                                <Switch
                                    checked={settings.enableWallet}
                                    onCheckedChange={(checked) => updateSetting('enableWallet', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Refunds</p>
                                    <p className="text-sm text-muted-foreground">Allow users to request refunds</p>
                                </div>
                                <Switch
                                    checked={settings.enableRefunds}
                                    onCheckedChange={(checked) => updateSetting('enableRefunds', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Notifications</p>
                                    <p className="text-sm text-muted-foreground">Send notifications to users</p>
                                </div>
                                <Switch
                                    checked={settings.enableNotifications}
                                    onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>SMTP Configuration</CardTitle>
                            <CardDescription>Configure email sending settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="smtpHost">SMTP Host</Label>
                                    <Input
                                        id="smtpHost"
                                        value={settings.smtpHost}
                                        onChange={(e) => updateSetting('smtpHost', e.target.value)}
                                        placeholder="smtp.example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtpPort">SMTP Port</Label>
                                    <Input
                                        id="smtpPort"
                                        value={settings.smtpPort}
                                        onChange={(e) => updateSetting('smtpPort', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtpUser">SMTP Username</Label>
                                    <Input
                                        id="smtpUser"
                                        value={settings.smtpUser}
                                        onChange={(e) => updateSetting('smtpUser', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                                    <Input
                                        id="smtpPassword"
                                        type="password"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <Button variant="outline">
                                <Mail className="w-4 h-4 mr-2" />
                                Send Test Email
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Gateways</CardTitle>
                            <CardDescription>Configure payment processing options</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#635bff] rounded flex items-center justify-center text-white font-bold">
                                        S
                                    </div>
                                    <div>
                                        <p className="font-medium">Stripe</p>
                                        <p className="text-sm text-muted-foreground">Process credit card payments</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.stripeEnabled}
                                    onCheckedChange={(checked) => updateSetting('stripeEnabled', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#003087] rounded flex items-center justify-center text-white font-bold">
                                        P
                                    </div>
                                    <div>
                                        <p className="font-medium">PayPal</p>
                                        <p className="text-sm text-muted-foreground">Accept PayPal payments</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.paypalEnabled}
                                    onCheckedChange={(checked) => updateSetting('paypalEnabled', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
