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
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-cyan disabled:pointer-events-none disabled:opacity-50 h-10 px-6 py-2 uppercase tracking-wider font-heading",
                    variant === "neon" &&
                    "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_10px_rgba(0,240,255,0.5)] hover:shadow-[0_0_20px_rgba(0,240,255,0.8)] hover:scale-105 active:scale-95",
                    variant === "outline" && "border border-neon-cyan text-neon-cyan neon-text-cyan hover:bg-neon-cyan/10",
                    variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
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
