import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  cn(
    "flex w-full rounded-xl border bg-background/50 text-base",
    "transition-all duration-200 ease-out",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-muted-foreground/60",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "backdrop-blur-sm"
  ),
  {
    variants: {
      variant: {
        default: cn(
          "border-input/50 shadow-sm",
          "hover:border-input hover:shadow",
          "focus-visible:border-primary/50 focus-visible:bg-background focus-visible:shadow-md focus-visible:shadow-primary/5"
        ),
        filled: cn(
          "border-transparent bg-muted/50",
          "hover:bg-muted/70",
          "focus-visible:bg-background focus-visible:border-primary/30 focus-visible:shadow-md"
        ),
        ghost: cn(
          "border-transparent bg-transparent",
          "hover:bg-muted/30",
          "focus-visible:bg-background/50 focus-visible:border-border"
        ),
        underline: cn(
          "rounded-none border-0 border-b-2 border-input/50 bg-transparent px-0",
          "hover:border-input",
          "focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
        ),
        gradient: cn(
          "border-transparent bg-gradient-to-r from-muted/50 to-muted/30",
          "hover:from-muted/70 hover:to-muted/50",
          "focus-visible:from-background focus-visible:to-background focus-visible:border-primary/30"
        ),
      },
      inputSize: {
        sm: "h-9 px-3 text-sm",
        default: "h-11 px-4 py-2",
        lg: "h-12 px-5 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, icon, iconPosition = "left", error, ...props }, ref) => {
    const hasIcon = !!icon
    
    return (
      <div className="relative w-full group">
        {hasIcon && iconPosition === "left" && (
          <div className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2",
            "text-muted-foreground/60 transition-colors duration-200",
            "group-focus-within:text-primary pointer-events-none"
          )}>
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            inputVariants({ variant, inputSize }),
            hasIcon && iconPosition === "left" && "pl-10",
            hasIcon && iconPosition === "right" && "pr-10",
            error && "border-destructive/50 focus-visible:ring-destructive/20 focus-visible:border-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {hasIcon && iconPosition === "right" && (
          <div className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            "text-muted-foreground/60 transition-colors duration-200",
            "group-focus-within:text-primary pointer-events-none"
          )}>
            {icon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
