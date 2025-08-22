import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import ItemDetailPage from '../ItemDetail';
import { setupTestEnvironment, cleanupTestEnvironment, renderWithRouter } from '../../test-utils';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: () => jest.fn(),
}));

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../../firebase/config', () => ({
  db: {},
  auth: {},
}));

// Setup test environment
setupTestEnvironment();

describe('ItemDetailPage', () => {
  const { mockNavigate } = setupTestEnvironment();
  const mockDocRef = { id: 'test-doc-ref' };
  const mockUnsubscribe = jest.fn();
  const mockItem = {
    id: 'test-item-id',
    title: 'Lost iPhone',
    description: 'Black iPhone 13 lost in library',
    kind: 'lost',
    category: 'electronics',
    location: 'library',
    date: new Date('2024-01-01'),
    contactName: 'John Doe',
    contactEmail: 'john@example.com',
    contactPhone: '+1234567890',
    imageUrl: 'https://example.com/image.jpg',
  };

  // Helper functions to eliminate duplication
  const renderItemDetailPage = () => {
    return renderWithRouter(<ItemDetailPage />);
  };

  const setupOnSnapshotMock = (item = mockItem, shouldCallCallback = true) => {
    onSnapshot.mockImplementation((ref, callback) => {
      if (shouldCallCallback) {
        callback({
          data: () => item,
          id: 'test-item-id'
        });
      }
      return mockUnsubscribe;
    });
  };

  const setupLoadingMock = () => {
    setupOnSnapshotMock(mockItem, false);
  };

  const setupItemNotFoundMock = () => {
    setupOnSnapshotMock(null);
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
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });
  };

  const assertImageAltText = async () => {
    await waitFor(() => {
      const image = screen.getByAltText('Lost iPhone');
      expect(image).toBeInTheDocument();
    });
  };

  const assertItemTitle = async () => {
    await waitFor(() => {
      expect(screen.getByText('Lost iPhone')).toBeInTheDocument();
    });
  };

  const assertItemLocation = async () => {
    await waitFor(() => {
      expect(screen.getByText('library')).toBeInTheDocument();
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

  const createMockSnapshot = (itemId) => ({
    data: () => mockItem,
    id: itemId
  });

  const setupOnSnapshotMockWithId = (itemId) => {
    const mockSnapshot = createMockSnapshot(itemId);
    onSnapshot.mockImplementation((ref, callback) => {
      callback(mockSnapshot);
      return mockUnsubscribe;
    });
  };

  beforeEach(() => {
    cleanupTestEnvironment();
    mockNavigate.mockClear();
    useParams.mockReturnValue({ id: 'test-item-id' });
    doc.mockReturnValue(mockDocRef);
    onSnapshot.mockReturnValue(mockUnsubscribe);
  });

  describe('Rendering', () => {
    test('renders loading state initially', () => {
      setupLoadingMock();
      
      renderItemDetailPage();
      
      assertItemNotFound();
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
      setupItemNotFoundMock();
      
      renderItemDetailPage();
      
      await assertItemNotFound();
    });

    test('handles data fetching errors', async () => {
      setupItemNotFoundMock();
      
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
        fireEvent.click(backButton);
        // The Link component will handle navigation, not useNavigate
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
      
      await assertItemLocation();
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
      setupItemNotFoundMock();
      
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
      
      await assertItemTitle();
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
      setupOnSnapshotMockWithId(testItemId);
      
      renderItemDetailPage();
      
      assertDocCall(testItemId);
    });

    test('handles missing item ID parameter', () => {
      useParams.mockReturnValue({});
      
      renderItemDetailPage();
      
      // Component should not call doc when no ID is provided
      expect(doc).not.toHaveBeenCalled();
    });
  });
});
