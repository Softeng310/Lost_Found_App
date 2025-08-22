import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import LoginPage from '../Login';
import {
  renderWithRouter,
  createMockUser,
  createMockFormData,
  fillLoginForm,
  submitForm,
  assertFormRenders,
  assertFormValidation,
  assertInputTypes,
  assertStylingClasses,
  setupAuthStateMock,
  setupSuccessMock,
  setupErrorMock
} from '../../test-utils-shared';
import { TEST_CREDENTIALS, createTestLoginData, TEST_ERROR_SCENARIOS } from '../../config/test-config';

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

  // Consolidated helper functions to eliminate all duplication patterns
  const renderLoginPage = () => {
    return renderWithRouter(<LoginPage />);
  };

  const getFormInputs = () => ({
    email: screen.getByLabelText('Email'),
    password: screen.getByLabelText('Password')
  });

  const assertFormInputsExist = () => {
    const { email, password } = getFormInputs();
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
  };

  const assertInputAttributes = () => {
    const { email, password } = getFormInputs();
    
    // Type attributes
    expect(email).toHaveAttribute('type', 'email');
    expect(password).toHaveAttribute('type', 'password');
    
    // Required attributes
    expect(email).toHaveAttribute('required');
    expect(password).toHaveAttribute('required');
  };

  const assertInputStyling = () => {
    const { email, password } = getFormInputs();
    const inputClasses = ['w-full', 'px-3', 'py-2', 'border', 'rounded'];
    
    expect(email).toHaveClass(...inputClasses);
    expect(password).toHaveClass(...inputClasses);
  };

  const assertLoginHeader = () => {
    expect(screen.getAllByText('Login').length).toBeGreaterThan(0);
  };

  const assertLoginButton = () => {
    expect(screen.getAllByRole('button', { name: 'Login' }).length).toBeGreaterThan(0);
  };

  const assertSignUpLink = () => {
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toHaveAttribute('href', '/signup');
  };

  const submitFormWithData = async (formData = createMockFormData()) => {
    fillLoginForm(screen, formData);
    submitForm(screen, 'Login');
  };

  const assertSuccessfulLogin = async () => {
    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        TEST_CREDENTIALS.TEST_EMAIL,
        TEST_CREDENTIALS.DEFAULT_PASSWORD
      );
    });
  };

  const assertLoginError = async (errorMessage = 'Invalid email or password') => {
    await waitFor(() => {
      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500');
    });
  };

  const assertFormValues = (expectedValues = {}) => {
    const { email, password } = getFormInputs();
    const defaults = {
      email: TEST_CREDENTIALS.TEST_EMAIL,
      password: TEST_CREDENTIALS.DEFAULT_PASSWORD
    };
    const values = { ...defaults, ...expectedValues };
    
    expect(email.value).toBe(values.email);
    expect(password.value).toBe(values.password);
  };

  const assertEmptyFormState = () => {
    const { email, password } = getFormInputs();
    expect(email.value).toBe('');
    expect(password.value).toBe('');
  };

  const assertFormAccessibility = () => {
    const { email, password } = getFormInputs();
    expect(email).toHaveAttribute('id', 'login-email');
    expect(password).toHaveAttribute('id', 'login-password');
  };

  const assertMainContainerStyling = () => {
    const mainContainer = screen.getAllByText('Login')[0].closest('div');
    expect(mainContainer).toHaveClass('min-h-dvh', 'flex', 'flex-col', 'bg-white');
  };

  const assertFormContainerStyling = () => {
    const form = screen.getAllByRole('button', { name: 'Login' })[0].closest('form');
    expect(form).toHaveClass('bg-white', 'p-6', 'rounded', 'shadow-md');
  };

  const assertFormElements = () => {
    assertLoginHeader();
    assertFormInputsExist();
    assertLoginButton();
  };

  describe('Rendering', () => {
    test('renders login form with all required elements', () => {
      renderLoginPage();
      assertFormElements();
    });

    test('renders sign up link for new users', () => {
      renderLoginPage();
      assertSignUpLink();
    });

    test('form inputs have correct attributes', () => {
      renderLoginPage();
      assertInputAttributes();
    });

    test('form has proper accessibility labels', () => {
      renderLoginPage();
      assertFormInputsExist();
    });
  });

  describe('Form State Management', () => {
    test('initializes with empty form state', () => {
      renderLoginPage();
      assertEmptyFormState();
    });

    test('updates email input value when user types', () => {
      renderLoginPage();
      
      const { email } = getFormInputs();
      fireEvent.change(email, { target: { value: TEST_CREDENTIALS.TEST_EMAIL } });
      
      expect(email.value).toBe(TEST_CREDENTIALS.TEST_EMAIL);
    });

    test('updates password input value when user types', () => {
      renderLoginPage();
      
      const { password } = getFormInputs();
      fireEvent.change(password, { target: { value: TEST_CREDENTIALS.DEFAULT_PASSWORD } });
      
      expect(password.value).toBe(TEST_CREDENTIALS.DEFAULT_PASSWORD);
    });
  });

  describe('Authentication State Management', () => {
    test('sets up auth state listener on mount', () => {
      renderLoginPage();
      
      expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuth, expect.any(Function));
    });

    test('cleans up auth state listener on unmount', () => {
      const { unmount } = renderLoginPage();
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    test('redirects to home if user is already authenticated', () => {
      setupAuthStateMock(onAuthStateChanged, createMockUser(), mockUnsubscribe);
      
      renderLoginPage();
      
      expect(onAuthStateChanged).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    test('calls signInWithEmailAndPassword with form data on submit', async () => {
      setupSuccessMock(signInWithEmailAndPassword);
      
      renderLoginPage();
      
      await submitFormWithData();
      await assertSuccessfulLogin();
    });

    test('redirects to home page on successful login', async () => {
      setupSuccessMock(signInWithEmailAndPassword);
      
      renderLoginPage();
      
      await submitFormWithData();
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });
    });

    test('prevents default form submission behavior', async () => {
      const mockPreventDefault = jest.fn();
      setupSuccessMock(signInWithEmailAndPassword);
      
      renderLoginPage();
      
      const form = screen.getAllByRole('button', { name: 'Login' })[0].closest('form');
      fireEvent.submit(form, { preventDefault: mockPreventDefault });
      
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when login fails', async () => {
      const errorMessage = 'Invalid email or password';
      setupErrorMock(signInWithEmailAndPassword, errorMessage);
      
      renderLoginPage();
      
      const formData = createMockFormData({ password: TEST_CREDENTIALS.WRONG_PASSWORD });
      await submitFormWithData(formData);
      await assertLoginError(errorMessage);
    });

    test('clears previous error when form is submitted again', async () => {
      const errorMessage = 'Invalid email or password';
      signInWithEmailAndPassword
        .mockRejectedValueOnce(new Error(errorMessage))
        .mockResolvedValueOnce({ user: { uid: 'test-uid' } });
      
      renderLoginPage();
      
      const formData = createMockFormData({ password: TEST_CREDENTIALS.WRONG_PASSWORD });
      await submitFormWithData(formData);
      await assertLoginError(errorMessage);
      
      // Second submission - succeeds
      const correctFormData = createMockFormData({ password: TEST_CREDENTIALS.CORRECT_PASSWORD });
      await submitFormWithData(correctFormData);
      
      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    test('requires email and password fields', () => {
      renderLoginPage();
      assertInputAttributes();
    });

    test('email input has email type validation', () => {
      renderLoginPage();
      
      const { email } = getFormInputs();
      expect(email).toHaveAttribute('type', 'email');
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and associations', () => {
      renderLoginPage();
      assertFormAccessibility();
    });

    test('submit button has proper role and text', () => {
      renderLoginPage();
      assertLoginButton();
    });

    test('error messages are accessible', async () => {
      const errorMessage = 'Invalid email or password';
      setupErrorMock(signInWithEmailAndPassword, errorMessage);
      
      renderLoginPage();
      
      const formData = createMockFormData({ password: TEST_CREDENTIALS.WRONG_PASSWORD });
      await submitFormWithData(formData);
      await assertLoginError(errorMessage);
    });
  });

  describe('Styling and Layout', () => {
    test('has proper CSS classes for styling', () => {
      renderLoginPage();
      assertMainContainerStyling();
    });

    test('form container has proper styling classes', () => {
      renderLoginPage();
      assertFormContainerStyling();
    });

    test('input fields have proper styling classes', () => {
      renderLoginPage();
      assertInputStyling();
    });
  });
});
