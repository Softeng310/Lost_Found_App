import React from 'react';
import { cn } from '../../lib/utils';

// Flexible button component with multiple variants and sizes
// Uses forwardRef to support refs from parent components
const Button = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  children, 
  ...props 
}, ref) => {
  // Base button styles - these apply to all buttons
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  // Button appearance variants - each has its own color scheme
  const variants = {
    default: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100",
    ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200",
    secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100",
    destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm"
  };
  
  // Button size options - controls height and padding
  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md",
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

// Set display name for better debugging in React DevTools
Button.displayName = "Button";

export { Button }; 