import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium",
    "ring-offset-background transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]"
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground",
          "shadow-md shadow-primary/20",
          "hover:shadow-lg hover:shadow-primary/30 hover:from-primary/95 hover:to-primary/85",
          "btn-shine"
        ),
        destructive: cn(
          "bg-gradient-to-b from-destructive to-destructive/90 text-destructive-foreground",
          "shadow-md shadow-destructive/20",
          "hover:shadow-lg hover:shadow-destructive/30"
        ),
        outline: cn(
          "border border-input/50 bg-background/50 backdrop-blur-sm",
          "hover:bg-accent hover:border-accent",
          "shadow-sm hover:shadow"
        ),
        secondary: cn(
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80",
          "shadow-sm"
        ),
        ghost: cn(
          "hover:bg-accent/50 hover:text-accent-foreground",
          "focus-visible:bg-accent/30"
        ),
        link: cn(
          "text-primary underline-offset-4",
          "hover:underline hover:text-primary/80"
        ),
        gradient: cn(
          "bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground",
          "shadow-lg shadow-primary/20",
          "hover:shadow-xl hover:shadow-primary/30",
          "btn-shine"
        ),
        glass: cn(
          "glass border border-border/30",
          "hover:bg-card/70 hover:border-border/50",
          "shadow-sm"
        ),
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
        iconSm: "h-8 w-8 rounded-lg",
        iconLg: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
