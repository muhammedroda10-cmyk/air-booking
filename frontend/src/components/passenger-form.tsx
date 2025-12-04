"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"

interface PassengerFormProps {
    onChange: (data: any) => void
}

export function PassengerForm({ onChange }: PassengerFormProps) {
    const [formData, setFormData] = useState({
        title: "mr",
        firstName: "",
        lastName: "",
        dob: "",
        nationality: "",
        passportNumber: "",
        passportExpiry: "",
        email: "",
        phone: ""
    })

    useEffect(() => {
        onChange(formData)
    }, [formData, onChange])

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Passenger Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title</label>
                        <Select
                            value={formData.title}
                            onValueChange={(value) => handleChange("title", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Title" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mr">Mr</SelectItem>
                                <SelectItem value="mrs">Mrs</SelectItem>
                                <SelectItem value="ms">Ms</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Input
                        label="First Name"
                        placeholder="e.g. John"
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                    />
                    <Input
                        label="Last Name"
                        placeholder="e.g. Doe"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Date of Birth"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => handleChange("dob", e.target.value)}
                    />
                    <Input
                        label="Nationality"
                        placeholder="e.g. United Arab Emirates"
                        value={formData.nationality}
                        onChange={(e) => handleChange("nationality", e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Passport Number"
                        placeholder="e.g. A12345678"
                        value={formData.passportNumber}
                        onChange={(e) => handleChange("passportNumber", e.target.value)}
                    />
                    <Input
                        label="Passport Expiry"
                        type="date"
                        value={formData.passportExpiry}
                        onChange={(e) => handleChange("passportExpiry", e.target.value)}
                    />
                </div>

                <div className="pt-4 border-t">
                    <h4 className="font-medium mb-4">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                        />
                        <Input
                            label="Phone Number"
                            type="tel"
                            placeholder="+971 50 123 4567"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
