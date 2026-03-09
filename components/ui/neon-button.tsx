import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
    variant?: "neon" | "outline" | "ghost"
}

const NeonButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "neon", asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(
                    "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 py-2 text-sm font-semibold uppercase tracking-[0.14em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green/15 disabled:pointer-events-none disabled:opacity-50 font-heading",
                    variant === "neon" &&
                    "bg-gradient-to-r from-brand-green via-emerald-400 to-brand-blue text-white shadow-[0_20px_50px_-28px_rgba(14,165,233,0.35)] hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-28px_rgba(34,197,94,0.35)] active:scale-[0.99]",
                    variant === "outline" && "border-2 border-brand-green/60 bg-white text-brand-green shadow-[0_12px_30px_-24px_rgba(15,23,42,0.2)] hover:-translate-y-0.5 hover:bg-brand-green/10 active:scale-[0.99]",
                    variant === "ghost" && "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
NeonButton.displayName = "NeonButton"

export { NeonButton }
