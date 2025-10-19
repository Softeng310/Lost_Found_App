import React, { createContext, useContext, useRef, useEffect, useState } from 'react';

const TabsContext = createContext();

const Tabs = ({ value, onValueChange, children, className = '' }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className = '', ...props }) => {
  const { value: currentValue } = useContext(TabsContext);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef({});

  useEffect(() => {
    const activeTab = tabsRef.current[currentValue];
    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [currentValue]);

  return (
    <div className={`relative flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 gap-1 text-gray-500 ${className}`} {...props}>
      <div
        className="absolute h-8 rounded-md border-2 border-emerald-600 transition-all duration-300 ease-in-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          top: '4px',
        }}
      />
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { tabsRef })
      )}
    </div>
  );
};

const TabsTrigger = ({ value, children, className = '', tabsRef, ...props }) => {
  const { value: currentValue, onValueChange } = useContext(TabsContext);
  const isActive = currentValue === value;
  const buttonRef = useRef(null);

  useEffect(() => {
    if (tabsRef && buttonRef.current) {
      tabsRef.current[value] = buttonRef.current;
    }
  }, [tabsRef, value]);
  
  return (
    <button
      ref={buttonRef}
      className={`relative flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? 'text-emerald-700 font-semibold' 
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, ...props }) => {
  const { value: currentValue } = useContext(TabsContext);
  
  if (currentValue !== value) {
    return null;
  }
  
  return (
    <div {...props}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
