'use client';

import { PublicLayout } from "@/components/layouts/public-layout";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpPage() {
    return (
        <PublicLayout>
            <div className="bg-primary py-16 text-white text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-6">How can we help you?</h1>
                    <div className="max-w-xl mx-auto relative text-slate-900">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input className="pl-10 h-12 text-lg" placeholder="Search for help articles..." />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-3xl">
                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>How do I change my flight?</AccordionTrigger>
                        <AccordionContent>
                            You can change your flight through the "My Trips" section in your dashboard. Select the booking you wish to modify and click "Change Flight". Fees may apply depending on your fare class.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>What is the baggage allowance?</AccordionTrigger>
                        <AccordionContent>
                            Baggage allowance varies by route and fare class. Generally, Economy passengers are allowed one checked bag up to 23kg, while Business and First Class passengers have higher allowances. Check your ticket for specific details.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>How can I request a refund?</AccordionTrigger>
                        <AccordionContent>
                            Refund requests can be submitted via the "Support" page. If your ticket is refundable, the amount will be credited back to your original payment method within 7-10 business days.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>Do you offer special assistance?</AccordionTrigger>
                        <AccordionContent>
                            Yes, we offer special assistance for passengers with reduced mobility or other needs. Please request this at least 48 hours before your flight via the "Manage Booking" page or by contacting support.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </PublicLayout>
    );
}
