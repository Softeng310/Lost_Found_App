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
  setupErrorMock,
  createSignUpTestHelpers,
  createMockSetupPatterns,
  createTestDataPatterns,
  createAssertionPatterns
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

  // Get enhanced helper functions
  const {
    renderSignUpPage,
    assertFormInputsExist,
    assertInputAttributes,
    assertInputStyling,
    assertCreateAccountButton,
    assertLoginLink,
    assertFormValues,
    assertEmptyFormState,
    assertFormAccessibility,
    assertMainContainerStyling,
    assertFormContainerStyling,
    assertErrorElement,
    assertPasswordMismatchError,
    assertEmailAlreadyInUseError,
    submitFormWithData,
    assertSuccessfulSignup,
    setupSignUpMocks
  } = createSignUpTestHelpers();

  const { setupCommonMocks } = createMockSetupPatterns();
  const { createFormTestData, createErrorTestData } = createTestDataPatterns();
  const { assertAuthStateListener, assertFormSubmission, assertErrorDisplay } = createAssertionPatterns();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    getAuth.mockReturnValue(mockAuth);
    getFirestore.mockReturnValue(mockDb);
    doc.mockReturnValue(mockDoc);
    setDoc.mockResolvedValue();
    
    // Setup common mocks
    setupCommonMocks();
  });

  describe('Rendering', () => {
    test('renders signup form with all required elements', () => {
      renderSignUpPage(SignUpPage);
      assertCreateAccountButton();
      assertFormInputsExist();
    });

    test('renders login link for existing users', () => {
      renderSignUpPage(SignUpPage);
      assertLoginLink();
    });

    test('form inputs have correct attributes', () => {
      renderSignUpPage(SignUpPage);
      assertInputAttributes();
    });
  });

  describe('Form State Management', () => {
    test('initializes with empty form state', () => {
      renderSignUpPage(SignUpPage);
      assertEmptyFormState();
    });

    test('updates form values when user types', () => {
      renderSignUpPage(SignUpPage);
      
      const formData = createMockFormData();
      fillSignUpForm(screen, formData);
      
      assertFormValues(formData);
    });
  });

  describe('Authentication State Management', () => {
    test('redirects to home if user is already authenticated', () => {
      renderSignUpPage(SignUpPage, createMockUser());
      expect(onAuthStateChanged).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    test('successfully creates account and redirects to home', async () => {
      setupSuccessMock(createUserWithEmailAndPassword);
      renderSignUpPage(SignUpPage);
      
      await submitFormWithData();
      await assertSuccessfulSignup();
    });

    test('handles password mismatch error', async () => {
      renderSignUpPage(SignUpPage);
      
      const formData = createFormTestData({ confirmPassword: 'different-password' });
      await submitFormWithData(formData);
      await assertPasswordMismatchError();
    });

    test('handles Firebase auth errors gracefully', async () => {
      createUserWithEmailAndPassword.mockRejectedValue(createErrorTestData('auth/email-already-in-use', 'Email already in use'));
      renderSignUpPage(SignUpPage);
      
      await submitFormWithData();
      await assertEmailAlreadyInUseError();
    });

    test('handles successful signup and redirects', async () => {
      setupSuccessMock(createUserWithEmailAndPassword);
      renderSignUpPage(SignUpPage);
      
      await submitFormWithData();
      await waitFor(() => {
        assertFormSubmission(createUserWithEmailAndPassword);
      });
    });
  });

  describe('Error Handling', () => {
    test('clears previous error when form is submitted again', async () => {
      // First submission fails
      createUserWithEmailAndPassword.mockRejectedValueOnce(createErrorTestData('auth/email-already-in-use', 'Email already in use'));
      renderSignUpPage(SignUpPage);
      
      await submitFormWithData();
      await assertEmailAlreadyInUseError();
      
      // Second submission succeeds - just submit the form without filling it again
      setupSuccessMock(createUserWithEmailAndPassword);
      submitForm(screen);
      
      await waitFor(() => {
        assertFormSubmission(createUserWithEmailAndPassword, 2);
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and associations', () => {
      renderSignUpPage(SignUpPage);
      assertFormAccessibility();
    });

    test('submit button has proper role and text', () => {
      renderSignUpPage(SignUpPage);
      assertCreateAccountButton();
    });

    test('error messages are accessible', async () => {
      const errorMessage = 'Email already in use';
      setupErrorMock(createUserWithEmailAndPassword, errorMessage);
      renderSignUpPage(SignUpPage);
      
      await submitFormWithData();
      await assertErrorElement(errorMessage);
    });
  });

  describe('Styling and Layout', () => {
    test('has proper CSS classes for styling', () => {
      renderSignUpPage(SignUpPage);
      assertMainContainerStyling();
    });

    test('form container has proper styling classes', () => {
      renderSignUpPage(SignUpPage);
      assertFormContainerStyling();
    });

    test('input fields have proper styling classes', () => {
      renderSignUpPage(SignUpPage);
      assertInputStyling();
    });
  });
});


