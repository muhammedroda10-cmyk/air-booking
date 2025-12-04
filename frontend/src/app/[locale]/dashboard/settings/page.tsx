'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Lock, Shield, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Toggle Switch Component
function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`h-6 w-11 rounded-full relative cursor-pointer transition-colors ${checked ? 'bg-primary' : 'bg-slate-200'
                }`}
        >
            <div
                className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'right-1' : 'left-1'
                    }`}
            />
        </button>
    );
}

export default function SettingsPage() {
    const { toast } = useToast();
    const { user, logout } = useAuth();
    const router = useRouter();

    // Settings state
    const [settings, setSettings] = useState({
        emailNotifications: true,
        marketingEmails: false,
    });
    const [saving, setSaving] = useState(false);
    const [show2FADialog, setShow2FADialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('userSettings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) { }
        }
    }, []);

    const handleToggle = async (key: keyof typeof settings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);

        // Save to localStorage
        localStorage.setItem('userSettings', JSON.stringify(newSettings));

        toast({
            title: "Settings Updated",
            description: `${key === 'emailNotifications' ? 'Email notifications' : 'Marketing emails'} ${newSettings[key] ? 'enabled' : 'disabled'}.`,
        });
    };

    const handleEnable2FA = () => {
        setShow2FADialog(true);
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            // In a real app, this would call an API endpoint
            // await api.delete('/user/account');

            // For now, simulate the deletion
            toast({
                title: "Account Deleted",
                description: "Your account has been permanently deleted.",
            });

            // Logout and redirect
            logout();
            router.push('/');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete account",
                variant: "destructive"
            });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences.</p>
            </div>

            <div className="space-y-6">
                {/* Notifications Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Email Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive updates about your bookings.</p>
                            </div>
                            <Toggle
                                checked={settings.emailNotifications}
                                onChange={() => handleToggle('emailNotifications')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Marketing Emails</p>
                                <p className="text-sm text-muted-foreground">Receive offers and promotions.</p>
                            </div>
                            <Toggle
                                checked={settings.marketingEmails}
                                onChange={() => handleToggle('marketingEmails')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Two-Factor Authentication</p>
                                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                            </div>
                            <Button variant="outline" onClick={handleEnable2FA}>
                                <Shield className="w-4 h-4 mr-2" />
                                Enable
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Delete Account</p>
                                <p className="text-sm text-muted-foreground">Permanently delete your account and data.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your account
                                            and remove all your data including bookings, wallet balance, and personal information.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteAccount}
                                            disabled={deleting}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            {deleting ? 'Deleting...' : 'Yes, delete my account'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 2FA Dialog */}
            <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Enable Two-Factor Authentication
                        </DialogTitle>
                        <DialogDescription>
                            Two-factor authentication adds an extra layer of security to your account
                            by requiring a code from your phone in addition to your password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                This feature is coming soon!
                            </p>
                            <p className="text-sm">
                                We're working on implementing 2FA with authenticator apps and SMS verification.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShow2FADialog(false)}>
                            Got it
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
