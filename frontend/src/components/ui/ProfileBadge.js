import React from 'react'

export function ProfileBadge({ children, variant = 'default', className = "" }) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
  let variantClasses = "bg-gray-100 text-gray-800";
  if (variant === 'outline') variantClasses = "border border-gray-200 text-gray-700";
  if (variant === 'success') variantClasses = "bg-green-100 text-green-800";
  if (variant === 'danger') variantClasses = "bg-red-100 text-red-800";
  
  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  )
}
