import React from 'react'

export function ProfileBadge({ children, variant = 'default', className = "" }) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
  const variantClasses = variant === 'outline' 
    ? "border border-gray-200 text-gray-700" 
    : "bg-gray-100 text-gray-800"
  
  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  )
}
