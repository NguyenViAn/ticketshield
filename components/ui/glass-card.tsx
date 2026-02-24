import * as React from "react"
import { cn } from "@/lib/utils"

const GlassCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "glass rounded-xl p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]",
            className
        )}
        {...props}
    />
))
GlassCard.displayName = "GlassCard"

export { GlassCard }
