"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Filter, Star } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"

export function HotelFilterSidebar() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [priceRange, setPriceRange] = React.useState([0, 1000])

    const updateFilters = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`?${params.toString()}`)
    }

    const handlePriceChange = (value: number[]) => {
        setPriceRange(value)
        updateFilters('max_price', value[1].toString())
        updateFilters('min_price', value[0].toString())
    }

    return (
        <Card className="border-none shadow-lg bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Filters</h3>
            </div>

            <div className="p-6 space-y-8">
                <FilterSection title="Price Range" defaultOpen={true}>
                    <div className="px-2 py-4">
                        <Slider
                            defaultValue={[0, 1000]}
                            max={1000}
                            step={50}
                            className="mb-6"
                            onValueChange={handlePriceChange}
                        />
                        <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                            <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">${priceRange[0]}</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">${priceRange[1]}</span>
                        </div>
                    </div>
                </FilterSection>

                <FilterSection title="Star Rating" defaultOpen={true}>
                    <div className="space-y-4">
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <CheckboxFilter
                                key={rating}
                                label={`${rating} Stars`}
                                checked={searchParams.get('rating') === rating.toString()}
                                onCheckedChange={(checked) => updateFilters('rating', checked ? rating.toString() : null)}
                                icon={<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                            />
                        ))}
                    </div>
                </FilterSection>
            </div>
        </Card>
    )
}

function FilterSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)

    return (
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6 last:border-0 last:pb-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full font-bold text-slate-900 dark:text-white mb-4 hover:text-primary transition-colors group"
            >
                <span className="group-hover:translate-x-1 transition-transform">{title}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function CheckboxFilter({ label, checked, onCheckedChange, icon }: { label: string, checked?: boolean, onCheckedChange?: (checked: boolean) => void, icon?: React.ReactNode }) {
    return (
        <label className="flex items-center justify-between cursor-pointer group select-none">
            <div className="flex items-center gap-3">
                <Checkbox
                    id={label}
                    className="rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                />
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</span>
                </div>
            </div>
        </label>
    )
}
