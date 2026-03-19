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
                    "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 py-2 text-sm font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green/15 disabled:pointer-events-none disabled:opacity-50 font-heading",
                    variant === "neon" &&
                    "bg-emerald-700 text-white shadow-[0_14px_28px_-20px_rgba(5,150,105,0.24)] hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_16px_32px_-22px_rgba(5,150,105,0.28)] active:scale-[0.99]",
                    variant === "outline" && "border border-white/10 bg-white/5 text-slate-300 shadow-none hover:-translate-y-0.5 hover:border-emerald-500/20 hover:bg-emerald-500/10 active:scale-[0.99]     ",
                    variant === "ghost" && "text-slate-300 hover:bg-white/10 hover:text-white   ",
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
