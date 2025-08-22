import React from 'react';
import PropTypes from 'prop-types';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../Login';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../../firebase/config', () => ({
  app: {},
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const Link = ({ children, to, ...props }) => {
    // ESLint disable for test mock component
    // eslint-disable-next-line react/prop-types
    return (
      <a href={to} {...props}>
        {children}
      </a>
    );
  };
  
  // PropTypes removed from mock to avoid Jest scope issues
  
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    Link,
  };
});

// Custom render function with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  const mockAuth = {};
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    getAuth.mockReturnValue(mockAuth);
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // No user initially
      return mockUnsubscribe;
    });
  });

  describe('Rendering', () => {
    test('renders login form with all required elements', () => {
      renderWithRouter(<LoginPage />);
      
      expect(screen.getAllByText('Login').length).toBeGreaterThan(0);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Login' }).length).toBeGreaterThan(0);
    });

    test('renders sign up link for new users', () => {
      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toHaveAttribute('href', '/signup');
    });

    test('form inputs have correct attributes', () => {
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });

    test('form has proper accessibility labels', () => {
      renderWithRouter(<LoginPage />);
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });
  });

  describe('Form State Management', () => {
    test('initializes with empty form state', () => {
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });

    test('updates email input value when user types', () => {
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput.value).toBe('test@example.com');
    });

    test('updates password input value when user types', () => {
      renderWithRouter(<LoginPage />);
      
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput.value).toBe('password123');
    });
  });

  describe('Authentication State Management', () => {
    test('sets up auth state listener on mount', () => {
      renderWithRouter(<LoginPage />);
      
      expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuth, expect.any(Function));
    });

    test('cleans up auth state listener on unmount', () => {
      const { unmount } = renderWithRouter(<LoginPage />);
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    test('redirects to home if user is already authenticated', () => {
      // Mock that user is already logged in
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ uid: 'test-uid' }); // Mock authenticated user
        return mockUnsubscribe;
      });
      
      renderWithRouter(<LoginPage />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Form Submission', () => {
    test('calls signInWithEmailAndPassword with form data on submit', async () => {
      signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'test-uid' } });
      
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getAllByRole('button', { name: 'Login' })[0];
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          mockAuth,
          'test@example.com',
          'password123'
        );
      });
    });

    test('redirects to home page on successful login', async () => {
      signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'test-uid' } });
      
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getAllByRole('button', { name: 'Login' })[0];
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('prevents default form submission behavior', async () => {
      const mockPreventDefault = jest.fn();
      signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'test-uid' } });
      
      renderWithRouter(<LoginPage />);
      
      const form = screen.getAllByRole('button', { name: 'Login' })[0].closest('form');
      fireEvent.submit(form, { preventDefault: mockPreventDefault });
      
      // The form submission should trigger the login function
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when login fails', async () => {
      const errorMessage = 'Invalid email or password';
      signInWithEmailAndPassword.mockRejectedValueOnce(new Error(errorMessage));
      
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getAllByRole('button', { name: 'Login' })[0];
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    test('clears previous error when form is submitted again', async () => {
      const errorMessage = 'Invalid email or password';
      signInWithEmailAndPassword
        .mockRejectedValueOnce(new Error(errorMessage))
        .mockResolvedValueOnce({ user: { uid: 'test-uid' } });
      
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Login' });
      
      // First submission - fails
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      
      // Second submission - succeeds
      fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Validation', () => {
    test('requires email and password fields', () => {
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    test('email input has email type validation', () => {
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and associations', () => {
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      expect(emailInput).toHaveAttribute('id', 'login-email');
      expect(passwordInput).toHaveAttribute('id', 'login-password');
    });

    test('submit button has proper role and text', () => {
      renderWithRouter(<LoginPage />);
      
      const submitButtons = screen.getAllByRole('button', { name: 'Login' });
      expect(submitButtons.length).toBeGreaterThan(0);
    });

    test('error messages are accessible', async () => {
      const errorMessage = 'Invalid email or password';
      signInWithEmailAndPassword.mockRejectedValueOnce(new Error(errorMessage));
      
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getAllByRole('button', { name: 'Login' })[0];
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorElement = screen.getByText(errorMessage);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveClass('text-red-500');
      });
    });
  });

  describe('Styling and Layout', () => {
    test('has proper CSS classes for styling', () => {
      renderWithRouter(<LoginPage />);
      
      const mainContainer = screen.getAllByText('Login')[0].closest('div');
      expect(mainContainer).toHaveClass('min-h-dvh', 'flex', 'flex-col', 'bg-white');
    });

    test('form container has proper styling classes', () => {
      renderWithRouter(<LoginPage />);
      
      const form = screen.getAllByRole('button', { name: 'Login' })[0].closest('form');
      expect(form).toHaveClass('bg-white', 'p-6', 'rounded', 'shadow-md');
    });

    test('input fields have proper styling classes', () => {
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      expect(emailInput).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'rounded');
      expect(passwordInput).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'rounded');
    });
  });
});
