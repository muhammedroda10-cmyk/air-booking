'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserLayout } from '@/components/layouts/user-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { User, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ProfilePage() {
    const { toast } = useToast();
    const [user, setUser] = useState({
        name: '',
        email: '',
    });
    const [passwords, setPasswords] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/user');
            setUser({
                name: response.data.name,
                email: response.data.email,
            });
        } catch (error) {
            console.error('Failed to fetch user', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/user/profile', user);
            toast({
                title: "Profile Updated",
                description: "Your profile has been updated successfully.",
            });
        } catch (error: any) {
            console.error('Failed to update profile', error);
            toast({
                title: "Error",
                description: error.response?.data?.message || 'Failed to update profile',
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setChangingPassword(true);
        try {
            await api.put('/user/password', passwords);
            toast({
                title: "Password Changed",
                description: "Your password has been changed successfully.",
            });
            setPasswords({
                current_password: '',
                new_password: '',
                new_password_confirmation: '',
            });
        } catch (error: any) {
            console.error('Failed to change password', error);
            toast({
                title: "Error",
                description: error.response?.data?.message || 'Failed to change password',
                variant: "destructive"
            });
        } finally {
            setChangingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <UserLayout>
                <div className="flex items-center justify-center min-h-[40vh]">
                    <LoadingSpinner size="lg" />
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">My Profile</h2>
                    <p className="text-muted-foreground">Update your personal information and password.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="w-5 h-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Name</label>
                                    <Input
                                        value={user.name}
                                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Email</label>
                                    <Input
                                        type="email"
                                        value={user.email}
                                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Lock className="w-5 h-5" />
                                Change Password
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Current Password</label>
                                    <Input
                                        type="password"
                                        value={passwords.current_password}
                                        onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">New Password</label>
                                    <Input
                                        type="password"
                                        value={passwords.new_password}
                                        onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                                    <Input
                                        type="password"
                                        value={passwords.new_password_confirmation}
                                        onChange={(e) => setPasswords({ ...passwords, new_password_confirmation: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={changingPassword}>
                                    {changingPassword ? 'Changing...' : 'Change Password'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </UserLayout>
    );
}
