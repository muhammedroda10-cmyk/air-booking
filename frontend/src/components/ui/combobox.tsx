"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// Reusable Combobox Component with custom search
interface ComboboxProps {
    items: { value: string; label: string; subLabel?: string }[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
}

export function Combobox({
    items,
    value,
    onChange,
    placeholder = "Select item...",
    searchPlaceholder = "Search city or airport...",
    emptyMessage = "No item found.",
    className,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const selectedItem = items.find((item) => item.value === value)

    // Filter items based on search
    const filteredItems = React.useMemo(() => {
        if (!search.trim()) return items
        const lowerSearch = search.toLowerCase()
        return items.filter(
            (item) =>
                item.label.toLowerCase().includes(lowerSearch) ||
                item.subLabel?.toLowerCase().includes(lowerSearch)
        )
    }, [items, search])

    // Reset search when closing
    React.useEffect(() => {
        if (!open) setSearch("")
    }, [open])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between overflow-hidden", className)}
                >
                    {selectedItem ? (
                        <div className="flex flex-col items-start text-left min-w-0 flex-1 overflow-hidden">
                            <span className="font-medium truncate w-full">{selectedItem.label}</span>
                            {selectedItem.subLabel && (
                                <span className="text-xs text-muted-foreground truncate w-full">
                                    {selectedItem.subLabel}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[320px] p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl z-50"
                align="start"
            >
                {/* Custom Search Input */}
                <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        autoFocus
                    />
                </div>

                {/* Items List */}
                <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                    {filteredItems.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            {emptyMessage}
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <div
                                key={item.value}
                                onClick={() => {
                                    onChange(item.value)
                                    setOpen(false)
                                }}
                                className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                                    value === item.value && "bg-slate-100 dark:bg-slate-800"
                                )}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4 shrink-0",
                                        value === item.value ? "opacity-100 text-blue-600" : "opacity-0"
                                    )}
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-medium">{item.label}</span>
                                    {item.subLabel && (
                                        <span className="text-xs text-muted-foreground truncate">
                                            {item.subLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
