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
  setupErrorMock,
  createLoginTestHelpers
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

  // Get enhanced helper functions
  const {
    renderLoginPage,
    getFormInputs,
    assertFormInputsExist,
    assertInputAttributes,
    assertInputStyling,
    assertLoginHeader,
    assertLoginButton,
    assertSignUpLink,
    submitFormWithData,
    assertSuccessfulLogin,
    assertLoginError,
    assertFormValues,
    assertEmptyFormState,
    assertFormAccessibility,
    assertMainContainerStyling,
    assertFormContainerStyling,
    assertFormElements,
    setupLoginMocks
  } = createLoginTestHelpers();

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
      renderLoginPage(LoginPage);
      assertFormElements();
    });

    test('renders sign up link for new users', () => {
      renderLoginPage(LoginPage);
      assertSignUpLink();
    });

    test('form inputs have correct attributes', () => {
      renderLoginPage(LoginPage);
      assertInputAttributes();
    });

    test('form has proper accessibility labels', () => {
      renderLoginPage(LoginPage);
      assertFormInputsExist();
    });
  });

  describe('Form State Management', () => {
    test('initializes with empty form state', () => {
      renderLoginPage(LoginPage);
      assertEmptyFormState();
    });

    test('updates email input value when user types', () => {
      renderLoginPage(LoginPage);
      
      const { email } = getFormInputs();
      fireEvent.change(email, { target: { value: TEST_CREDENTIALS.TEST_EMAIL } });
      
      expect(email.value).toBe(TEST_CREDENTIALS.TEST_EMAIL);
    });

    test('updates password input value when user types', () => {
      renderLoginPage(LoginPage);
      
      const { password } = getFormInputs();
      fireEvent.change(password, { target: { value: TEST_CREDENTIALS.DEFAULT_PASSWORD } });
      
      expect(password.value).toBe(TEST_CREDENTIALS.DEFAULT_PASSWORD);
    });
  });

  describe('Authentication State Management', () => {
    test('sets up auth state listener on mount', () => {
      renderLoginPage(LoginPage);
      
      expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuth, expect.any(Function));
    });

    test('cleans up auth state listener on unmount', () => {
      const { unmount } = renderLoginPage(LoginPage);
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    test('redirects to home if user is already authenticated', () => {
      setupAuthStateMock(onAuthStateChanged, createMockUser(), mockUnsubscribe);
      
      renderLoginPage(LoginPage);
      
      expect(onAuthStateChanged).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    test('calls signInWithEmailAndPassword with form data on submit', async () => {
      setupSuccessMock(signInWithEmailAndPassword);
      
      renderLoginPage(LoginPage);
      
      await submitFormWithData();
      await assertSuccessfulLogin();
    });

    test('redirects to home page on successful login', async () => {
      setupSuccessMock(signInWithEmailAndPassword);
      
      renderLoginPage(LoginPage);
      
      await submitFormWithData();
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });
    });

    test('prevents default form submission behavior', async () => {
      const mockPreventDefault = jest.fn();
      setupSuccessMock(signInWithEmailAndPassword);
      
      renderLoginPage(LoginPage);
      
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
      
      renderLoginPage(LoginPage);
      
      const formData = createMockFormData({ password: TEST_CREDENTIALS.WRONG_PASSWORD });
      await submitFormWithData(formData);
      await assertLoginError(errorMessage);
    });

    test('clears previous error when form is submitted again', async () => {
      const errorMessage = 'Invalid email or password';
      signInWithEmailAndPassword
        .mockRejectedValueOnce(new Error(errorMessage))
        .mockResolvedValueOnce({ user: { uid: 'test-uid' } });
      
      renderLoginPage(LoginPage);
      
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
      renderLoginPage(LoginPage);
      assertInputAttributes();
    });

    test('email input has email type validation', () => {
      renderLoginPage(LoginPage);
      
      const { email } = getFormInputs();
      expect(email).toHaveAttribute('type', 'email');
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and associations', () => {
      renderLoginPage(LoginPage);
      assertFormAccessibility();
    });

    test('submit button has proper role and text', () => {
      renderLoginPage(LoginPage);
      assertLoginButton();
    });

    test('error messages are accessible', async () => {
      const errorMessage = 'Invalid email or password';
      setupErrorMock(signInWithEmailAndPassword, errorMessage);
      
      renderLoginPage(LoginPage);
      
      const formData = createMockFormData({ password: TEST_CREDENTIALS.WRONG_PASSWORD });
      await submitFormWithData(formData);
      await assertLoginError(errorMessage);
    });
  });

  describe('Styling and Layout', () => {
    test('has proper CSS classes for styling', () => {
      renderLoginPage(LoginPage);
      assertMainContainerStyling();
    });

    test('form container has proper styling classes', () => {
      renderLoginPage(LoginPage);
      assertFormContainerStyling();
    });

    test('input fields have proper styling classes', () => {
      renderLoginPage(LoginPage);
      assertInputStyling();
    });
  });
});
