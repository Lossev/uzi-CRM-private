import * as React from "react"
import { cn } from "@/lib/utils"

interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: boolean
}

const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(({ className, label, type = "text", error, id, value, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasValue, setHasValue] = React.useState(!!value)
  const generatedId = React.useId()
  const inputId = id || generatedId
  
  const isActive = isFocused || hasValue
  
  React.useEffect(() => {
    setHasValue(!!value || !!props.defaultValue)
  }, [value, props.defaultValue])
  
  return (
    <div className="relative w-full group">
      <input
        type={type}
        id={inputId}
        value={value}
        ref={ref}
        className={cn(
          "peer w-full h-14 px-4 pt-5 pb-2 rounded-xl",
          "border border-input/50 bg-background/50 backdrop-blur-sm",
          "text-base text-foreground",
          "transition-all duration-200 ease-out",
          "placeholder:text-transparent",
          "hover:border-input hover:bg-accent/20",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive/50 focus:ring-destructive/20 focus:border-destructive",
          className
        )}
        placeholder={label}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => {
          setHasValue(!!e.target.value)
          props.onChange?.(e)
        }}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "absolute left-4 transition-all duration-200 ease-out",
          "pointer-events-none select-none",
          "text-muted-foreground/70",
          isActive
            ? "top-2 text-xs font-medium text-primary/80"
            : "top-1/2 -translate-y-1/2 text-base",
          isFocused && "text-primary",
          error && "text-destructive"
        )}
      >
        {label}
      </label>
      <div
        className={cn(
          "absolute inset-0 rounded-xl pointer-events-none",
          "transition-all duration-200",
          "ring-0 ring-primary/10",
          isFocused && "ring-2 ring-primary/5"
        )}
      />
    </div>
  )
})
FloatingLabelInput.displayName = "FloatingLabelInput"

export { FloatingLabelInput }
