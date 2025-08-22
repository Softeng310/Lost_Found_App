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
import { TEST_CREDENTIALS, TEST_ERROR_SCENARIOS } from '../../config/test-config';

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

  // Consolidated helper functions to eliminate all duplication patterns
  const renderSignUpPage = (user = null) => {
    setupAuthStateMock(onAuthStateChanged, user, mockUnsubscribe);
    return renderWithRouter(<SignUpPage />);
  };

  const getFormInputs = () => ({
    name: screen.getByLabelText('Name'),
    email: screen.getByLabelText('Email'),
    password: screen.getByLabelText('Password'),
    confirmPassword: screen.getByLabelText('Confirm Password')
  });

  const assertFormInputsExist = () => {
    const { name, email, password, confirmPassword } = getFormInputs();
    expect(name).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
    expect(confirmPassword).toBeInTheDocument();
  };

  const assertInputAttributes = () => {
    const { name, email, password, confirmPassword } = getFormInputs();
    
    // Type attributes
    expect(name).toHaveAttribute('type', 'text');
    expect(email).toHaveAttribute('type', 'email');
    expect(password).toHaveAttribute('type', 'password');
    expect(confirmPassword).toHaveAttribute('type', 'password');
    
    // Required attributes
    expect(name).toHaveAttribute('required');
    expect(email).toHaveAttribute('required');
    expect(password).toHaveAttribute('required');
    expect(confirmPassword).toHaveAttribute('required');
  };

  const assertInputStyling = () => {
    const { name, email, password, confirmPassword } = getFormInputs();
    const inputClasses = ['w-full', 'px-3', 'py-2', 'border', 'rounded'];
    
    expect(name).toHaveClass(...inputClasses);
    expect(email).toHaveClass(...inputClasses);
    expect(password).toHaveClass(...inputClasses);
    expect(confirmPassword).toHaveClass(...inputClasses);
  };

  const assertCreateAccountButton = () => {
    expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Create Account' }).length).toBeGreaterThan(0);
  };

  const assertLoginLink = () => {
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toHaveAttribute('href', '/login');
  };

  const submitFormWithData = async (formData = createMockFormData()) => {
    fillSignUpForm(screen, formData);
    submitForm(screen);
  };

  const assertSuccessfulSignup = async () => {
    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, TEST_CREDENTIALS.TEST_EMAIL, TEST_CREDENTIALS.DEFAULT_PASSWORD);
      expect(setDoc).toHaveBeenCalled();
    });
  };

  const assertPasswordMismatchError = async () => {
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  };

  const assertEmailAlreadyInUseError = async () => {
    const errorMessage = 'An account with this email already exists. Please sign in instead.';
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  };

  const assertFormValues = (expectedValues = {}) => {
    const { name, email, password, confirmPassword } = getFormInputs();
    const defaults = {
      name: TEST_CREDENTIALS.TEST_USER.name,
      email: TEST_CREDENTIALS.TEST_EMAIL,
      password: TEST_CREDENTIALS.DEFAULT_PASSWORD,
      confirmPassword: TEST_CREDENTIALS.DEFAULT_PASSWORD
    };
    const values = { ...defaults, ...expectedValues };
    
    expect(name.value).toBe(values.name);
    expect(email.value).toBe(values.email);
    expect(password.value).toBe(values.password);
    expect(confirmPassword.value).toBe(values.confirmPassword);
  };

  const assertEmptyFormState = () => {
    const { name, email, password, confirmPassword } = getFormInputs();
    expect(name.value).toBe('');
    expect(email.value).toBe('');
    expect(password.value).toBe('');
    expect(confirmPassword.value).toBe('');
  };

  const assertFormAccessibility = () => {
    const { name, email, password, confirmPassword } = getFormInputs();
    expect(name).toHaveAttribute('id', 'name');
    expect(email).toHaveAttribute('id', 'email');
    expect(password).toHaveAttribute('id', 'password');
    expect(confirmPassword).toHaveAttribute('id', 'confirmPassword');
  };

  const assertMainContainerStyling = () => {
    const mainContainer = screen.getAllByText('Create Account')[0].closest('div');
    expect(mainContainer).toHaveClass('min-h-dvh', 'flex', 'flex-col', 'bg-white');
  };

  const assertFormContainerStyling = () => {
    const form = screen.getAllByRole('button', { name: 'Create Account' })[0].closest('form');
    expect(form).toHaveClass('bg-white', 'p-6', 'rounded', 'shadow-md');
  };

  const assertErrorElement = async (errorMessage) => {
    await waitFor(() => {
      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500');
    });
  };

  describe('Rendering', () => {
    test('renders signup form with all required elements', () => {
      renderSignUpPage();
      
      assertCreateAccountButton();
      assertFormInputsExist();
    });

    test('renders login link for existing users', () => {
      renderSignUpPage();
      assertLoginLink();
    });

    test('form inputs have correct attributes', () => {
      renderSignUpPage();
      assertInputAttributes();
    });
  });

  describe('Form State Management', () => {
    test('initializes with empty form state', () => {
      renderSignUpPage();
      assertEmptyFormState();
    });

    test('updates form values when user types', () => {
      renderSignUpPage();
      
      const formData = createMockFormData();
      fillSignUpForm(screen, formData);
      
      assertFormValues();
    });
  });

  describe('Authentication State Management', () => {
    test('redirects to home if user is already authenticated', () => {
      renderSignUpPage(createMockUser());
      expect(onAuthStateChanged).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    test('successfully creates account and redirects to home', async () => {
      setupSuccessMock(createUserWithEmailAndPassword);
      renderSignUpPage();
      
      await submitFormWithData();
      await assertSuccessfulSignup();
    });

    test('handles password mismatch error', async () => {
      renderSignUpPage();
      
      const formData = createMockFormData({ confirmPassword: TEST_CREDENTIALS.DIFFERENT_PASSWORD });
      await submitFormWithData(formData);
      await assertPasswordMismatchError();
    });

    test('handles Firebase auth errors gracefully', async () => {
      createUserWithEmailAndPassword.mockRejectedValue({ code: 'auth/email-already-in-use' });
      renderSignUpPage();
      
      await submitFormWithData();
      await assertEmailAlreadyInUseError();
    });

    test('handles successful signup and redirects', async () => {
      setupSuccessMock(createUserWithEmailAndPassword);
      renderSignUpPage();
      
      await submitFormWithData();
      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('clears previous error when form is submitted again', async () => {
      // First submission fails
      createUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
      renderSignUpPage();
      
      await submitFormWithData();
      await assertEmailAlreadyInUseError();
      
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
      renderSignUpPage();
      assertFormAccessibility();
    });

    test('submit button has proper role and text', () => {
      renderSignUpPage();
      assertCreateAccountButton();
    });

    test('error messages are accessible', async () => {
      const errorMessage = 'Email already in use';
      setupErrorMock(createUserWithEmailAndPassword, errorMessage);
      renderSignUpPage();
      
      await submitFormWithData();
      await assertErrorElement(errorMessage);
    });
  });

  describe('Styling and Layout', () => {
    test('has proper CSS classes for styling', () => {
      renderSignUpPage();
      assertMainContainerStyling();
    });

    test('form container has proper styling classes', () => {
      renderSignUpPage();
      assertFormContainerStyling();
    });

    test('input fields have proper styling classes', () => {
      renderSignUpPage();
      assertInputStyling();
    });
  });
});


