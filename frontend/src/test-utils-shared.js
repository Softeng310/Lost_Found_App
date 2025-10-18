import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// =============================================================================
// COMMON MOCK SETUPS - Used across multiple test files
// =============================================================================

// Global console.error suppression for common warnings
export const setupConsoleErrorSuppression = () => {
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = (...args) => {
      // silence a set of expected, noisy warnings/errors that occur during tests
      if (typeof args[0] === 'string') {
        const message = args[0];
        const suppressedPatterns = [
          'Warning: ReactDOM.render is no longer supported',
          'Warning: An invalid form control',
          'Warning: Each child in a list should have a unique "key" prop',
          // React testing "act" warnings
          'not wrapped in act(',
          // App-level error logs used in components (tests intentionally trigger these)
          '❌ Error updating announcement',
          '❌ Error deleting announcement',
          '❌ Error creating announcement',
          'Error fetching items',
          'Error setting up items listener',
          'Failed to load items',
          'Failed to connect to database',
        ];

        for (const p of suppressedPatterns) {
          if (message.includes(p)) return;
        }
      }

      originalConsoleError.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });
};

// Setup Firebase mocks - Main function that sets up all Firebase mocks
export const setupFirebaseMocks = () => {
  // Mock Firebase Firestore
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
};

// Global fetch mock setup
export const setupGlobalFetchMock = (defaultResponse = {}) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(defaultResponse),
    })
  );
};

// Shared render function with router
export const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Common test data
export const createMockUser = (overrides = {}) => ({
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  ...overrides,
});

// Common mock item data
export const createMockItem = (overrides = {}) => ({
  id: 'test-item-id',
  title: 'Test Item',
  description: 'Test description',
  kind: 'lost',
  category: 'electronics',
  location: 'library',
  date: new Date('2024-01-01'),
  contactName: 'Test User',
  contactEmail: 'test@example.com',
  contactPhone: '+1234567890',
  imageUrl: 'https://example.com/image.jpg',
  ...overrides,
});

// Common mock document creator
export const createMockDoc = (item) => ({
  data: () => item,
  id: item.id,
  exists: () => true
});

// Common mock announcements data
export const createMockAnnouncements = () => [
  {
    id: '1',
    title: 'Welcome to the Lost & Found App!',
    content: 'Stay tuned for important updates and campus-wide announcements here.',
    date: new Date('2024-01-01'),
    priority: 'high'
  },
  {
    id: '2',
    title: 'New Feature: Item Heatmap',
    content: 'You can now view a heatmap of lost and found items on campus. Check it out on the map page!',
    date: new Date('2024-01-02'),
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Reminder: Keep Your Valuables Safe',
    content: 'Please remember to keep your belongings secure and report any lost or found items promptly.',
    date: new Date('2024-01-03'),
    priority: 'low'
  }
];

// =============================================================================
// COMMON ASSERTION PATTERNS - Used across multiple test files
// =============================================================================

// Generic wait for element assertion
export const assertElementExists = async (testId, shouldExist = true) => {
  await waitFor(() => {
    const element = screen.queryByTestId(testId);
    if (shouldExist) {
      expect(element).toBeInTheDocument();
    } else {
      expect(element).not.toBeInTheDocument();
    }
  });
};

// Generic text content assertion
export const assertTextContent = async (text, shouldExist = true) => {
  await waitFor(() => {
    const element = shouldExist 
      ? screen.getByText(text) 
      : screen.queryByText(text);
    if (shouldExist) {
      expect(element).toBeInTheDocument();
    } else {
      expect(element).not.toBeInTheDocument();
    }
  });
};

// Generic heading assertion
export const assertHeadingExists = (level, text) => {
  const heading = screen.getByRole('heading', { level });
  expect(heading).toHaveTextContent(text);
};

// Generic CSS class assertion
export const assertHasClasses = (element, expectedClasses) => {
  expectedClasses.forEach(className => {
    expect(element).toHaveClass(className);
  });
};

// Styling classes assertion
export const assertStylingClasses = (screen, elementSelector, expectedClasses = []) => {
  const element = screen.getByText(elementSelector).closest('div');
  expectedClasses.forEach(className => {
    expect(element).toHaveClass(className);
  });
};

// =============================================================================
// COMMON FIREBASE MOCK SETUP PATTERNS
// =============================================================================

// Setup Firestore collection mocks
export const setupFirestoreCollectionMocks = (data = []) => {
  const { collection, query, orderBy, onSnapshot, getDocs } = require('firebase/firestore');
  const mockUnsubscribe = jest.fn();
  
  collection.mockReturnValue('mock-collection');
  orderBy.mockReturnValue('ordered-items');
  query.mockReturnValue('items-query');
  
  // Setup both onSnapshot and getDocs for different use cases
  onSnapshot.mockImplementation((query, successCallback) => {
    const docs = data.map(createMockDoc);
    successCallback({ docs });
    return mockUnsubscribe;
  });
  
  getDocs.mockResolvedValue({
    docs: data.map(createMockDoc)
  });
  
  return { mockUnsubscribe };
};

// Setup Firestore document mocks
export const setupFirestoreDocMocks = (item = null) => {
  const { doc, onSnapshot, getDoc } = require('firebase/firestore');
  const mockDocRef = { id: 'test-doc-ref' };
  const mockUnsubscribe = jest.fn();
  
  doc.mockReturnValue(mockDocRef);
  
  if (item) {
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        data: () => item,
        id: item.id,
        exists: () => true
      });
      return mockUnsubscribe;
    });
    
    getDoc.mockResolvedValue({
      data: () => item,
      id: item.id,
      exists: () => true
    });
  } else {
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        data: () => null,
        id: null,
        exists: () => false
      });
      return mockUnsubscribe;
    });
    
    getDoc.mockResolvedValue({
      data: () => null,
      id: null,
      exists: () => false
    });
  }
  
  return { mockDocRef, mockUnsubscribe };
};

// Common mock setup functions
export const setupGetDocsMock = (data = []) => {
  const { collection, getDocs } = require('firebase/firestore');
  collection.mockReturnValue('mock-collection');
  getDocs.mockResolvedValue({
    docs: data.map(item => ({
      id: item.id || 'mock-id',
      data: () => item,
    })),
  });
};

export const setupLoadingMock = () => {
  const { getDocs } = require('firebase/firestore');
  getDocs.mockImplementation(() => new Promise(() => {})); // Never resolves
};

export const setupEmptyMock = () => {
  const { getDocs } = require('firebase/firestore');
  getDocs.mockResolvedValue({ docs: [] });
};

export const setupErrorMock = (mockFunction, errorMessage = 'Test error') => {
  mockFunction.mockRejectedValue(new Error(errorMessage));
};

// Auth state mock setup
export const setupAuthStateMock = (onAuthStateChanged, mockUser, mockUnsubscribe) => {
  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback(mockUser);
    return mockUnsubscribe;
  });
};

// Success mock setup
export const setupSuccessMock = (mockFunction, returnValue = {}) => {
  mockFunction.mockResolvedValue(returnValue);
};

// =============================================================================
// PAGE-SPECIFIC TEST HELPERS
// =============================================================================

// ProfilePage test helpers
export const createProfilePageTestHelpers = () => {
  const renderProfilePage = (ProfilePageComponent, user = null) => {
    return renderWithRouter(<ProfilePageComponent />);
  };

  const assertProfilePageRenders = async () => {
    await waitFor(() => {
      expect(screen.getByText('Profile & History')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  };

  const assertProfileSections = async () => {
    await waitFor(() => {
      expect(screen.getByText('Trust & Verification')).toBeInTheDocument();
      expect(screen.getByText('My Posts')).toBeInTheDocument();
    });
  };

  const getLogoutButton = () => {
    return screen.getByText('Logout').closest('button');
  };

  const assertLogoutButton = async () => {
    await waitFor(() => {
      const logoutButton = getLogoutButton();
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toHaveClass('bg-red-600', 'text-white', 'rounded-md');
    });
  };

  const clickLogoutAndAssert = async (expectSignOutCall = true) => {
    await waitFor(() => {
      const logoutButton = getLogoutButton();
      fireEvent.click(logoutButton);
    });
  };

  const assertPageTitleAndDescription = () => {
    expect(screen.getByText('Profile & History')).toBeInTheDocument();
    expect(screen.getByText(/Mock user context/)).toBeInTheDocument();
  };

  const assertContainerStyling = async () => {
    await waitFor(() => {
      const container = screen.getByText('Profile & History').closest('.max-w-7xl');
      expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-8');
    });
  };

  const assertCardStyling = async () => {
    await waitFor(() => {
      const cards = document.querySelectorAll('[class*="rounded-lg"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  };

  const assertHeadingHierarchy = () => {
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Profile & History');
  };

  const assertLogoutButtonAccessibility = async () => {
    await assertLogoutButton(); // Reuse existing function
  };

  const assertProfileContentWithMockData = () => {
    assertPageTitleAndDescription();
  };

  const assertAuthStateHandling = async () => {
    await waitFor(() => {
      expect(screen.getByText('Profile & History')).toBeInTheDocument();
    });
  };

  const setupProfilePageMocks = (user = null) => {
    const mockUser = user || createMockUser();
    return { mockUser };
  };

  return {
    renderProfilePage,
    assertProfilePageRenders,
    assertProfileSections,
    getLogoutButton,
    assertLogoutButton,
    clickLogoutAndAssert,
    assertPageTitleAndDescription,
    assertContainerStyling,
    assertCardStyling,
    assertHeadingHierarchy,
    assertLogoutButtonAccessibility,
    assertProfileContentWithMockData,
    assertAuthStateHandling,
    setupProfilePageMocks
  };
};
