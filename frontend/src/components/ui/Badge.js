import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default', 
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2';
  
  const variantClasses = {
    default: 'border-transparent bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'text-gray-700 border-gray-300',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Badge;
