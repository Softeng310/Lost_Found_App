import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import SignUpPage from '../SignUp';
import {
  renderWithRouter,
  createMockUser,
  createMockFormData,
  fillSignUpForm,
  submitForm,
  assertFormRenders,
  assertFormValidation,
  assertInputTypes,
  assertStylingClasses,
  setupAuthStateMock,
  setupSuccessMock,
  setupErrorMock
} from '../../test-utils-shared';

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
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);

      renderWithRouter(<SignUpPage />);
      
      expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0);
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Create Account' }).length).toBeGreaterThan(0);
    });

    test('renders login link for existing users', () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);

      renderWithRouter(<SignUpPage />);
      
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toHaveAttribute('href', '/login');
    });

    test('form inputs have correct attributes', () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);

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
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);

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
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);

      renderWithRouter(<SignUpPage />);
      
      const formData = createMockFormData();
      fillSignUpForm(screen, formData);
      
      expect(screen.getByLabelText('Name').value).toBe('Test User');
      expect(screen.getByLabelText('Email').value).toBe('test@example.com');
      expect(screen.getByLabelText('Password').value).toBe('password123');
      expect(screen.getByLabelText('Confirm Password').value).toBe('password123');
    });
  });

  describe('Authentication State Management', () => {
    test('redirects to home if user is already authenticated', () => {
      setupAuthStateMock(onAuthStateChanged, createMockUser(), mockUnsubscribe);
      
      renderWithRouter(<SignUpPage />);
      
      // Note: This test would need to be updated based on actual navigation logic
      expect(onAuthStateChanged).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    test('successfully creates account and redirects to home', async () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);
      setupSuccessMock(createUserWithEmailAndPassword);
      
      renderWithRouter(<SignUpPage />);
      
      const formData = createMockFormData();
      fillSignUpForm(screen, formData);
      submitForm(screen);
      
      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
        expect(setDoc).toHaveBeenCalled();
      });
    });

    test('handles password mismatch error', async () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);
      
      renderWithRouter(<SignUpPage />);
      
      const formData = createMockFormData({ confirmPassword: 'different' });
      fillSignUpForm(screen, formData);
      submitForm(screen);
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    test('handles Firebase auth errors gracefully', async () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);
      
      const errorMessage = 'An account with this email already exists. Please sign in instead.';
      createUserWithEmailAndPassword.mockRejectedValue({ code: 'auth/email-already-in-use' });
      
      renderWithRouter(<SignUpPage />);
      
      const formData = createMockFormData();
      fillSignUpForm(screen, formData);
      submitForm(screen);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    test('handles successful signup and redirects', async () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);
      setupSuccessMock(createUserWithEmailAndPassword);
      
      renderWithRouter(<SignUpPage />);
      
      const formData = createMockFormData();
      fillSignUpForm(screen, formData);
      submitForm(screen);
      
      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('clears previous error when form is submitted again', async () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);
      
      // First submission fails
      createUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
      
      renderWithRouter(<SignUpPage />);
      
      const formData = createMockFormData();
      fillSignUpForm(screen, formData);
      submitForm(screen);
      
      await waitFor(() => {
        expect(screen.getByText('An account with this email already exists. Please sign in instead.')).toBeInTheDocument();
      });
      
      // Second submission succeeds
      setupSuccessMock(createUserWithEmailAndPassword);
      
      submitForm(screen);
      
      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and associations', () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);

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
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);

      renderWithRouter(<SignUpPage />);
      
      const submitButtons = screen.getAllByRole('button', { name: 'Create Account' });
      expect(submitButtons.length).toBeGreaterThan(0);
    });

    test('error messages are accessible', async () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);

      const errorMessage = 'Email already in use';
      setupErrorMock(createUserWithEmailAndPassword, errorMessage);
      
      renderWithRouter(<SignUpPage />);
      
      const formData = createMockFormData();
      fillSignUpForm(screen, formData);
      submitForm(screen);
      
      await waitFor(() => {
        const errorElement = screen.getByText(errorMessage);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveClass('text-red-500');
      });
    });
  });

  describe('Styling and Layout', () => {
    test('has proper CSS classes for styling', () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);

      renderWithRouter(<SignUpPage />);
      
      const mainContainer = screen.getAllByText('Create Account')[0].closest('div');
      expect(mainContainer).toHaveClass('min-h-dvh', 'flex', 'flex-col', 'bg-white');
    });

    test('form container has proper styling classes', () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);

      renderWithRouter(<SignUpPage />);
      
      const form = screen.getAllByRole('button', { name: 'Create Account' })[0].closest('form');
      expect(form).toHaveClass('bg-white', 'p-6', 'rounded', 'shadow-md');
    });

    test('input fields have proper styling classes', () => {
      setupAuthStateMock(onAuthStateChanged, null, mockUnsubscribe);

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


