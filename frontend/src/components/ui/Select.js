import React, { useState, useRef, useEffect } from 'react';

const Select = ({ 
  children, 
  value, 
  onValueChange, 
  placeholder = "Select an option",
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const childrenArray = React.Children.toArray(children);
  const selectedOption = childrenArray.find(
    child => child.props && child.props.value === value
  );

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.props.children : placeholder}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {childrenArray.map((child, index) => (
            <div
              key={child.props ? child.props.value : index}
              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer text-gray-700 first:rounded-t-lg last:rounded-b-lg"
              onClick={() => {
                if (child.props && child.props.value) {
                  onValueChange(child.props.value);
                  setIsOpen(false);
                }
              }}
            >
              {child.props ? child.props.children : child}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SelectItem = ({ children, value }) => {
  return React.createElement('div', { value, children });
};

export { Select, SelectItem };
