import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  cn(
    "text-sm font-medium leading-none",
    "transition-colors duration-200",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  ),
  {
    variants: {
      variant: {
        default: "text-foreground/80",
        muted: "text-muted-foreground",
        gradient: "bg-gradient-to-r from-foreground/90 to-foreground/70 bg-clip-text text-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant }), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label, labelVariants }

interface FormItemContextValue {
  id: string
  error?: string
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

const useFormItem = () => {
  const context = React.useContext(FormItemContext)
  if (!context) {
    throw new Error("useFormItem must be used within a FormItem")
  }
  return context
}

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "floating"
}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const id = React.useId()
    return (
      <FormItemContext.Provider value={{ id }}>
        <div
          ref={ref}
          className={cn(
            "space-y-2",
            variant === "floating" && "relative",
            className
          )}
          {...props}
        />
      </FormItemContext.Provider>
    )
  }
)
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean
  }
>(({ className, children, required, ...props }, ref) => {
  const { error } = useFormItem()
  
  return (
    <Label
      ref={ref}
      className={cn(
        error && "text-destructive",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { id, error } = useFormItem()
  
  return (
    <Slot
      ref={ref}
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        "text-sm text-muted-foreground/70",
        className
      )}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { error?: string }
>(({ className, children, error, ...props }, ref) => {
  const { id } = useFormItem()
  const body = error || children
  
  if (!body) {
    return null
  }
  
  return (
    <p
      ref={ref}
      id={`${id}-error`}
      className={cn(
        "text-sm font-medium text-destructive",
        "animate-in fade-in-0 slide-in-from-top-1 duration-200",
        className
      )}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

const Form = React.forwardRef<
  HTMLFormElement,
  React.HTMLAttributes<HTMLFormElement> & {
    variant?: "default" | "card" | "glass"
  }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <form
      ref={ref}
      className={cn(
        "space-y-6",
        variant === "card" && "bg-card p-6 rounded-2xl border shadow-lg",
        variant === "glass" && cn(
          "bg-card/50 backdrop-blur-xl p-6 rounded-2xl",
          "border border-border/30 shadow-xl shadow-primary/5",
          "supports-[backdrop-filter]:bg-card/30"
        ),
        className
      )}
      {...props}
    />
  )
})
Form.displayName = "Form"

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormItem,
}
