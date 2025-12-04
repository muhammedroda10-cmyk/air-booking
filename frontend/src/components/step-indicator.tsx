import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepIndicatorProps {
    currentStep: number
    steps: string[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between relative">
                {/* Progress Bar Background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10" />

                {/* Active Progress Bar */}
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-300"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep
                    const isActive = index === currentStep

                    return (
                        <div key={index} className="flex flex-col items-center gap-2 bg-background px-2">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300",
                                    isCompleted ? "bg-primary border-primary text-white" :
                                        isActive ? "bg-white border-primary text-primary" :
                                            "bg-white border-slate-300 text-slate-400"
                                )}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-medium transition-colors duration-300",
                                    isActive || isCompleted ? "text-primary" : "text-slate-400"
                                )}
                            >
                                {step}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
