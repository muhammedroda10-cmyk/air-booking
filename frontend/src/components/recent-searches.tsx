"use client"

import * as React from "react"
import { Clock, X, Plane, ChevronRight } from "lucide-react"
import { RecentSearch } from "@/hooks/use-recent-searches"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/context/language-context"

interface RecentSearchesProps {
    searches: RecentSearch[]
    onSelect: (search: RecentSearch) => void
    onRemove: (id: string) => void
    onClear: () => void
    className?: string
}

export function RecentSearches({
    searches,
    onSelect,
    onRemove,
    onClear,
    className
}: RecentSearchesProps) {
    const { dir } = useLanguage()

    if (searches.length === 0) {
        return null
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    }

    const getTripTypeLabel = (type: string) => {
        if (dir === 'rtl') {
            switch (type) {
                case 'round-trip': return 'ذهاب وعودة'
                case 'one-way': return 'ذهاب فقط'
                default: return type
            }
        }
        return type.replace('-', ' ')
    }

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{dir === 'rtl' ? 'عمليات البحث الأخيرة' : 'Recent Searches'}</span>
                </div>
                <button
                    onClick={onClear}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    {dir === 'rtl' ? 'مسح الكل' : 'Clear all'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {searches.map((search) => (
                    <div
                        key={search.id}
                        className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => onSelect(search)}
                    >
                        {/* Remove button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onRemove(search.id)
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                            aria-label="Remove search"
                        >
                            <X className="w-3 h-3 text-slate-400" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Plane className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                                    <span>{search.from}</span>
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                    <span>{search.to}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                    <span>{formatDate(search.date)}</span>
                                    {search.returnDate && (
                                        <>
                                            <span>-</span>
                                            <span>{formatDate(search.returnDate)}</span>
                                        </>
                                    )}
                                    <span className="text-slate-300">|</span>
                                    <span className="capitalize">{getTripTypeLabel(search.tripType)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
