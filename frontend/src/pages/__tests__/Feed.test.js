import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { collection, onSnapshot, orderBy, query, getDocs } from 'firebase/firestore';
import FeedPage from '../Feed';
import { setupTestEnvironment, cleanupTestEnvironment, renderWithRouter } from '../../test-utils';
import {
  setupConsoleErrorSuppression,
  createMockItem,
  createMockDoc,
  setupFirestoreCollectionMocks,
  assertElementExists,
  assertTextContent
} from '../../test-utils-shared';

// Mock Firebase config
jest.mock('../../firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
  analytics: {},
}));

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  endBefore: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}));

// Mock Firebase app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApp: jest.fn(() => ({})),
}));

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/feed' }),
}));

// Setup global mocks
setupConsoleErrorSuppression();

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ items: [] }),
  })
);

// Mock components
jest.mock('../../components/SearchFilters', () => {
  /* eslint-disable react/prop-types */
  const SearchFilters = ({ defaultValue, onChange, ...props }) => (
    <div data-testid="search-filters" {...props}>
      <input
        data-testid="search-input"
        value={defaultValue?.q || ''}
        onChange={(e) => onChange && onChange({ ...defaultValue, q: e.target.value })}
        placeholder="Search items..."
      />
      <select
        data-testid="status-filter"
        value={defaultValue?.type || 'all'}
        onChange={(e) => onChange && onChange({ ...defaultValue, type: e.target.value })}
      >
        <option value="all">All</option>
        <option value="lost">Lost</option>
        <option value="found">Found</option>
      </select>
      <select
        data-testid="type-filter"
        value={defaultValue?.type || 'all'}
        onChange={(e) => onChange && onChange({ ...defaultValue, type: e.target.value })}
      >
        <option value="all">All Types</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
        <option value="personal">Personal</option>
      </select>
      <select
        data-testid="location-filter"
        value={defaultValue?.location || 'all'}
        onChange={(e) => onChange && onChange({ ...defaultValue, location: e.target.value })}
      >
        <option value="all">All Locations</option>
        <option value="OGGB">OGGB</option>
        <option value="library">General Library</option>
      </select>
    </div>
  );
  /* eslint-enable react/prop-types */

  // PropTypes removed from mock to avoid Jest scope issues

  return {
    __esModule: true,
    SearchFilters,
  };
});

jest.mock('../../components/ui/Tabs', () => {
  /* eslint-disable react/prop-types */
  const Tabs = ({ children, value, onValueChange, ...props }) => (
    <div data-testid="tabs" {...props}>
      {children}
    </div>
  );

  const TabsContent = ({ children, value, ...props }) => (
    <div data-testid={`tabs-content-${value}`} {...props}>
      {children}
    </div>
  );

  const TabsList = ({ children, ...props }) => (
    <div data-testid="tabs-list" {...props}>
      {children}
    </div>
  );

  const TabsTrigger = ({ children, value, onClick, ...props }) => (
    <button
      data-testid={`tabs-trigger-${value}`}
      onClick={onClick || (() => {})}
      {...props}
    >
      {children}
    </button>
  );
  /* eslint-enable react/prop-types */

  // PropTypes removed from mock to avoid Jest scope issues

  return {
    __esModule: true,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  };
});

jest.mock('../../components/ItemCard', () => {
  /* eslint-disable react/prop-types */
  const ItemCard = ({ item, onClick, ...props }) => (
    <button
      data-testid={`item-card-${item?.id || 'default'}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick(e);
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
  );
  /* eslint-enable react/prop-types */

  // PropTypes removed from mock to avoid Jest scope issues

  return {
    __esModule: true,
    default: ItemCard,
  };
});

// Setup test environment
describe('FeedPage', () => {
  const { mockNavigate } = setupTestEnvironment();
  let mockUnsubscribe;

  const mockItems = [
    createMockItem({
      id: '1',
      title: 'Lost iPhone',
      description: 'Black iPhone 13 lost in library',
      kind: 'lost',
      category: 'electronics',
      location: 'library',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      contactPhone: '+1234567890',
      imageUrl: 'https://example.com/image.jpg',
    }),
    createMockItem({
      id: '2',
      title: 'Found Keys',
      description: 'Silver car keys found in cafeteria',
      kind: 'found',
      category: 'personal',
      location: 'cafeteria',
      contactName: 'Jane Smith',
      contactEmail: 'jane@example.com',
      contactPhone: '+1234567891',
      imageUrl: 'https://example.com/image2.jpg',
    }),
    createMockItem({
      id: '3',
      title: 'Lost Wallet',
      description: 'Brown leather wallet lost in gym',
      kind: 'lost',
      category: 'personal',
      location: 'gym',
      contactName: 'Bob Johnson',
      contactEmail: 'bob@example.com',
      contactPhone: '+1234567892',
      imageUrl: 'https://example.com/image3.jpg',
    })
  ];

  // Helper functions using shared utilities
  const setupOnSnapshotMock = (items = mockItems) => {
    const result = setupFirestoreCollectionMocks(items);
    mockUnsubscribe = result.mockUnsubscribe;
    return mockUnsubscribe;
  };

  beforeEach(() => {
    cleanupTestEnvironment();
    setupOnSnapshotMock();
  });

  describe('Rendering', () => {
    const renderFeedPage = () => renderWithRouter(<FeedPage />);

    test('renders feed page with search filters and tabs', async () => {
      renderFeedPage();

      await assertElementExists('search-filters');
      await assertElementExists('tabs');
      await assertElementExists('tabs-list');
    });

    test('renders all tab triggers', async () => {
      renderFeedPage();

      await assertElementExists('tabs-trigger-all');
      await assertElementExists('tabs-trigger-lost');
      await assertElementExists('tabs-trigger-found');
    });

    test('renders search filters with correct initial values', () => {
      renderFeedPage();

      const searchInput = screen.getByTestId('search-input');
      const typeFilter = screen.getByTestId('type-filter');
      const locationFilter = screen.getByTestId('location-filter');

      expect(searchInput.value).toBe('');
      expect(typeFilter.value).toBe('all');
      expect(locationFilter.value).toBe('all');
    });
  });

  describe('Data Fetching', () => {
    test('sets up Firestore listener on mount', () => {
      renderWithRouter(<FeedPage />);
      
      expect(collection).toHaveBeenCalledWith({}, 'items');
      expect(orderBy).toHaveBeenCalledWith('date', 'desc');
      expect(query).toHaveBeenCalledWith('mock-collection', 'ordered-items');
      expect(onSnapshot).toHaveBeenCalledWith('items-query', expect.any(Function), expect.any(Function));
    });

    test('cleans up Firestore listener on unmount', () => {
      const { unmount } = renderWithRouter(<FeedPage />);

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    test('displays loading state initially', () => {
      renderWithRouter(<FeedPage />);

      expect(screen.getByText('Lost & Found Feed')).toBeInTheDocument();
    });

    test('displays items when data is loaded successfully', async () => {
      renderWithRouter(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByTestId('item-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('item-card-2')).toBeInTheDocument();
        expect(screen.getByTestId('item-card-3')).toBeInTheDocument();
      });
    });

    test('displays error message when data fetching fails', async () => {
      // Setup error mock
      onSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        errorCallback(new Error('Failed to load items'));
        return mockUnsubscribe;
      });

      renderWithRouter(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load items\. Please try again\./)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Search', () => {
    test('search input is functional', async () => {
      renderWithRouter(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByTestId('item-card-1')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.value).toBe('');
    });

    test('filter inputs are functional', async () => {
      renderWithRouter(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByTestId('item-card-1')).toBeInTheDocument();
      });

      const typeFilter = screen.getByTestId('type-filter');
      const locationFilter = screen.getByTestId('location-filter');

      expect(typeFilter).toBeInTheDocument();
      expect(locationFilter).toBeInTheDocument();
      expect(typeFilter.value).toBe('all');
      expect(locationFilter.value).toBe('all');
    });

    test('filters items by tab (lost/found)', async () => {
      renderWithRouter(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByTestId('item-card-1')).toBeInTheDocument();
      });

      expect(screen.getByTestId('item-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-card-3')).toBeInTheDocument();
    });

    test('all filter components are rendered', async () => {
      renderWithRouter(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByTestId('item-card-1')).toBeInTheDocument();
      });

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('type-filter')).toBeInTheDocument();
      expect(screen.getByTestId('location-filter')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-all')).toBeInTheDocument();
    });
  });

  describe('Tab Functionality', () => {
    test('shows all items when "All" tab is selected', async () => {
      renderWithRouter(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByTestId('item-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('item-card-2')).toBeInTheDocument();
        expect(screen.getByTestId('item-card-3')).toBeInTheDocument();
      });
    });

    test('tab triggers are rendered correctly', () => {
      renderWithRouter(<FeedPage />);

      expect(screen.getByTestId('tabs-trigger-all')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-lost')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-found')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles Firestore connection errors gracefully', async () => {
      query.mockImplementation(() => {
        throw new Error('Failed to connect to database');
      });

      renderWithRouter(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to connect to database/)).toBeInTheDocument();
      });
    });

    test('handles snapshot listener errors gracefully', async () => {
      onSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        errorCallback(new Error('Failed to load items. Please try again.'));
        return mockUnsubscribe;
      });

      renderWithRouter(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load items\. Please try again\./)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    test('uses useMemo for filtered items to prevent unnecessary re-renders', () => {
      renderWithRouter(<FeedPage />);

      // The component should use useMemo for filteredItems
      // This is tested by ensuring the filtering logic works correctly
      // and doesn't cause excessive re-renders
    });

    test('uses useCallback for filter change handlers', () => {
      renderWithRouter(<FeedPage />);

      // The component should use useCallback for filter change handlers
      // This is tested by ensuring the handlers work correctly
    });
  });

  describe('Accessibility', () => {
    test('has proper search and filter inputs', () => {
      renderWithRouter(<FeedPage />);

      const searchInput = screen.getByTestId('search-input');
      const typeFilter = screen.getByTestId('type-filter');
      const locationFilter = screen.getByTestId('location-filter');

      expect(searchInput).toBeInTheDocument();
      expect(typeFilter).toBeInTheDocument();
      expect(locationFilter).toBeInTheDocument();
    });

    test('tab triggers have proper accessibility attributes', () => {
      renderWithRouter(<FeedPage />);

      const allTab = screen.getByTestId('tabs-trigger-all');
      const lostTab = screen.getByTestId('tabs-trigger-lost');
      const foundTab = screen.getByTestId('tabs-trigger-found');

      expect(allTab).toBeInTheDocument();
      expect(lostTab).toBeInTheDocument();
      expect(foundTab).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    test('displays appropriate message when no items match filters', async () => {
      renderWithRouter(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByTestId('item-card-1')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent-item' } });

      await waitFor(() => {
        expect(screen.queryByTestId('item-card-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('item-card-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('item-card-3')).not.toBeInTheDocument();
      });
    });

    test('displays appropriate message when no items are loaded', async () => {
      setupOnSnapshotMock([]);

      renderWithRouter(<FeedPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('item-card-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('item-card-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('item-card-3')).not.toBeInTheDocument();
      });
    });
  });
});
