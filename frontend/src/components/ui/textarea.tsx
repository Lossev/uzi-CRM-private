import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
  cn(
    "flex min-h-[100px] w-full rounded-xl border bg-background/50 text-base",
    "transition-all duration-200 ease-out",
    "placeholder:text-muted-foreground/60",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "backdrop-blur-sm resize-none"
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
      },
      textareaSize: {
        sm: "px-3 py-2 text-sm min-h-[80px]",
        default: "px-4 py-3 min-h-[100px]",
        lg: "px-5 py-4 text-lg min-h-[120px]",
      },
    },
    defaultVariants: {
      variant: "default",
      textareaSize: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, textareaSize, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          textareaVariants({ variant, textareaSize }),
          error && "border-destructive/50 focus-visible:ring-destructive/20 focus-visible:border-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
