import React, { useState, useRef, useEffect } from 'react';

const Select = ({ 
  children, 
  value, 
  onValueChange, 
  placeholder = "Select an option",
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  const childrenArray = React.Children.toArray(children);
  const selectedOption = childrenArray.find(
    child => child.props && child.props.value === value
  );

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < childrenArray.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : childrenArray.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && childrenArray[focusedIndex]) {
          const child = childrenArray[focusedIndex];
          if (child.props && child.props.value) {
            onValueChange(child.props.value);
            setIsOpen(false);
            setFocusedIndex(-1);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleOptionClick = (child) => {
    if (child.props && child.props.value) {
      onValueChange(child.props.value);
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleOptionKeyDown = (event, child) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOptionClick(child);
    }
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="select-label"
        role="combobox"
      >
        <span 
          id="select-label"
          className={value ? 'text-gray-900' : 'text-gray-500'}
        >
          {selectedOption ? selectedOption.props.children : placeholder}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
          role="listbox"
          aria-labelledby="select-label"
        >
          {childrenArray.map((child, index) => (
            <div
              key={child.props ? child.props.value : index}
              className={`px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer text-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                focusedIndex === index ? 'bg-gray-100' : ''
              }`}
              onClick={() => handleOptionClick(child)}
              onKeyDown={(e) => handleOptionKeyDown(e, child)}
              onMouseEnter={() => setFocusedIndex(index)}
              role="option"
              aria-selected={focusedIndex === index}
              tabIndex={0}
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
