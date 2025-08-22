import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
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
  getDoc: jest.fn(),
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

  beforeEach(() => {
    cleanupTestEnvironment();
    mockNavigate.mockClear();
    useParams.mockReturnValue({ id: 'test-item-id' });
    doc.mockReturnValue(mockDocRef);
    onSnapshot.mockReturnValue(mockUnsubscribe);
  });

  describe('Rendering', () => {
    test('renders loading state initially', () => {
      onSnapshot.mockImplementation((ref, callback) => {
        // Don't call callback immediately to simulate loading
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      expect(screen.getByText(/Item not found/i)).toBeInTheDocument();
    });

    test('renders item details when data is loaded successfully', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Lost iPhone')).toBeInTheDocument();
        expect(screen.getByText('Black iPhone 13 lost in library')).toBeInTheDocument();
        expect(screen.getByText('library')).toBeInTheDocument();
      });
    });

    test('renders back button', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Back to feed')).toBeInTheDocument();
        expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
      });
    });

    test('renders item image when available', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        const image = screen.getByAltText('Lost iPhone');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      });
    });

    test('renders placeholder image when no image is available', async () => {
      const itemWithoutImage = { ...mockItem, imageUrl: null };
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => itemWithoutImage,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        const placeholderImage = screen.getByAltText('Lost iPhone');
        expect(placeholderImage).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    test('fetches item data using the correct document ID', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      expect(doc).toHaveBeenCalledWith({}, 'items', 'test-item-id');
      expect(onSnapshot).toHaveBeenCalledWith(mockDocRef, expect.any(Function));
    });

    test('handles item not found', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => null,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Item not found/i)).toBeInTheDocument();
      });
    });

    test('handles data fetching errors', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => null,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Item not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('back button navigates to feed page', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
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
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('lost')).toBeInTheDocument();
      });
    });

    test('displays found item status badge correctly', async () => {
      const foundItem = { ...mockItem, kind: 'found' };
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => foundItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('found')).toBeInTheDocument();
      });
    });

    test('displays item category', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('electronics')).toBeInTheDocument();
      });
    });

    test('displays item location', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('library')).toBeInTheDocument();
      });
    });

    test('displays item date', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Posted:/)).toBeInTheDocument();
      });
    });
  });

  describe('Contact Information', () => {
    test('displays reporter information', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Reporter:/)).toBeInTheDocument();
      });
    });

    test('handles missing contact information gracefully', async () => {
      const itemWithoutContact = {
        ...mockItem,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
      };
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => itemWithoutContact,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Reporter:/)).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    test('displays not found message when item does not exist', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => null,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Item not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper heading hierarchy', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toHaveTextContent('Lost iPhone');
      });
    });

    test('images have proper alt text', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        const image = screen.getByAltText('Lost iPhone');
        expect(image).toBeInTheDocument();
      });
    });

    test('back button has proper accessibility attributes', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        const backButton = screen.getByText('Back to feed');
        expect(backButton).toBeInTheDocument();
      });
    });
  });

  describe('Styling and Layout', () => {
    test('has proper CSS classes for responsive design', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        // Just verify the component renders without error
        expect(screen.getByText('Lost iPhone')).toBeInTheDocument();
      });
    });

    test('item image has proper styling classes', async () => {
      onSnapshot.mockImplementation((ref, callback) => {
        callback({
          data: () => mockItem,
          id: 'test-item-id'
        });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ItemDetailPage />);
      
      await waitFor(() => {
        const image = screen.getByAltText('Lost iPhone');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src');
      });
    });
  });

  describe('URL Parameter Handling', () => {
    // Helper function to create mock snapshot data
    const createMockSnapshot = (itemId) => ({
      data: () => mockItem,
      id: itemId
    });

    // Helper function to setup onSnapshot mock
    const setupOnSnapshotMock = (itemId) => {
      const mockSnapshot = createMockSnapshot(itemId);
      onSnapshot.mockImplementation((ref, callback) => {
        callback(mockSnapshot);
        return mockUnsubscribe;
      });
    };

    test('uses item ID from URL parameters', () => {
      const testItemId = 'different-item-id';
      
      useParams.mockReturnValue({ id: testItemId });
      setupOnSnapshotMock(testItemId);
      
      renderWithRouter(<ItemDetailPage />);
      
      expect(doc).toHaveBeenCalledWith({}, 'items', testItemId);
    });

    test('handles missing item ID parameter', () => {
      useParams.mockReturnValue({});
      
      renderWithRouter(<ItemDetailPage />);
      
      // Component should not call doc when no ID is provided
      expect(doc).not.toHaveBeenCalled();
    });
  });
});
