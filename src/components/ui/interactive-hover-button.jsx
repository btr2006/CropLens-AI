import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * InteractiveHoverButton
 * Polished Magic UI / 21st.dev style interactive button with expanding circle and sliding arrow on hover.
 */
const InteractiveHoverButton = React.forwardRef(
  ({ text, children, className = '', variant = 'primary', ...props }, ref) => {
    const label = text || children || 'Button'

    return (
      <button
        ref={ref}
        className={cn(
          'ihb-button group relative cursor-pointer overflow-hidden rounded-full font-medium transition-all duration-300',
          variant === 'secondary' ? 'ihb-secondary' : 'ihb-primary',
          className
        )}
        {...props}
      >
        {/* Default label sliding out */}
        <span className="ihb-text-default inline-flex items-center gap-2 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {label}
        </span>

        {/* Hover label sliding in with ArrowRight */}
        <div className="ihb-hover-content absolute inset-0 z-10 flex h-full w-full items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <span>{label}</span>
          <ArrowRight className="ihb-arrow h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>

        {/* Expanding circle background on hover */}
        <div className="ihb-circle absolute transition-all duration-500 ease-out" />
      </button>
    )
  }
)

InteractiveHoverButton.displayName = 'InteractiveHoverButton'

export { InteractiveHoverButton }
