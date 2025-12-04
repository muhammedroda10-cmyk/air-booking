import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, icon, ...props }, ref) => {
        return (
            <div className="relative w-full">
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer",
                        label && "pt-6 pb-2 h-14", // Adjust height for floating label
                        icon && "pl-10", // Adjust padding for icon
                        className
                    )}
                    ref={ref}
                    placeholder={label ? " " : props.placeholder} // Clear placeholder for floating label effect
                    {...props}
                />
                {label && (
                    <label
                        className={cn(
                            "absolute left-3 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-muted-foreground duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 cursor-text",
                            icon && "left-10"
                        )}
                    >
                        {label}
                    </label>
                )}
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        {icon}
                    </div>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
