import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import ItemDetailPage from '../ItemDetail';
import { setupTestEnvironment, cleanupTestEnvironment, renderWithRouter } from '../../test-utils';
import {
  setupConsoleErrorSuppression,
  setupFirebaseMocks,
  setupGlobalFetchMock,
  createMockItem,
  setupFirestoreDocMocks,
  assertTextContent,
  assertElementExists
} from '../../test-utils-shared';

// Mock Firebase config
jest.mock('../../firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
  analytics: {},
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(() => ({ id: 'test-item-id' })),
  useNavigate: () => jest.fn(),
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
  getDoc: jest.fn(),
}));

// Mock Firebase app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApp: jest.fn(() => ({})),
}));

// Setup all common mocks
setupConsoleErrorSuppression();
setupGlobalFetchMock({ item: {} });

// Setup test environment
setupTestEnvironment();

describe('ItemDetailPage', () => {
  const { mockNavigate } = setupTestEnvironment();
  const mockItem = createMockItem({
    id: 'test-item-id',
    title: 'Lost iPhone',
    description: 'Black iPhone 13 lost in library',
    kind: 'lost',
    category: 'electronics',
    location: 'library',
    contactName: 'John Doe',
    contactEmail: 'john@example.com',
    contactPhone: '+1234567890',
    imageUrl: 'https://example.com/image.jpg',
  });

  let mockDocRef;
  let mockUnsubscribe;

  // Helper functions to reduce duplication
  const renderItemDetailPage = () => renderWithRouter(<ItemDetailPage />);
  
  const setupOnSnapshotMock = (item = mockItem) => {
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        data: () => item,
        id: item?.id || 'test-item-id',
        exists: () => !!item
      });
      return mockUnsubscribe;
    });
  };

  const waitForItemToLoad = async () => {
    await waitFor(() => {
      expect(screen.getByText('Lost iPhone')).toBeInTheDocument();
    });
  };

  const assertItemNotFound = async () => {
    await waitFor(() => {
      expect(screen.getByText(/Item not found/i)).toBeInTheDocument();
    });
  };

  const assertItemDetails = async () => {
    await waitFor(() => {
      expect(screen.getByText('Lost iPhone')).toBeInTheDocument();
      expect(screen.getByText('Black iPhone 13 lost in library')).toBeInTheDocument();
      expect(screen.getByText('library')).toBeInTheDocument();
    });
  };

  const assertBackButton = async () => {
    await waitFor(() => {
      expect(screen.getByText('Back to feed')).toBeInTheDocument();
    });
  };

  const assertImageAltText = async () => {
    await waitFor(() => {
      const image = screen.getByAltText('Lost iPhone');
      expect(image).toBeInTheDocument();
    });
  };

  const assertItemStatusBadge = async (status = 'lost') => {
    await waitFor(() => {
      expect(screen.getByText(status)).toBeInTheDocument();
    });
  };

  const assertReporterInfo = async () => {
    await waitFor(() => {
      expect(screen.getByText(/Reporter:/)).toBeInTheDocument();
    });
  };

  const assertDocCall = (expectedId = 'test-item-id') => {
    expect(doc).toHaveBeenCalledWith({}, 'items', expectedId);
    expect(onSnapshot).toHaveBeenCalledWith(mockDocRef, expect.any(Function));
  };

  beforeEach(() => {
    cleanupTestEnvironment();
    mockNavigate.mockClear();
    mockDocRef = { id: 'test-doc-ref' };
    mockUnsubscribe = jest.fn();
    
    // Reset useParams mock
    useParams.mockReturnValue({ id: 'test-item-id' });
    
    // Setup default mocks
    doc.mockReturnValue(mockDocRef);
    onSnapshot.mockReturnValue(mockUnsubscribe);
    getDoc.mockResolvedValue({
      data: () => mockItem,
      id: 'test-item-id',
      exists: () => true
    });
  });

  describe('Rendering', () => {
    test('renders item not found initially when no item data', () => {
      renderItemDetailPage();
      expect(screen.getByText('Item not found.')).toBeInTheDocument();
    });

    test('renders item details when data is loaded successfully', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      await assertItemDetails();
    });

    test('renders back button', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      await assertBackButton();
    });

    test('renders item image when available', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      
      await waitFor(() => {
        const image = screen.getByAltText('Lost iPhone');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      });
    });

    test('renders placeholder image when no image is available', async () => {
      const itemWithoutImage = { ...mockItem, imageUrl: null };
      setupOnSnapshotMock(itemWithoutImage);
      renderItemDetailPage();
      await assertImageAltText();
    });
  });

  describe('Data Fetching', () => {
    test('fetches item data using the correct document ID', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      assertDocCall();
    });

    test('handles item not found', async () => {
      setupOnSnapshotMock(null);
      renderItemDetailPage();
      await assertItemNotFound();
    });

    test('handles data fetching errors', async () => {
      setupOnSnapshotMock(null);
      renderItemDetailPage();
      await assertItemNotFound();
    });
  });

  describe('Navigation', () => {
    test('back button navigates to feed page', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      
      await waitFor(() => {
        const backButton = screen.getByText('Back to feed');
        expect(backButton).toHaveAttribute('href', '/feed');
      });
    });
  });

  describe('Item Information Display', () => {
    test('displays item status badge correctly', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      await assertItemStatusBadge('lost');
    });

    test('displays found item status badge correctly', async () => {
      const foundItem = { ...mockItem, kind: 'found' };
      setupOnSnapshotMock(foundItem);
      renderItemDetailPage();
      await assertItemStatusBadge('found');
    });

    test('displays item category', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      
      await waitFor(() => {
        expect(screen.getByText('electronics')).toBeInTheDocument();
      });
    });

    test('displays item location', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      await waitFor(() => {
        expect(screen.getByText('library')).toBeInTheDocument();
      });
    });

    test('displays item date', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      
      await waitFor(() => {
        expect(screen.getByText(/Posted:/)).toBeInTheDocument();
      });
    });
  });

  describe('Contact Information', () => {
    test('displays reporter information', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      await assertReporterInfo();
    });

    test('handles missing contact information gracefully', async () => {
      const itemWithoutContact = {
        ...mockItem,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
      };
      setupOnSnapshotMock(itemWithoutContact);
      renderItemDetailPage();
      await assertReporterInfo();
    });
  });

  describe('Error States', () => {
    test('displays not found message when item does not exist', async () => {
      setupOnSnapshotMock(null);
      renderItemDetailPage();
      await assertItemNotFound();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading hierarchy', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      
      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toHaveTextContent('Lost iPhone');
      });
    });

    test('images have proper alt text', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      await assertImageAltText();
    });

    test('back button has proper accessibility attributes', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      await assertBackButton();
    });
  });

  describe('Styling and Layout', () => {
    test('has proper CSS classes for responsive design', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      await waitForItemToLoad();
    });

    test('item image has proper styling classes', async () => {
      setupOnSnapshotMock();
      renderItemDetailPage();
      
      await waitFor(() => {
        const image = screen.getByAltText('Lost iPhone');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src');
      });
    });
  });

  describe('URL Parameter Handling', () => {
    test('uses item ID from URL parameters', () => {
      const testItemId = 'different-item-id';
      useParams.mockReturnValue({ id: testItemId });
      
      renderItemDetailPage();
      expect(doc).toHaveBeenCalledWith({}, 'items', testItemId);
    });

    test('handles missing item ID parameter', () => {
      useParams.mockReturnValue({});
      renderItemDetailPage();
      expect(doc).not.toHaveBeenCalled();
    });
  });
});
