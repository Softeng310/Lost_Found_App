import React from 'react';
import PropTypes from 'prop-types';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Common test data
export const mockTestData = {
  mockAuth: {},
  mockUnsubscribe: jest.fn(),
  mockDb: {},
  mockDoc: jest.fn(),
  mockNavigate: jest.fn(),
  
  // Mock items for Feed tests
  mockItems: [
    {
      id: '1',
      title: 'Lost iPhone',
      description: 'Black iPhone 13 with cracked screen',
      status: 'lost',
      type: 'electronics',
      location: 'OGGB',
      datePosted: '2024-01-15T10:00:00Z',
      imageUrl: 'test-image-1.jpg',
    },
    {
      id: '2',
      title: 'Found Keys',
      description: 'Silver car keys with red keychain',
      status: 'found',
      type: 'personal',
      location: 'General Library',
      datePosted: '2024-01-14T15:30:00Z',
      imageUrl: 'test-image-2.jpg',
    },
    {
      id: '3',
      title: 'Lost Hoodie',
      description: 'Grey hoodie with university logo',
      status: 'lost',
      type: 'clothing',
      location: 'OGGB',
      datePosted: '2024-01-13T09:15:00Z',
      imageUrl: 'test-image-3.jpg',
    },
  ],

  // Mock announcements for Announcements tests
  mockAnnouncements: [
    {
      id: '1',
      title: 'Welcome to the Lost & Found App!',
      announcement: 'Stay tuned for important updates and campus-wide announcements here.',
      datePosted: '2025-08-15T10:00:00Z',
    },
    {
      id: '2',
      title: 'New Feature: Item Heatmap',
      announcement: 'You can now view a heatmap of lost and found items on campus. Check it out on the map page!',
      datePosted: '2025-08-17T14:30:00Z',
    },
    {
      id: '3',
      title: 'Reminder: Keep Your Valuables Safe',
      announcement: 'Please remember to keep your belongings secure and report any lost or found items promptly.',
      datePosted: '2025-08-19T09:15:00Z',
    },
  ],

  // Mock user data for Profile tests
  mockUserData: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'test-photo.jpg',
  },
};

// Mock components that can be used in tests
export const MockComponents = {
  Button: ({ children, type, onClick, ...props }) => (
    <button type={type} onClick={onClick} {...props} data-testid="button">
      {children}
    </button>
  ),
  
  SearchFilters: ({ value, onChange, ...props }) => (
    <div data-testid="search-filters" {...props}>
      <input
        data-testid="search-input"
        value={value || ''}
        onChange={onChange || (() => {})}
        placeholder="Search items..."
      />
      <select data-testid="status-filter" defaultValue="all">
        <option value="all">All</option>
        <option value="lost">Lost</option>
        <option value="found">Found</option>
      </select>
      <select data-testid="type-filter" defaultValue="all">
        <option value="all">All Types</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
        <option value="personal">Personal</option>
      </select>
    </div>
  ),
  
  Tabs: ({ children, value, onValueChange, ...props }) => (
    <div data-testid="tabs" {...props}>
      {children}
      <button
        data-testid="tab-change-simulator"
        onClick={() => onValueChange?.('found')}
      >
        Simulate Tab Change
      </button>
    </div>
  ),
  
  TabsContent: ({ children, value, ...props }) => (
    <div data-testid={`tabs-content-${value}`} {...props}>
      {children}
    </div>
  ),
  
  TabsList: ({ children, ...props }) => (
    <div data-testid="tabs-list" {...props}>
      {children}
    </div>
  ),
  
  TabsTrigger: ({ children, value, onClick, ...props }) => (
    <button
      data-testid={`tabs-trigger-${value}`}
      onClick={onClick || (() => {})}
      {...props}
    >
      {children}
    </button>
  ),
  
  ItemCard: ({ item, onClick, ...props }) => (
    <button 
      data-testid="item-card" 
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      tabIndex={0}
      aria-label={`View details for ${item?.title || 'Test Item'}`}
      {...props}
    >
      <h3>{item?.title || 'Test Item'}</h3>
      <p>{item?.description || 'Test description'}</p>
      <span data-testid="item-status">{item?.status || 'lost'}</span>
      <span data-testid="item-type">{item?.type || 'electronics'}</span>
      <span data-testid="item-location">{item?.location || 'OGGB'}</span>
    </button>
  ),
  
  ItemReportForm: () => (
    <div data-testid="item-report-form">
      <h2>Report Lost or Found Item</h2>
      <form>
        <input
          data-testid="title-input"
          type="text"
          placeholder="Item title"
          defaultValue="Test Item"
        />
        <textarea
          data-testid="description-input"
          placeholder="Item description"
          defaultValue="Test description"
        />
        <select data-testid="status-select" defaultValue="lost">
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
        <select data-testid="type-select" defaultValue="electronics">
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="personal">Personal</option>
        </select>
        <select data-testid="location-select" defaultValue="OGGB">
          <option value="OGGB">OGGB</option>
          <option value="library">General Library</option>
        </select>
        <input
          data-testid="date-input"
          type="datetime-local"
          defaultValue="2024-01-01T10:00"
        />
        <input
          data-testid="image-input"
          type="file"
          accept="image/*"
        />
        <button type="submit" data-testid="submit-button">Submit</button>
        <button type="button" data-testid="reset-button">Reset</button>
      </form>
    </div>
  ),
};

// Add PropTypes for mock components
MockComponents.Button.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.string,
  onClick: PropTypes.func,
};

MockComponents.SearchFilters.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};

MockComponents.Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.string,
  onValueChange: PropTypes.func,
};

MockComponents.TabsContent.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
};

MockComponents.TabsList.propTypes = {
  children: PropTypes.node.isRequired,
};

MockComponents.TabsTrigger.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

MockComponents.ItemCard.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    type: PropTypes.string,
    location: PropTypes.string,
  }),
  onClick: PropTypes.func,
};

// Mock icons
export const MockIcons = {
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  MapPin: () => <div data-testid="map-pin-icon">MapPin</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  User: () => <div data-testid="user-icon">User</div>,
  LogOut: () => <div data-testid="logout-icon">LogOut</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Home: () => <div data-testid="home-icon">Home</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
};

// Mock router functions
export const MockRouter = {
  mockNavigate: jest.fn(),
  useNavigate: () => MockRouter.mockNavigate,
  useParams: () => ({ id: 'test-id' }),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
};

// Add PropTypes for Link mock
MockRouter.Link.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string.isRequired,
};

// Setup function that can be called in individual test files
export const setupTestEnvironment = () => {
  return {
    mockNavigate: MockRouter.mockNavigate,
    ...mockTestData,
  };
};

// Common cleanup function
export const cleanupTestEnvironment = () => {
  jest.clearAllMocks();
};

// Wrapper component to provide router context
export const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Common test helpers
export const testHelpers = {
  // Helper to wait for async operations
  waitForElement: async (callback, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        try {
          const result = callback();
          if (result) {
            resolve(result);
            return;
          }
        } catch (error) {
          // Element not found, continue checking
          console.debug('Element not found yet:', error.message);
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for element'));
          return;
        }
        
        setTimeout(check, 10);
      };
      
      check();
    });
  },

  // Helper to simulate form submission
  submitForm: (formElement) => {
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    formElement.dispatchEvent(submitEvent);
  },

  // Helper to fill form fields
  fillFormFields: (fields) => {
    Object.entries(fields).forEach(([label, value]) => {
      const input = screen.getByLabelText(label);
      fireEvent.change(input, { target: { value } });
    });
  },
};
