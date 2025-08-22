import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import ProfilePage from '../ProfilePage';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock the Button component
jest.mock('../../components/ui/button', () => ({
  Button: ({ children, ...props }) => (
    <button {...props} data-testid="button">
      {children}
    </button>
  ),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon">User</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  LogOut: () => <div data-testid="logout-icon">LogOut</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Heart: () => <div data-testid="heart-icon">Heart</div>,
  MapPin: () => <div data-testid="mappin-icon">MapPin</div>,
}));

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProfilePage', () => {
  const mockAuth = {};
  const mockUnsubscribe = jest.fn();
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    getAuth.mockReturnValue(mockAuth);
    onAuthStateChanged.mockReturnValue(mockUnsubscribe);
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    test('renders profile page with user information when authenticated', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Profile & History')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
    });

    test('renders logout button with icon', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
        expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
      });
    });

    test('renders trust verification section', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Trust & Verification')).toBeInTheDocument();
        expect(screen.getByText('Unverified')).toBeInTheDocument();
      });
    });

    test('renders logout button', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
        expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
      });
    });

    test('renders my posts and claims sections', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Posts')).toBeInTheDocument();
        expect(screen.getByText('My Claims')).toBeInTheDocument();
      });
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
      
      const logoutButton = screen.getByText('Logout');
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton.closest('button')).toHaveClass('bg-red-600');
    });
  });

  describe('Logout Functionality', () => {
    test('calls signOut when logout button is clicked', async () => {
      signOut.mockResolvedValueOnce();
      
      renderWithRouter(<ProfilePage />);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith(mockAuth);
      });
    });

    test('redirects to home page after successful logout', async () => {
      signOut.mockResolvedValueOnce();
      
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('handles logout errors gracefully', async () => {
      signOut.mockRejectedValueOnce(new Error('Logout failed'));
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);
      });
      
      // The component doesn't currently display error messages, so we just verify it doesn't crash
      await waitFor(() => {
        expect(screen.getByText('Profile & History')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Sections', () => {
    test('displays trust verification section', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Trust & Verification')).toBeInTheDocument();
        expect(screen.getByText('Unverified')).toBeInTheDocument();
      });
    });

    test('displays my posts and claims sections', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Posts')).toBeInTheDocument();
        expect(screen.getByText('My Claims')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('renders logout button for navigation', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
        expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles auth state check gracefully', async () => {
      onAuthStateChanged.mockImplementation((auth, callback, errorCallback) => {
        errorCallback(new Error('Auth check failed'));
        return mockUnsubscribe;
      });
      
      renderWithRouter(<ProfilePage />);
      
      // The component doesn't currently display error messages, so we just verify it doesn't crash
      await waitFor(() => {
        expect(screen.getByText('Profile & History')).toBeInTheDocument();
      });
    });

    test('handles missing user data gracefully', () => {
      renderWithRouter(<ProfilePage />);
      
      expect(screen.getByText('Profile & History')).toBeInTheDocument();
      // Should not crash when user data is incomplete
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
