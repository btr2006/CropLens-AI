import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: 'primary' | 'secondary';
}

const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text, children, className, variant = 'primary', ...props }, ref) => {
  const label = text || (typeof children === 'string' ? children : "Button");

  return (
    <button
      ref={ref}
      className={cn(
        "ihb-button group relative cursor-pointer overflow-hidden rounded-full font-medium transition-all duration-300",
        variant === 'secondary' ? 'ihb-secondary' : 'ihb-primary',
        className,
      )}
      {...props}
    >
      <span className="ihb-text-default inline-flex items-center gap-2 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {label}
      </span>
      <div className="ihb-hover-content absolute inset-0 z-10 flex h-full w-full items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <span>{label}</span>
        <ArrowRight className="ihb-arrow h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </div>
      <div className="ihb-circle absolute transition-all duration-500 ease-out"></div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
