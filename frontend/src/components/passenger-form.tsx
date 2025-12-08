"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ChevronDown, ChevronUp, User, Users, Baby, AlertCircle } from "lucide-react"
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
    mealPreference: string
    specialAssistance: string
    type: string
}

interface ContactInfo {
    email: string
    phone: string
}

interface PassengerFormProps {
    onChange: (data: PassengerData[], contactInfo: ContactInfo) => void
    adults?: number
    children?: number
    infants?: number
}

export interface PassengerFormRef {
    validate: () => { isValid: boolean; error?: string }
    getData: () => { passengers: PassengerData[]; contactInfo: ContactInfo }
}

type PassengerType = 'adult' | 'child' | 'infant'

interface PassengerInfo {
    type: PassengerType
    label: string
    labelAr: string
    icon: typeof User
}

export const PassengerForm = React.forwardRef<PassengerFormRef, PassengerFormProps>(
    ({ onChange, adults = 1, children = 0, infants = 0 }, ref) => {
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

        const [passengers, setPassengers] = React.useState<PassengerData[]>(
            passengerTypes.map((info) => ({
                title: "mr",
                firstName: "",
                lastName: "",
                dob: "",
                nationality: "",
                passportNumber: "",
                passportExpiry: "",
                mealPreference: "standard",
                specialAssistance: "none",
                type: info.type
            }))
        )

        const [expandedIndex, setExpandedIndex] = React.useState<number>(0)
        const [contactInfo, setContactInfo] = React.useState<ContactInfo>({
            email: "",
            phone: ""
        })
        const [validationErrors, setValidationErrors] = React.useState<string[]>([])

        // Update parent when data changes
        React.useEffect(() => {
            onChange(passengers, contactInfo)
        }, [passengers, contactInfo, onChange])

        const handlePassengerChange = (index: number, field: keyof PassengerData, value: string) => {
            setPassengers(prev => prev.map((p, i) =>
                i === index ? { ...p, [field]: value } : p
            ))
            // Clear validation errors when user starts typing
            if (validationErrors.length > 0) {
                setValidationErrors([])
            }
        }

        const isPassengerComplete = (passenger: PassengerData) => {
            return passenger.firstName && passenger.lastName && passenger.passportNumber
        }

        // Validate all fields
        const validate = (): { isValid: boolean; error?: string } => {
            const errors: string[] = []
            const today = new Date()
            const sixMonthsFromNow = new Date(today)
            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

            passengers.forEach((passenger, index) => {
                const info = passengerTypes[index]
                const label = dir === 'rtl' ? info?.labelAr : info?.label

                if (!passenger.firstName.trim()) {
                    errors.push(`${label}: ${dir === 'rtl' ? 'الاسم الأول مطلوب' : 'First name is required'}`)
                }
                if (!passenger.lastName.trim()) {
                    errors.push(`${label}: ${dir === 'rtl' ? 'اسم العائلة مطلوب' : 'Last name is required'}`)
                }
                if (!passenger.passportNumber.trim()) {
                    errors.push(`${label}: ${dir === 'rtl' ? 'رقم جواز السفر مطلوب' : 'Passport number is required'}`)
                }

                // Date of birth validation
                if (!passenger.dob) {
                    errors.push(`${label}: ${dir === 'rtl' ? 'تاريخ الميلاد مطلوب' : 'Date of birth is required'}`)
                } else {
                    const dob = new Date(passenger.dob)
                    const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

                    // Validate age based on passenger type
                    if (passenger.type === 'adult' && age < 12) {
                        errors.push(`${label}: ${dir === 'rtl' ? 'يجب أن يكون عمر البالغ 12 سنة أو أكثر' : 'Adults must be 12 years or older'}`)
                    } else if (passenger.type === 'child') {
                        if (age < 2 || age > 11) {
                            errors.push(`${label}: ${dir === 'rtl' ? 'يجب أن يتراوح عمر الطفل بين 2-11 سنة' : 'Children must be between 2-11 years old'}`)
                        }
                    } else if (passenger.type === 'infant') {
                        if (age >= 2) {
                            errors.push(`${label}: ${dir === 'rtl' ? 'يجب أن يكون عمر الرضيع أقل من سنتين' : 'Infants must be under 2 years old'}`)
                        }
                    }

                    // Date of birth can't be in the future
                    if (dob > today) {
                        errors.push(`${label}: ${dir === 'rtl' ? 'تاريخ الميلاد لا يمكن أن يكون في المستقبل' : 'Date of birth cannot be in the future'}`)
                    }
                }

                // Passport expiry validation (must be at least 6 months from today)
                if (!passenger.passportExpiry) {
                    errors.push(`${label}: ${dir === 'rtl' ? 'تاريخ انتهاء جواز السفر مطلوب' : 'Passport expiry date is required'}`)
                } else {
                    const expiryDate = new Date(passenger.passportExpiry)
                    if (expiryDate < today) {
                        errors.push(`${label}: ${dir === 'rtl' ? 'جواز السفر منتهي الصلاحية' : 'Passport has expired'}`)
                    } else if (expiryDate < sixMonthsFromNow) {
                        errors.push(`${label}: ${dir === 'rtl' ? 'يجب أن تكون صلاحية جواز السفر 6 أشهر على الأقل' : 'Passport must be valid for at least 6 months'}`)
                    }
                }
            })

            if (!contactInfo.email.trim()) {
                errors.push(dir === 'rtl' ? 'البريد الإلكتروني مطلوب' : 'Email is required')
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
                errors.push(dir === 'rtl' ? 'البريد الإلكتروني غير صالح' : 'Invalid email format')
            }

            if (!contactInfo.phone.trim()) {
                errors.push(dir === 'rtl' ? 'رقم الهاتف مطلوب' : 'Phone number is required')
            }

            setValidationErrors(errors)

            if (errors.length > 0) {
                return { isValid: false, error: errors[0] }
            }

            return { isValid: true }
        }


        const getData = () => ({ passengers, contactInfo })

        // Expose methods to parent
        React.useImperativeHandle(ref, () => ({
            validate,
            getData
        }))

        const titles = [
            { value: "mr", label: "Mr", labelAr: "السيد" },
            { value: "mrs", label: "Mrs", labelAr: "السيدة" },
            { value: "ms", label: "Ms", labelAr: "الآنسة" },
            { value: "master", label: "Master", labelAr: "الطفل" },
            { value: "miss", label: "Miss", labelAr: "الطفلة" }
        ]

        const mealOptions = [
            { value: "standard", label: "Standard", labelAr: "عادي" },
            { value: "vegetarian", label: "Vegetarian", labelAr: "نباتي" },
            { value: "vegan", label: "Vegan", labelAr: "نباتي صرف" },
            { value: "halal", label: "Halal", labelAr: "حلال" },
            { value: "kosher", label: "Kosher", labelAr: "كوشر" },
            { value: "gluten_free", label: "Gluten Free", labelAr: "خالي من الغلوتين" },
            { value: "diabetic", label: "Diabetic", labelAr: "لمرضى السكر" },
            { value: "child", label: "Child Meal", labelAr: "وجبة أطفال" }
        ]

        const assistanceOptions = [
            { value: "none", label: "None", labelAr: "لا يوجد" },
            { value: "wheelchair", label: "Wheelchair", labelAr: "كرسي متحرك" },
            { value: "visual", label: "Visual Assistance", labelAr: "مساعدة بصرية" },
            { value: "hearing", label: "Hearing Assistance", labelAr: "مساعدة سمعية" },
            { value: "mobility", label: "Mobility Assistance", labelAr: "مساعدة حركية" },
            { value: "elderly", label: "Elderly Assistance", labelAr: "مساعدة كبار السن" }
        ]

        return (
            <div className="space-y-6">
                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-medium text-red-600 dark:text-red-400">
                                    {dir === 'rtl' ? 'يرجى تصحيح الأخطاء التالية:' : 'Please fix the following errors:'}
                                </p>
                                <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                                    {validationErrors.map((error, i) => (
                                        <li key={i}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

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
                                isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
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

                                    {/* Preferences */}
                                    <div>
                                        <h4 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                            {dir === 'rtl' ? 'التفضيلات' : 'Preferences'}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">
                                                    {dir === 'rtl' ? 'تفضيل الوجبة' : 'Meal Preference'}
                                                </label>
                                                <Select
                                                    value={passenger.mealPreference}
                                                    onValueChange={(value) => handlePassengerChange(index, "mealPreference", value)}
                                                >
                                                    <SelectTrigger className="h-12 bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {mealOptions.map(m => (
                                                            <SelectItem key={m.value} value={m.value}>
                                                                {dir === 'rtl' ? m.labelAr : m.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">
                                                    {dir === 'rtl' ? 'المساعدة الخاصة' : 'Special Assistance'}
                                                </label>
                                                <Select
                                                    value={passenger.specialAssistance}
                                                    onValueChange={(value) => handlePassengerChange(index, "specialAssistance", value)}
                                                >
                                                    <SelectTrigger className="h-12 bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {assistanceOptions.map(a => (
                                                            <SelectItem key={a.value} value={a.value}>
                                                                {dir === 'rtl' ? a.labelAr : a.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
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
                                : 'We\'ll send your booking confirmation and e-ticket to this email'}
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
)

PassengerForm.displayName = 'PassengerForm'
