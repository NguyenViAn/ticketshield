import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const NeonInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-all ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/12 focus-visible:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50      ",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
NeonInput.displayName = "Input"

export { NeonInput }
