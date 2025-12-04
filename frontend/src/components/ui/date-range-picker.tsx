"use client"

import * as React from "react"
import { format, addDays, startOfMonth, endOfMonth, addMonths, isSameDay, isWithinInterval, isBefore, startOfDay } from "date-fns"
import { Calendar as CalendarIcon, ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
    className?: string
    placeholder?: string
} & (
        | { mode: "single"; date: Date | undefined; setDate: (date: Date | undefined) => void }
        | { mode: "range"; date: DateRange | undefined; setDate: (date: DateRange | undefined) => void }
    )

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function DateRangePicker({
    className,
    placeholder = "Pick a date",
    ...props
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [currentMonth, setCurrentMonth] = React.useState(new Date())
    const [activePreset, setActivePreset] = React.useState<string | null>(null)

    // Reset to current month when opening
    React.useEffect(() => {
        if (open) {
            if (props.mode === "range" && props.date?.from) {
                setCurrentMonth(props.date.from)
            } else if (props.mode === "single" && props.date) {
                setCurrentMonth(props.date)
            } else {
                setCurrentMonth(new Date())
            }
        }
    }, [open])

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        // Adjust for Monday start (0 = Monday, 6 = Sunday)
        const day = new Date(year, month, 1).getDay()
        return day === 0 ? 6 : day - 1
    }

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const goToPreviousYear = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1))
    }

    const goToNextYear = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1))
    }

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        setActivePreset(null)

        if (props.mode === "single") {
            props.setDate(clickedDate)
            setOpen(false)
        } else {
            // Range mode
            if (!props.date?.from || (props.date.from && props.date.to)) {
                // Start new selection
                props.setDate({ from: clickedDate, to: undefined })
            } else {
                // Complete selection
                if (isBefore(clickedDate, props.date.from)) {
                    props.setDate({ from: clickedDate, to: props.date.from })
                } else {
                    props.setDate({ from: props.date.from, to: clickedDate })
                }
            }
        }
    }

    const handlePreset = (preset: string) => {
        setActivePreset(preset)
        const today = startOfDay(new Date())

        if (props.mode === "range") {
            let range: DateRange | undefined

            switch (preset) {
                case "tomorrow":
                    range = { from: addDays(today, 1), to: addDays(today, 1) }
                    break
                case "weekend":
                    const todayDay = today.getDay()
                    const daysUntilSat = todayDay === 0 ? 6 : (6 - todayDay + 7) % 7 || 7
                    const nextSat = addDays(today, daysUntilSat)
                    range = { from: nextSat, to: addDays(nextSat, 1) }
                    break
                case "7days":
                    range = { from: today, to: addDays(today, 7) }
                    break
                case "month":
                    range = { from: startOfMonth(addMonths(today, 1)), to: endOfMonth(addMonths(today, 1)) }
                    break
            }
            props.setDate(range)
            if (range?.from) setCurrentMonth(range.from)
        } else {
            let date: Date | undefined
            switch (preset) {
                case "tomorrow":
                    date = addDays(today, 1)
                    break
                case "weekend":
                    const todayDay = today.getDay()
                    const daysUntilSat = todayDay === 0 ? 6 : (6 - todayDay + 7) % 7 || 7
                    date = addDays(today, daysUntilSat)
                    break
                case "7days":
                    date = addDays(today, 7)
                    break
            }
            props.setDate(date)
            setOpen(false)
        }
    }

    const clearAll = () => {
        props.setDate(undefined)
        setActivePreset(null)
    }

    const isDateSelected = (day: number): boolean => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        if (props.mode === "single") {
            return props.date ? isSameDay(date, props.date) : false
        } else {
            if (!props.date?.from) return false
            if (isSameDay(date, props.date.from)) return true
            if (props.date.to && isSameDay(date, props.date.to)) return true
            return false
        }
    }

    const isDateInRange = (day: number): boolean => {
        if (props.mode !== "range" || !props.date?.from || !props.date?.to) return false
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        return isWithinInterval(date, { start: props.date.from, end: props.date.to }) &&
            !isSameDay(date, props.date.from) && !isSameDay(date, props.date.to)
    }

    const isToday = (day: number): boolean => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        return isSameDay(date, new Date())
    }

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth)
        const firstDay = getFirstDayOfMonth(currentMonth)
        const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
        const prevMonthDays = getDaysInMonth(prevMonth)

        const days: React.ReactNode[] = []

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push(
                <div key={`prev-${i}`} className="text-center py-2 text-slate-300 dark:text-slate-600 text-sm">
                    {prevMonthDays - i}
                </div>
            )
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const selected = isDateSelected(day)
            const inRange = isDateInRange(day)
            const today = isToday(day)

            days.push(
                <div
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                        "text-center py-2 cursor-pointer font-medium transition-all text-sm relative",
                        selected
                            ? "bg-blue-600 text-white rounded-lg font-semibold"
                            : inRange
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg",
                        today && !selected && "ring-2 ring-blue-400 rounded-lg"
                    )}
                >
                    {day}
                </div>
            )
        }

        // Next month days
        const remainingDays = 42 - days.length
        for (let day = 1; day <= remainingDays; day++) {
            days.push(
                <div key={`next-${day}`} className="text-center py-2 text-slate-300 dark:text-slate-600 text-sm">
                    {day}
                </div>
            )
        }

        return days
    }

    const formatDateDisplay = () => {
        if (props.mode === "range") {
            if (props.date?.from) {
                if (props.date.to) {
                    return (
                        <>
                            {format(props.date.from, "MMM dd")}
                            <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                            {format(props.date.to, "MMM dd")}
                        </>
                    )
                }
                return format(props.date.from, "MMM dd")
            }
            return <span className="text-muted-foreground">{placeholder}</span>
        } else {
            return props.date ? format(props.date, "PPP") : <span className="text-muted-foreground">{placeholder}</span>
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all",
                            !props.date && "text-muted-foreground",
                            className
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {formatDateDisplay()}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-full max-w-md p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl z-50 rounded-2xl overflow-hidden"
                    align="center"
                >
                    {/* Preset buttons */}
                    <div className="flex gap-2 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto no-scrollbar">
                        {[
                            { id: "tomorrow", label: "Tomorrow" },
                            { id: "weekend", label: "Weekend" },
                            { id: "7days", label: "Next 7 days" },
                            { id: "month", label: "Next month" },
                        ].map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => handlePreset(preset.id)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                                    activePreset === preset.id
                                        ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Month navigation */}
                    <div className="flex items-center justify-between p-4">
                        <div className="flex gap-1">
                            <button
                                onClick={goToPreviousYear}
                                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronsLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button
                                onClick={previousMonth}
                                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>

                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h2>

                        <div className="flex gap-1">
                            <button
                                onClick={nextMonth}
                                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button
                                onClick={goToNextYear}
                                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronsRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar grid */}
                    <div className="px-4 pb-4">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayNames.map(day => (
                                <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-1">
                            {renderCalendar()}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <Button
                            onClick={clearAll}
                            variant="outline"
                            className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Clear all
                        </Button>
                        <Button
                            onClick={() => setOpen(false)}
                            className="flex-1 py-3 bg-primary text-white font-medium hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                            Apply
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
