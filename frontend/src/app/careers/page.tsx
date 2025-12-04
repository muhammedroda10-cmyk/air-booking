'use client';

import { PublicLayout } from "@/components/layouts/public-layout";
import { Button } from "@/components/ui/button";

export default function CareersPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold mb-6">Careers at SkyWings</h1>
                <p className="text-xl text-muted-foreground mb-8">Join us in shaping the future of aviation.</p>

                <div className="grid gap-6">
                    <JobCard
                        title="Senior Software Engineer"
                        department="Engineering"
                        location="Remote / Dubai"
                        type="Full-time"
                    />
                    <JobCard
                        title="Flight Attendant"
                        department="Cabin Crew"
                        location="London, UK"
                        type="Full-time"
                    />
                    <JobCard
                        title="Marketing Manager"
                        department="Marketing"
                        location="New York, USA"
                        type="Full-time"
                    />
                </div>
            </div>
        </PublicLayout>
    );
}

function JobCard({ title, department, location, type }: { title: string, department: string, location: string, type: string }) {
    return (
        <div className="border rounded-lg p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <div>
                <h3 className="text-xl font-bold">{title}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span>{department}</span>
                    <span>•</span>
                    <span>{location}</span>
                    <span>•</span>
                    <span>{type}</span>
                </div>
            </div>
            <Button>Apply Now</Button>
        </div>
    )
}
