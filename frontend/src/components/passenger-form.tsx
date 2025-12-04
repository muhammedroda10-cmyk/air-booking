"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, User, Users, Baby } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/context/language-context"

interface PassengerData {
    title: string
    firstName: string
    lastName: string
    dob: string
    nationality: string
    passportNumber: string
    passportExpiry: string
}

interface PassengerFormProps {
    onChange: (data: PassengerData[]) => void
    adults?: number
    children?: number
    infants?: number
}

type PassengerType = 'adult' | 'child' | 'infant'

interface PassengerInfo {
    type: PassengerType
    label: string
    labelAr: string
    icon: typeof User
}

export function PassengerForm({
    onChange,
    adults = 1,
    children = 0,
    infants = 0
}: PassengerFormProps) {
    const { dir } = useLanguage()
    const totalPassengers = adults + children + infants

    // Build passenger list with types
    const passengerTypes: PassengerInfo[] = [
        ...Array(adults).fill(null).map((_, i) => ({
            type: 'adult' as PassengerType,
            label: adults > 1 ? `Adult ${i + 1}` : 'Adult',
            labelAr: adults > 1 ? `بالغ ${i + 1}` : 'بالغ',
            icon: User
        })),
        ...Array(children).fill(null).map((_, i) => ({
            type: 'child' as PassengerType,
            label: children > 1 ? `Child ${i + 1}` : 'Child',
            labelAr: children > 1 ? `طفل ${i + 1}` : 'طفل',
            icon: Users
        })),
        ...Array(infants).fill(null).map((_, i) => ({
            type: 'infant' as PassengerType,
            label: infants > 1 ? `Infant ${i + 1}` : 'Infant',
            labelAr: infants > 1 ? `رضيع ${i + 1}` : 'رضيع',
            icon: Baby
        }))
    ]

    const [passengers, setPassengers] = useState<PassengerData[]>(
        Array(totalPassengers).fill(null).map(() => ({
            title: "mr",
            firstName: "",
            lastName: "",
            dob: "",
            nationality: "",
            passportNumber: "",
            passportExpiry: ""
        }))
    )

    const [expandedIndex, setExpandedIndex] = useState<number>(0)
    const [contactInfo, setContactInfo] = useState({
        email: "",
        phone: ""
    })

    useEffect(() => {
        onChange(passengers)
    }, [passengers, onChange])

    const handlePassengerChange = (index: number, field: keyof PassengerData, value: string) => {
        setPassengers(prev => prev.map((p, i) =>
            i === index ? { ...p, [field]: value } : p
        ))
    }

    const isPassengerComplete = (passenger: PassengerData) => {
        return passenger.firstName && passenger.lastName && passenger.passportNumber
    }

    const titles = [
        { value: "mr", label: "Mr", labelAr: "السيد" },
        { value: "mrs", label: "Mrs", labelAr: "السيدة" },
        { value: "ms", label: "Ms", labelAr: "الآنسة" },
        { value: "master", label: "Master", labelAr: "الطفل" },
        { value: "miss", label: "Miss", labelAr: "الطفلة" }
    ]

    return (
        <div className="space-y-6">
            {/* Passengers Summary Header */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold mb-1">
                                {dir === 'rtl' ? 'تفاصيل المسافرين' : 'Passenger Details'}
                            </h2>
                            <p className="text-slate-300 text-sm">
                                {dir === 'rtl'
                                    ? `${totalPassengers} مسافر${totalPassengers > 1 ? 'ين' : ''}`
                                    : `${totalPassengers} passenger${totalPassengers > 1 ? 's' : ''}`
                                }
                            </p>
                        </div>
                        <div className="flex gap-4">
                            {adults > 0 && (
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-1">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs">{adults} {dir === 'rtl' ? 'بالغ' : 'Adult'}</span>
                                </div>
                            )}
                            {children > 0 && (
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-1">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs">{children} {dir === 'rtl' ? 'طفل' : 'Child'}</span>
                                </div>
                            )}
                            {infants > 0 && (
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-1">
                                        <Baby className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs">{infants} {dir === 'rtl' ? 'رضيع' : 'Infant'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Individual Passenger Forms */}
            {passengers.map((passenger, index) => {
                const info = passengerTypes[index]
                const Icon = info?.icon || User
                const isExpanded = expandedIndex === index
                const isComplete = isPassengerComplete(passenger)

                return (
                    <Card
                        key={index}
                        className={cn(
                            "border-2 transition-all duration-300 overflow-hidden",
                            isExpanded ? "border-primary shadow-lg" : "border-slate-200",
                            isComplete && !isExpanded && "border-green-200 bg-green-50/50"
                        )}
                    >
                        {/* Accordion Header */}
                        <button
                            onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                            className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center",
                                    isComplete ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"
                                )}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-lg">
                                        {dir === 'rtl' ? info?.labelAr : info?.label}
                                    </div>
                                    {isComplete ? (
                                        <div className="text-sm text-green-600 font-medium">
                                            {passenger.firstName} {passenger.lastName}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">
                                            {dir === 'rtl' ? 'انقر لإكمال التفاصيل' : 'Click to complete details'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isComplete && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                        {dir === 'rtl' ? 'مكتمل' : 'Complete'}
                                    </span>
                                )}
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                            </div>
                        </button>

                        {/* Accordion Content */}
                        <div className={cn(
                            "transition-all duration-300",
                            isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                        )}>
                            <CardContent className="p-6 pt-0 space-y-6 border-t">
                                {/* Personal Information */}
                                <div>
                                    <h4 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                        {dir === 'rtl' ? 'معلومات شخصية' : 'Personal Information'}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                {dir === 'rtl' ? 'اللقب' : 'Title'}
                                            </label>
                                            <Select
                                                value={passenger.title}
                                                onValueChange={(value) => handlePassengerChange(index, "title", value)}
                                            >
                                                <SelectTrigger className="h-12 bg-white">
                                                    <SelectValue placeholder={dir === 'rtl' ? 'اختر' : 'Select'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {titles.map(t => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                            {dir === 'rtl' ? t.labelAr : t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                {dir === 'rtl' ? 'الاسم الأول' : 'First Name'} <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                placeholder={dir === 'rtl' ? 'مثال: محمد' : 'e.g. John'}
                                                value={passenger.firstName}
                                                onChange={(e) => handlePassengerChange(index, "firstName", e.target.value)}
                                                className="h-12 bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                {dir === 'rtl' ? 'اسم العائلة' : 'Last Name'} <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                placeholder={dir === 'rtl' ? 'مثال: أحمد' : 'e.g. Doe'}
                                                value={passenger.lastName}
                                                onChange={(e) => handlePassengerChange(index, "lastName", e.target.value)}
                                                className="h-12 bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                {dir === 'rtl' ? 'تاريخ الميلاد' : 'Date of Birth'}
                                            </label>
                                            <Input
                                                type="date"
                                                value={passenger.dob}
                                                onChange={(e) => handlePassengerChange(index, "dob", e.target.value)}
                                                className="h-12 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Travel Documents */}
                                <div>
                                    <h4 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                        {dir === 'rtl' ? 'وثائق السفر' : 'Travel Documents'}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                {dir === 'rtl' ? 'رقم جواز السفر' : 'Passport Number'} <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                placeholder={dir === 'rtl' ? 'مثال: A12345678' : 'e.g. A12345678'}
                                                value={passenger.passportNumber}
                                                onChange={(e) => handlePassengerChange(index, "passportNumber", e.target.value)}
                                                className="h-12 bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                {dir === 'rtl' ? 'تاريخ انتهاء الجواز' : 'Passport Expiry'}
                                            </label>
                                            <Input
                                                type="date"
                                                value={passenger.passportExpiry}
                                                onChange={(e) => handlePassengerChange(index, "passportExpiry", e.target.value)}
                                                className="h-12 bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                {dir === 'rtl' ? 'الجنسية' : 'Nationality'}
                                            </label>
                                            <Input
                                                placeholder={dir === 'rtl' ? 'مثال: الإمارات' : 'e.g. United Arab Emirates'}
                                                value={passenger.nationality}
                                                onChange={(e) => handlePassengerChange(index, "nationality", e.target.value)}
                                                className="h-12 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Next Passenger Button */}
                                {index < passengers.length - 1 && (
                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={() => setExpandedIndex(index + 1)}
                                            className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            {dir === 'rtl' ? 'المسافر التالي ←' : 'Next Passenger →'}
                                        </button>
                                    </div>
                                )}
                            </CardContent>
                        </div>
                    </Card>
                )
            })}

            {/* Contact Information */}
            <Card className="border-2 border-slate-200 shadow-lg">
                <CardHeader className="border-b bg-slate-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </span>
                        {dir === 'rtl' ? 'معلومات الاتصال' : 'Contact Information'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-6">
                        {dir === 'rtl'
                            ? 'سنرسل تأكيد الحجز والتذكرة الإلكترونية إلى هذا البريد الإلكتروني'
                            : 'We\'ll send your booking confirmation and e-ticket to this email'
                        }
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                {dir === 'rtl' ? 'البريد الإلكتروني' : 'Email Address'} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="email"
                                placeholder="john@example.com"
                                value={contactInfo.email}
                                onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                                className="h-12 bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                {dir === 'rtl' ? 'رقم الهاتف' : 'Phone Number'} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="tel"
                                placeholder="+971 50 123 4567"
                                value={contactInfo.phone}
                                onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                                className="h-12 bg-white"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
