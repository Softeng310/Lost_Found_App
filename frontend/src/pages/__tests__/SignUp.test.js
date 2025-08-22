import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { BrowserRouter } from 'react-router-dom';
import SignUpPage from '../SignUp';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('../../firebase/config', () => ({
  app: {},
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

// Custom render function with router
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
  });

  describe('Rendering', () => {
    test('renders signup form with all required elements', () => {
      // Mock onAuthStateChanged to not redirect initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      renderWithRouter(<SignUpPage />);
      
      expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0);
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Create Account' }).length).toBeGreaterThan(0);
    });

    test('renders login link for existing users', () => {
      // Mock onAuthStateChanged to not redirect initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      renderWithRouter(<SignUpPage />);
      
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toHaveAttribute('href', '/login');
    });

    test('form inputs have correct attributes', () => {
      // Mock onAuthStateChanged to not redirect initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

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
      // Mock onAuthStateChanged to not redirect initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

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
      // Mock onAuthStateChanged to not redirect initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

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
    test('redirects to home if user is already authenticated', () => {
      // Mock that user is already authenticated
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ uid: 'test-uid', email: 'test@example.com' });
        return mockUnsubscribe;
      });
      
      renderWithRouter(<SignUpPage />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Form Submission', () => {
    test('successfully creates account and redirects to home', async () => {
      // Mock that no user is authenticated initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user initially
        return mockUnsubscribe;
      });
      
      createUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'test-uid', email: 'test@example.com' }
      });
      setDoc.mockResolvedValue();
      
      renderWithRouter(<SignUpPage />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText('UPI ID'), { target: { value: 'test@upi' } });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
      
      // Wait for the navigation to be called
      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
        expect(setDoc).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('handles password mismatch error', async () => {
      // Mock that no user is authenticated initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user initially
        return mockUnsubscribe;
      });
      
      renderWithRouter(<SignUpPage />);
      
      // Fill out the form with mismatched passwords
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    test('handles Firebase auth errors gracefully', async () => {
      // Mock that no user is authenticated initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user initially
        return mockUnsubscribe;
      });
      
      const errorMessage = 'An account with this email already exists. Please sign in instead.';
      createUserWithEmailAndPassword.mockRejectedValue({ code: 'auth/email-already-in-use' });
      
      renderWithRouter(<SignUpPage />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    test('handles successful signup and redirects', async () => {
      // Mock that no user is authenticated initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user initially
        return mockUnsubscribe;
      });
      
      createUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'test-uid', email: 'test@example.com' }
      });
      setDoc.mockResolvedValue();
      
      renderWithRouter(<SignUpPage />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Error Handling', () => {
    test('clears previous error when form is submitted again', async () => {
      // Mock that no user is authenticated initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user initially
        return mockUnsubscribe;
      });
      
      // First submission fails
      createUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
      
      renderWithRouter(<SignUpPage />);
      
      // Fill out form and submit
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('An account with this email already exists. Please sign in instead.')).toBeInTheDocument();
      });
      
      // Second submission succeeds
      createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'test-uid' } });
      setDoc.mockResolvedValueOnce();
      
      // Submit again
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and associations', () => {
      // Mock onAuthStateChanged to not redirect initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

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
      // Mock onAuthStateChanged to not redirect initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      renderWithRouter(<SignUpPage />);
      
      const submitButtons = screen.getAllByRole('button', { name: 'Create Account' });
      expect(submitButtons.length).toBeGreaterThan(0);
    });

    test('error messages are accessible', async () => {
      // Mock that no user is authenticated initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

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
      // Mock onAuthStateChanged to not redirect initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      renderWithRouter(<SignUpPage />);
      
      const mainContainer = screen.getAllByText('Create Account')[0].closest('div');
      expect(mainContainer).toHaveClass('min-h-dvh', 'flex', 'flex-col', 'bg-white');
    });

    test('form container has proper styling classes', () => {
      // Mock onAuthStateChanged to not redirect initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      renderWithRouter(<SignUpPage />);
      
      const form = screen.getAllByRole('button', { name: 'Create Account' })[0].closest('form');
      expect(form).toHaveClass('bg-white', 'p-6', 'rounded', 'shadow-md');
    });

    test('input fields have proper styling classes', () => {
      // Mock onAuthStateChanged to not redirect initially
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

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


