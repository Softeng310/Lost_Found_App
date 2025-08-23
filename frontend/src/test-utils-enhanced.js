import React from 'react';
import PropTypes from 'prop-types';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Enhanced test utilities to reduce duplication across test files

// Common mock data
export const MockData = {
  // User data
  createMockUser: (overrides = {}) => ({
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.jpg',
    ...overrides
  }),

  // Items data
  createMockItems: (count = 3) => Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    title: `Test Item ${i + 1}`,
    description: `Test description ${i + 1}`,
    kind: i % 2 === 0 ? 'lost' : 'found',
    category: ['electronics', 'clothing', 'personal'][i % 3],
    location: ['OGGB', 'library', 'cafeteria'][i % 3],
    date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
    imageUrl: `test-image-${i + 1}.jpg`,
  })),

  // Announcements data
  createMockAnnouncements: (count = 3) => Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    title: `Announcement ${i + 1}`,
    announcement: `Announcement content ${i + 1}`,
    datePosted: new Date(`2025-08-${String(i + 15).padStart(2, '0')}T10:00:00Z`),
  })),
};

// Common mock setup functions
export const MockSetup = {
  // Firebase Auth mocks
  setupAuthMocks: () => {
    const mockAuth = {};
    const mockUnsubscribe = jest.fn();
    
    jest.doMock('firebase/auth', () => ({
      getAuth: jest.fn(() => mockAuth),
      signInWithEmailAndPassword: jest.fn(),
      createUserWithEmailAndPassword: jest.fn(),
      onAuthStateChanged: jest.fn(),
      signOut: jest.fn(),
    }));

    return { mockAuth, mockUnsubscribe };
  },

  // Firebase Firestore mocks
  setupFirestoreMocks: () => {
    const mockDb = {};
    const mockUnsubscribe = jest.fn();
    
    jest.doMock('firebase/firestore', () => ({
      getFirestore: jest.fn(() => mockDb),
      collection: jest.fn(),
      doc: jest.fn(),
      setDoc: jest.fn(),
      onSnapshot: jest.fn(),
      query: jest.fn(),
      orderBy: jest.fn(),
      getDocs: jest.fn(),
    }));

    return { mockDb, mockUnsubscribe };
  },

  // Router mocks
  setupRouterMocks: () => {
    const mockNavigate = jest.fn();
    
    jest.doMock('react-router-dom', () => {
      const Link = ({ children, to, ...props }) => (
        <a href={to} {...props}>
          {children}
        </a>
      );
      
      Link.propTypes = {
        children: PropTypes.node.isRequired,
        to: PropTypes.string.isRequired,
      };
      
      return {
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: 'test-id' }),
        Link,
      };
    });

    return { mockNavigate };
  },
};

// Common test helpers
export const TestHelpers = {
  // Form interaction helpers
  fillFormField: (screen, label, value) => {
    const field = screen.getByLabelText(label);
    fireEvent.change(field, { target: { value } });
    return field;
  },

  fillFormFields: (screen, fields) => {
    Object.entries(fields).forEach(([label, value]) => {
      TestHelpers.fillFormField(screen, label, value);
    });
  },

  submitForm: (screen, buttonText = 'Submit') => {
    const submitButton = screen.getByRole('button', { name: buttonText });
    fireEvent.click(submitButton);
  },

  // Navigation helpers
  clickLink: (screen, text) => {
    const link = screen.getByText(text);
    fireEvent.click(link);
  },

  // Mock setup helpers
  setupAuthState: (onAuthStateChanged, mockUser, mockUnsubscribe) => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return mockUnsubscribe;
    });
  },

  setupFirebaseSnapshot: (onSnapshot, mockItems, mockUnsubscribe) => {
    onSnapshot.mockImplementation((query, successCallback, errorCallback) => {
      successCallback({
        docs: mockItems.map(item => ({
          data: () => item,
          id: item.id
        }))
      });
      return mockUnsubscribe;
    });
  },

  setupErrorMock: (mockFunction, errorMessage) => {
    mockFunction.mockRejectedValueOnce(new Error(errorMessage));
  },

  setupSuccessMock: (mockFunction, returnValue = {}) => {
    mockFunction.mockResolvedValue(returnValue);
  },

  // Assertion helpers
  assertCommonElements: (screen) => {
    expect(screen.getByRole('main')).toBeInTheDocument();
  },

  assertFormFields: (screen, expectedFields) => {
    expectedFields.forEach(field => {
      expect(screen.getByLabelText(field)).toBeInTheDocument();
    });
  },

  assertFormValidation: (screen, requiredFields) => {
    requiredFields.forEach(field => {
      const input = screen.getByLabelText(field);
      expect(input).toHaveAttribute('required');
    });
  },
};

// Common test patterns
export const TestPatterns = {
  // Authentication test pattern
  testAuthenticationFlow: (Component, { 
    mockUser, 
    mockUnsubscribe, 
    onAuthStateChanged, 
    expectedRedirect = '/' 
  }) => {
    test('redirects to home if user is already authenticated', () => {
      TestHelpers.setupAuthState(onAuthStateChanged, mockUser, mockUnsubscribe);
      
      renderWithRouter(<Component />);
      
      expect(mockNavigate).toHaveBeenCalledWith(expectedRedirect);
    });
  },

  // Form submission test pattern
  testFormSubmission: (Component, {
    formFields,
    submitButtonText = 'Submit',
    mockFunction,
    expectedCalls,
    expectedRedirect,
    errorMessage
  }) => {
    test('successfully submits form and redirects', async () => {
      TestHelpers.setupSuccessMock(mockFunction);
      
      renderWithRouter(<Component />);
      
      TestHelpers.fillFormFields(screen, formFields);
      TestHelpers.submitForm(screen, submitButtonText);
      
      await waitFor(() => {
        expectedCalls.forEach(call => {
          expect(mockFunction).toHaveBeenCalledWith(...call);
        });
        if (expectedRedirect) {
          expect(mockNavigate).toHaveBeenCalledWith(expectedRedirect);
        }
      });
    });

    if (errorMessage) {
      test('handles submission errors gracefully', async () => {
        TestHelpers.setupErrorMock(mockFunction, errorMessage);
        
        renderWithRouter(<Component />);
        
        TestHelpers.fillFormFields(screen, formFields);
        TestHelpers.submitForm(screen, submitButtonText);
        
        await waitFor(() => {
          expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
      });
    }
  },

  // Data fetching test pattern
  testDataFetching: (Component, {
    mockItems,
    mockUnsubscribe,
    onSnapshot,
    collection,
    orderBy,
    query
  }) => {
    test('sets up Firestore listener on mount', () => {
      renderWithRouter(<Component />);
      
      expect(collection).toHaveBeenCalledWith({}, 'items');
      expect(orderBy).toHaveBeenCalledWith('date', 'desc');
      expect(query).toHaveBeenCalled();
      expect(onSnapshot).toHaveBeenCalled();
    });

    test('cleans up Firestore listener on unmount', () => {
      const { unmount } = renderWithRouter(<Component />);
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    test('displays items when data is loaded successfully', async () => {
      TestHelpers.setupFirebaseSnapshot(onSnapshot, mockItems, mockUnsubscribe);
      
      renderWithRouter(<Component />);
      
      await waitFor(() => {
        mockItems.forEach(item => {
          expect(screen.getByText(item.title)).toBeInTheDocument();
        });
      });
    });
  },
};

// Enhanced render function with common setup
export const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Common cleanup function
export const cleanupTestEnvironment = () => {
  jest.clearAllMocks();
};

// Setup function for common test environment
export const setupTestEnvironment = () => {
  cleanupTestEnvironment();
  
  const { mockAuth, mockUnsubscribe } = MockSetup.setupAuthMocks();
  const { mockDb } = MockSetup.setupFirestoreMocks();
  const { mockNavigate } = MockSetup.setupRouterMocks();

  return {
    mockAuth,
    mockUnsubscribe,
    mockDb,
    mockNavigate,
  };
};

// Export everything from the original test-utils for backward compatibility
export * from './test-utils';
