'use client';

import { useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { PublicLayout } from "@/components/layouts/public-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";

export default function SupportPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/contact', formData);
            toast({
                title: "Message Sent",
                description: "We'll get back to you shortly.",
            });
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <PublicLayout>
            <div className="bg-slate-50 dark:bg-slate-900 py-12">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">How can we help?</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Our dedicated support team is here to assist you 24/7.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
                        <div className="space-y-6">
                            <ContactItem
                                icon={<Phone className="w-6 h-6 text-primary" />}
                                title="Phone Support"
                                content="+1 (555) 123-4567"
                                description="Available 24/7 for urgent inquiries"
                            />
                            <ContactItem
                                icon={<Mail className="w-6 h-6 text-primary" />}
                                title="Email"
                                content="support@skywings.com"
                                description="We usually respond within 2 hours"
                            />
                            <ContactItem
                                icon={<MapPin className="w-6 h-6 text-primary" />}
                                title="Office"
                                content="123 Aviation Blvd, Dubai, UAE"
                                description="Visit our headquarters"
                            />
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Send us a message</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Name</label>
                                        <Input
                                            placeholder="Your name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <Input
                                            type="email"
                                            placeholder="Your email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Subject</label>
                                    <Input
                                        placeholder="How can we help?"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Message</label>
                                    <textarea
                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Tell us more about your inquiry..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button className="w-full" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Message'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}

function ContactItem({ icon, title, content, description }: { icon: React.ReactNode, title: string, content: string, description: string }) {
    return (
        <div className="flex gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-primary font-medium mb-1">{content}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}
