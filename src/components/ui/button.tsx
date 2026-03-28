import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 touch-action-manipulation active:scale-[0.96]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        outline: "border border-input bg-card hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        /* Type-specific */
        care: "bg-care text-care-foreground hover:opacity-90 shadow-card-care font-bold",
        todo: "bg-todo text-todo-foreground hover:opacity-90 shadow-card-todo font-bold",
        confirm: "bg-confirm text-confirm-foreground hover:opacity-90 shadow-card-confirm font-bold",
        "care-soft": "bg-care-surface text-care-foreground border border-care/20 hover:bg-care-light",
        "todo-soft": "bg-todo-surface text-todo-foreground border border-todo/20 hover:bg-todo-light",
        "confirm-soft": "bg-confirm-surface text-confirm-foreground border border-confirm/20 hover:bg-confirm-light",
        /* Actions */
        success: "bg-success text-success-foreground hover:opacity-90 shadow-btn-success font-bold",
        "success-lg": "bg-success text-success-foreground hover:opacity-90 shadow-btn-success text-base font-bold",
        defer: "bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border",
        skip: "text-skip-foreground hover:text-foreground hover:bg-accent border border-transparent",
        "cant-do": "text-muted-foreground border border-muted hover:bg-muted/50 text-xs",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
