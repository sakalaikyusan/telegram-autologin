"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = "default",
  size = "default",
  ...props
}, ref) => {
  return <button className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", {
    "bg-primary text-primary-foreground hover:bg-primary hover:bg-opacity-90": variant === "default",
    "bg-destructive text-destructive-foreground hover:bg-destructive hover:bg-opacity-90": variant === "destructive",
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
    "bg-secondary text-secondary-foreground hover:bg-secondary hover:bg-opacity-80": variant === "secondary",
    "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
    "text-primary underline-offset-4 hover:underline": variant === "link",
    "h-10 px-4 py-2": size === "default",
    "h-9 rounded-md px-3": size === "sm",
    "h-11 rounded-md px-8": size === "lg",
    "h-10 w-10": size === "icon"
  }, className)} ref={ref} {...props} data-unique-id="df373ac8-0770-4e2d-8813-93a62db72325" data-file-name="components/ui/button.tsx" />;
});
Button.displayName = "Button";
export { Button };