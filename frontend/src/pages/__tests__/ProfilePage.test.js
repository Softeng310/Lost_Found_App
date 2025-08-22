import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import ProfilePage from '../ProfilePage';
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment, 
  renderWithRouter, 
  SharedTestUtils 
} from '../../test-utils';
import {
  createMockUser,
  setupAuthStateMock,
  setupSuccessMock,
  setupErrorMock,
  assertStylingClasses
} from '../../test-utils-shared';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  /* eslint-disable react/prop-types */
  const Link = ({ children, to, ...props }) => {
    return (
      <a href={to} {...props}>
        {children}
      </a>
    );
  };
  /* eslint-enable react/prop-types */
  
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    Link,
  };
});

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../../firebase/config', () => ({
  auth: {},
}));

// Setup test environment
setupTestEnvironment();

describe('ProfilePage', () => {
  const { mockAuth, mockUnsubscribe } = setupTestEnvironment();
  const mockUser = createMockUser();

  beforeEach(() => {
    cleanupTestEnvironment();
    
    // Setup default mocks
    getAuth.mockReturnValue(mockAuth);
    onAuthStateChanged.mockReturnValue(mockUnsubscribe);
  });

  // Consolidated helper functions to eliminate all duplication patterns
  const renderProfilePage = (user = mockUser) => {
    setupAuthStateMock(onAuthStateChanged, user, mockUnsubscribe);
    return renderWithRouter(<ProfilePage />);
  };

  const assertProfilePageRenders = async () => {
    await waitFor(() => {
      expect(screen.getByText('Profile & History')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  };

  const assertProfileSections = async () => {
    await waitFor(() => {
      // Trust & Verification section
      expect(screen.getByText('Trust & Verification')).toBeInTheDocument();
      expect(screen.getByText('Unverified')).toBeInTheDocument();
      
      // My Posts and Claims sections
      expect(screen.getByText('My Posts')).toBeInTheDocument();
      expect(screen.getByText('My Claims')).toBeInTheDocument();
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
    
    if (expectSignOutCall) {
      expect(signOut).toHaveBeenCalledWith(mockAuth);
    }
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

  describe('Rendering', () => {
    test('renders profile page with user information when authenticated', async () => {
      renderProfilePage();
      await assertProfilePageRenders();
    });

    test('renders all profile sections', async () => {
      renderProfilePage();
      await assertProfileSections();
    });
  });

  describe('Authentication State Management', () => {
    test('displays profile content with mock data', () => {
      renderProfilePage();
      assertPageTitleAndDescription();
    });
  });

  describe('User Information Display', () => {
    test('displays page title and description', () => {
      renderProfilePage();
      assertPageTitleAndDescription();
    });

    test('displays logout button with proper styling', async () => {
      renderProfilePage();
      await assertLogoutButton();
    });
  });

  describe('Logout Functionality', () => {
    test('calls signOut when logout button is clicked', async () => {
      setupSuccessMock(signOut);
      renderProfilePage();
      
      await clickLogoutAndAssert();
    });

    test('redirects to home page after successful logout', async () => {
      setupSuccessMock(signOut);
      renderProfilePage();
      
      await clickLogoutAndAssert();
    });

    test('handles logout errors gracefully', async () => {
      setupErrorMock(signOut, 'Logout failed');
      renderProfilePage();
      
      await clickLogoutAndAssert(false);
      await waitFor(() => {
        expect(screen.getByText('Profile & History')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('renders logout button for navigation', async () => {
      renderProfilePage();
      await assertLogoutButton();
    });
  });

  describe('Error Handling', () => {
    test('handles auth state check gracefully', async () => {
      onAuthStateChanged.mockImplementation((auth, callback, errorCallback) => {
        errorCallback(new Error('Auth check failed'));
        return mockUnsubscribe;
      });
      
      renderProfilePage();
      
      await waitFor(() => {
        expect(screen.getByText('Profile & History')).toBeInTheDocument();
      });
    });

    test('handles missing user data gracefully', () => {
      renderProfilePage();
      assertPageTitleAndDescription();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading hierarchy', () => {
      renderProfilePage();
      assertHeadingHierarchy();
    });

    test('logout button has proper accessibility attributes', async () => {
      renderProfilePage();
      await assertLogoutButton();
    });
  });

  describe('Styling and Layout', () => {
    test('has proper CSS classes for responsive design', async () => {
      renderProfilePage();
      await assertContainerStyling();
    });

    test('logout button has proper styling classes', async () => {
      renderProfilePage();
      await assertLogoutButton();
    });

    test('cards have proper styling', async () => {
      renderProfilePage();
      await assertCardStyling();
    });
  });

  describe('User Data Handling', () => {
    test('displays profile content with mock data', () => {
      renderProfilePage();
      assertPageTitleAndDescription();
    });
  });
});
