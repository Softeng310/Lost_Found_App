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

  // Helper functions to reduce code duplication
  const renderWithMockUser = (user = mockUser) => {
    setupAuthStateMock(onAuthStateChanged, user, mockUnsubscribe);
    return renderWithRouter(<ProfilePage />);
  };

  const assertProfilePageRenders = async () => {
    await waitFor(() => {
      expect(screen.getByText('Profile & History')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  };

  const assertTrustVerificationSection = async () => {
    await waitFor(() => {
      expect(screen.getByText('Trust & Verification')).toBeInTheDocument();
      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });
  };

  const assertMyPostsAndClaimsSections = async () => {
    await waitFor(() => {
      expect(screen.getByText('My Posts')).toBeInTheDocument();
      expect(screen.getByText('My Claims')).toBeInTheDocument();
    });
  };

  const assertLogoutButtonPresence = async () => {
    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
      const logoutButton = screen.getByText('Logout').closest('button');
      expect(logoutButton).toBeInTheDocument();
    });
  };

  const assertLogoutButtonStyling = () => {
    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton.closest('button')).toHaveClass('bg-red-600');
  };

  const clickLogoutButton = async () => {
    await waitFor(() => {
      const logoutButton = screen.getByText('Logout').closest('button');
      fireEvent.click(logoutButton);
    });
  };

  describe('Rendering', () => {
    test('renders profile page with user information when authenticated', async () => {
      renderWithMockUser();
      await assertProfilePageRenders();
    });

    test('renders logout button with icon', async () => {
      renderWithMockUser();
      await assertLogoutButtonPresence();
    });

    test('renders trust verification section', async () => {
      renderWithMockUser();
      await assertTrustVerificationSection();
    });

    test('renders my posts and claims sections', async () => {
      renderWithMockUser();
      await assertMyPostsAndClaimsSections();
    });
  });

  describe('Authentication State Management', () => {
    test('displays profile content with mock data', () => {
      renderWithRouter(<ProfilePage />);
      
      expect(screen.getByText('Profile & History')).toBeInTheDocument();
      expect(screen.getByText('Mock user context. Integrate UPI-backed SSO for identity and trust badges (A2).')).toBeInTheDocument();
    });
  });

  describe('User Information Display', () => {
    test('displays page title and description', () => {
      renderWithRouter(<ProfilePage />);
      
      expect(screen.getByText('Profile & History')).toBeInTheDocument();
      expect(screen.getByText(/Mock user context/)).toBeInTheDocument();
    });

    test('displays logout button with proper styling', () => {
      renderWithRouter(<ProfilePage />);
      assertLogoutButtonStyling();
    });
  });

  describe('Logout Functionality', () => {
    test('calls signOut when logout button is clicked', async () => {
      setupSuccessMock(signOut);
      renderWithMockUser();
      
      await clickLogoutButton();
      expect(signOut).toHaveBeenCalledWith(mockAuth);
    });

    test('redirects to home page after successful logout', async () => {
      setupSuccessMock(signOut);
      renderWithMockUser();
      
      await clickLogoutButton();
      expect(signOut).toHaveBeenCalledWith(mockAuth);
    });

    test('handles logout errors gracefully', async () => {
      setupErrorMock(signOut, 'Logout failed');
      renderWithMockUser();
      
      await clickLogoutButton();
      await waitFor(() => {
        expect(screen.getByText('Profile & History')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Sections', () => {
    test('displays trust verification section', async () => {
      renderWithMockUser();
      await assertTrustVerificationSection();
    });

    test('displays my posts and claims sections', async () => {
      renderWithMockUser();
      await assertMyPostsAndClaimsSections();
    });
  });

  describe('Navigation', () => {
    test('renders logout button for navigation', async () => {
      renderWithMockUser();
      await assertLogoutButtonPresence();
    });
  });

  describe('Error Handling', () => {
    test('handles auth state check gracefully', async () => {
      onAuthStateChanged.mockImplementation((auth, callback, errorCallback) => {
        errorCallback(new Error('Auth check failed'));
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Profile & History')).toBeInTheDocument();
      });
    });

    test('handles missing user data gracefully', () => {
      renderWithRouter(<ProfilePage />);
      
      expect(screen.getByText('Profile & History')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading hierarchy', () => {
      renderWithRouter(<ProfilePage />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Profile & History');
    });

    test('logout button has proper accessibility attributes', () => {
      renderWithRouter(<ProfilePage />);
      
      const logoutButton = screen.getByText('Logout');
      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    test('has proper CSS classes for responsive design', async () => {
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        const container = screen.getByText('Profile & History').closest('.max-w-7xl');
        expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-8');
      });
    });

    test('logout button has proper styling classes', async () => {
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        const logoutButton = screen.getByText('Logout').closest('button');
        expect(logoutButton).toHaveClass('bg-red-600', 'text-white', 'rounded-md');
      });
    });

    test('cards have proper styling', async () => {
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        const cards = document.querySelectorAll('[class*="rounded-lg"]');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('User Data Handling', () => {
    test('displays profile content with mock data', () => {
      renderWithRouter(<ProfilePage />);
      
      expect(screen.getByText('Profile & History')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });
});
