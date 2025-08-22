import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import SignUpPage from '../SignUp';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

// Mock the Button component
jest.mock('../../components/ui/button', () => ({
  Button: ({ children, type, onClick, ...props }) => (
    <button type={type} onClick={onClick} {...props} data-testid="button">
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

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SignUpPage', () => {
  const mockAuth = {};
  const mockUnsubscribe = jest.fn();
  const mockDb = {};
  const mockDoc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    getAuth.mockReturnValue(mockAuth);
    getFirestore.mockReturnValue(mockDb);
    doc.mockReturnValue(mockDoc);
    setDoc.mockResolvedValue();
    onAuthStateChanged.mockReturnValue(mockUnsubscribe);
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    test('renders signup form with all required elements', () => {
      renderWithRouter(<SignUpPage />);
      
      expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0);
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Create Account' }).length).toBeGreaterThan(0);
    });

    test('renders login link for existing users', () => {
      renderWithRouter(<SignUpPage />);
      
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toHaveAttribute('href', '/login');
    });

    test('form inputs have correct attributes', () => {
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('required');
    });
  });

  describe('Form State Management', () => {
    test('initializes with empty form state', () => {
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      expect(nameInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
      expect(confirmPasswordInput.value).toBe('');
    });

    test('updates form values when user types', () => {
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      expect(nameInput.value).toBe('John Doe');
      expect(emailInput.value).toBe('john@example.com');
      expect(passwordInput.value).toBe('password123');
      expect(confirmPasswordInput.value).toBe('password123');
    });
  });

  describe('Authentication State Management', () => {
    test('sets up auth state listener on mount', () => {
      renderWithRouter(<SignUpPage />);
      
      expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuth, expect.any(Function));
    });

    test('cleans up auth state listener on unmount', () => {
      const { unmount } = renderWithRouter(<SignUpPage />);
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    test('redirects to home if user is already authenticated', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ uid: 'test-uid' });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<SignUpPage />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Form Validation', () => {
    test('validates password confirmation matches', async () => {
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getAllByRole('button', { name: 'Create Account' })[0];
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    test('validates password length', async () => {
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getAllByRole('button', { name: 'Create Account' })[0];
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('calls createUserWithEmailAndPassword with form data on valid submission', async () => {
      createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'test-uid' } });
      
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getAllByRole('button', { name: 'Create Account' })[0];
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
          mockAuth,
          'john@example.com',
          'password123'
        );
      });
    });

    test('redirects to home page on successful signup', async () => {
      createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'test-uid' } });
      
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getAllByRole('button', { name: 'Create Account' })[0];
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('prevents default form submission behavior', async () => {
      createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'test-uid' } });
      
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getAllByRole('button', { name: 'Create Account' })[0];
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when signup fails', async () => {
      const errorMessage = 'Email already in use';
      createUserWithEmailAndPassword.mockRejectedValueOnce(new Error(errorMessage));
      
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getAllByRole('button', { name: 'Create Account' })[0];
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    test('clears previous error when form is submitted again', async () => {
      const errorMessage = 'Email already in use';
      createUserWithEmailAndPassword
        .mockRejectedValueOnce(new Error(errorMessage))
        .mockResolvedValueOnce({ user: { uid: 'test-uid' } });
      
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getAllByRole('button', { name: 'Create Account' })[0];
      
      // First submission - fails
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      
      // Second submission - succeeds
      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and associations', () => {
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      expect(nameInput).toHaveAttribute('id', 'name');
      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
      expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword');
    });

    test('submit button has proper role and text', () => {
      renderWithRouter(<SignUpPage />);
      
      const submitButtons = screen.getAllByRole('button', { name: 'Create Account' });
      expect(submitButtons.length).toBeGreaterThan(0);
    });

    test('error messages are accessible', async () => {
      const errorMessage = 'Email already in use';
      createUserWithEmailAndPassword.mockRejectedValueOnce(new Error(errorMessage));
      
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getAllByRole('button', { name: 'Create Account' })[0];
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
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
      renderWithRouter(<SignUpPage />);
      
      const mainContainer = screen.getAllByText('Create Account')[0].closest('div');
      expect(mainContainer).toHaveClass('min-h-dvh', 'flex', 'flex-col', 'bg-white');
    });

    test('form container has proper styling classes', () => {
      renderWithRouter(<SignUpPage />);
      
      const form = screen.getAllByRole('button', { name: 'Create Account' })[0].closest('form');
      expect(form).toHaveClass('bg-white', 'p-6', 'rounded', 'shadow-md');
    });

    test('input fields have proper styling classes', () => {
      renderWithRouter(<SignUpPage />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      expect(nameInput).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'rounded');
      expect(emailInput).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'rounded');
      expect(passwordInput).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'rounded');
      expect(confirmPasswordInput).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'rounded');
    });
  });
});
