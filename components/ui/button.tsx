import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-[-0.01em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-emerald-500/15 aria-invalid:ring-destructive/20  aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-emerald-600 text-white shadow-[0_14px_30px_-22px_rgba(16,185,129,0.28)] hover:-translate-y-0.5 hover:bg-emerald-500",
        destructive:
          "bg-destructive text-white shadow-sm hover:-translate-y-0.5 hover:bg-destructive/90 focus-visible:ring-destructive/20  ",
        outline:
          "border border-border/80 bg-card/95 text-foreground shadow-[0_10px_22px_-20px_rgba(15,23,42,0.14)] hover:-translate-y-0.5 hover:border-emerald-300/26 hover:bg-white/[0.08]    ",
        secondary:
          "bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary/80",
        ghost:
          "text-slate-200 hover:bg-accent/85 hover:text-white   ",
        link: "rounded-none px-0 text-emerald-200 underline-offset-4 hover:text-emerald-100 hover:underline ",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        xs: "h-7 gap-1 rounded-full px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-full gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-11 rounded-full px-6 has-[>svg]:px-4",
        icon: "size-10",
        "icon-xs": "size-7 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-full",
        "icon-lg": "size-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
