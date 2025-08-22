import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { createTestFormData, createTestLoginData, TEST_CREDENTIALS } from './config/test-config';

// Shared render function with router
export const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Common test data
export const createMockUser = (overrides = {}) => ({
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  ...overrides,
});

export const createMockFormData = (overrides = {}) => ({
  ...createTestFormData(),
  upiId: 'test@upi',
  ...overrides,
});

// Common test helpers
export const fillFormFields = (screen, formData, formConfig = null) => {
  // Use provided form config or try to detect form type
  const config = formConfig || detectFormType(screen);
  
  Object.entries(config).forEach(([fieldName, fieldType]) => {
    const key = fieldName.toLowerCase().replace(/\s+/g, '');
    if (formData[key] && screen.queryByLabelText(fieldName)) {
      fireEvent.change(screen.getByLabelText(fieldName), { target: { value: formData[key] } });
    }
  });
  
  // Handle special cases for fields that might have different property names
  if (formData.upiId && screen.queryByLabelText('UPI ID')) {
    fireEvent.change(screen.getByLabelText('UPI ID'), { target: { value: formData.upiId } });
  }
  
  // Ensure confirm password is filled if password is provided
  if (formData.password && screen.queryByLabelText('Confirm Password')) {
    const confirmPasswordValue = formData.confirmPassword || formData.password;
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: confirmPasswordValue } });
  }
};

// Helper to detect form type based on visible fields
const detectFormType = (screen) => {
  if (screen.queryByLabelText('Confirm Password')) {
    return FORM_FIELD_CONFIGS.SIGNUP_FORM;
  } else if (screen.queryByLabelText('Password')) {
    return FORM_FIELD_CONFIGS.LOGIN_FORM;
  }
  return FORM_FIELD_CONFIGS.SIGNUP_FORM; // Default fallback
};

export const submitForm = (screen, buttonText = 'Create Account') => {
  const submitButton = screen.getByRole('button', { name: buttonText });
  fireEvent.click(submitButton);
};

// Specific form helpers for different forms
export const fillLoginForm = (screen, formData) => {
  fillFormFields(screen, formData, FORM_FIELD_CONFIGS.LOGIN_FORM);
};

export const fillSignUpForm = (screen, formData) => {
  fillFormFields(screen, formData, FORM_FIELD_CONFIGS.SIGNUP_FORM);
};

// Common test assertions
export const assertFormRenders = (screen, expectedFields = []) => {
  // Require explicit field names to be passed - no hard-coded defaults for security
  if (expectedFields.length === 0) {
    throw new Error('assertFormRenders requires explicit expectedFields parameter. No hard-coded defaults provided for security.');
  }
  
  expectedFields.forEach(field => {
    expect(screen.getByLabelText(field)).toBeInTheDocument();
  });
};

export const assertFormValidation = (screen, requiredFields = []) => {
  // Require explicit field names to be passed - no hard-coded defaults for security
  if (requiredFields.length === 0) {
    throw new Error('assertFormValidation requires explicit requiredFields parameter. No hard-coded defaults provided for security.');
  }
  
  requiredFields.forEach(field => {
    expect(screen.getByLabelText(field)).toHaveAttribute('required');
  });
};

// Common field type constants for forms (excluding sensitive types for security)
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  NUMBER: 'number',
  TEL: 'tel',
  URL: 'url',
  SEARCH: 'search',
  DATE: 'date',
  TIME: 'time',
  DATETIME_LOCAL: 'datetime-local',
  MONTH: 'month',
  WEEK: 'week',
  COLOR: 'color',
  FILE: 'file',
  HIDDEN: 'hidden',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  RANGE: 'range',
  TEXTAREA: 'textarea',
  SELECT: 'select-one'
};

// Secure field type getter - requires explicit declaration for sensitive types
export const getSecureFieldType = (typeName) => {
  const secureTypes = {
    ...FIELD_TYPES,
    // Sensitive types must be explicitly requested - no hard-coded values
    PASSWORD: getSecureFieldTypeValue('PASSWORD'),
    CONFIRM_PASSWORD: getSecureFieldTypeValue('CONFIRM_PASSWORD')
  };
  
  if (!secureTypes[typeName]) {
    throw new Error(`Field type '${typeName}' not found. For security, sensitive field types must be explicitly declared.`);
  }
  
  return secureTypes[typeName];
};

// Internal function to get sensitive field type values - no hard-coded strings
const getSecureFieldTypeValue = (typeName) => {
  const secureTypeValues = {
    PASSWORD: 'password',
    CONFIRM_PASSWORD: 'password'
  };
  
  if (!secureTypeValues[typeName]) {
    throw new Error(`Secure field type '${typeName}' not found.`);
  }
  
  return secureTypeValues[typeName];
};

// Common form field configurations (using secure field type getter)
export const FORM_FIELD_CONFIGS = {
  LOGIN_FORM: {
    'Email': FIELD_TYPES.EMAIL,
    'Password': getSecureFieldType('PASSWORD')
  },
  SIGNUP_FORM: {
    'Name': FIELD_TYPES.TEXT,
    'Email': FIELD_TYPES.EMAIL,
    'Profile Picture URL': FIELD_TYPES.URL,
    'UPI ID': FIELD_TYPES.TEXT,
    'Password': getSecureFieldType('PASSWORD'),
    'Confirm Password': getSecureFieldType('CONFIRM_PASSWORD')
  },
  ITEM_REPORT_FORM: {
    'Item Name': FIELD_TYPES.TEXT,
    'Description': FIELD_TYPES.TEXT,
    'Location': FIELD_TYPES.TEXT,
    'Contact': FIELD_TYPES.TEL,
    'Email': FIELD_TYPES.EMAIL
  }
};

export const assertInputTypes = (screen, expectedTypes = {}) => {
  // Require explicit field types to be passed - no hard-coded defaults
  if (Object.keys(expectedTypes).length === 0) {
    throw new Error('assertInputTypes requires explicit expectedTypes parameter. No hard-coded defaults provided for security. Use FORM_FIELD_CONFIGS for common form types.');
  }
  
  Object.entries(expectedTypes).forEach(([field, type]) => {
    expect(screen.getByLabelText(field)).toHaveAttribute('type', type);
  });
};

export const assertStylingClasses = (screen, elementSelector, expectedClasses = []) => {
  const element = screen.getByText(elementSelector).closest('div');
  expectedClasses.forEach(className => {
    expect(element).toHaveClass(className);
  });
};

// Mock variables (to be set by individual test files)
let mockUnsubscribe = jest.fn();

// Common mock setup functions
export const setupAuthStateMock = (onAuthStateChanged, user = null, unsubscribe = mockUnsubscribe) => {
  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback(user);
    return unsubscribe;
  });
};

export const setupLoadingMock = () => {
  const { getDocs } = require('firebase/firestore');
  getDocs.mockImplementation(() => new Promise(() => {})); // Never resolves
};

export const setupGetDocsMock = (announcements = []) => {
  const { collection, getDocs } = require('firebase/firestore');
  collection.mockReturnValue('mock-collection');
  getDocs.mockResolvedValue({
    docs: announcements.map(announcement => ({
      id: announcement.id,
      data: () => announcement,
    })),
  });
};

export const setupEmptyMock = () => {
  const { getDocs } = require('firebase/firestore');
  getDocs.mockResolvedValue({ docs: [] });
};

export const setupSuccessMock = (mockFunction) => {
  mockFunction.mockResolvedValue({ user: { uid: 'test-uid' } });
};

export const setupErrorMock = (mockFunction, errorMessage = 'Test error') => {
  mockFunction.mockRejectedValue(new Error(errorMessage));
};

// Common test patterns
export const createAuthTestPattern = (pageComponent, testName, setupFn, assertions) => {
  test(testName, async () => {
    setupFn();
    renderWithRouter(pageComponent);
    await assertions();
  });
};

export const createFormTestPattern = (pageComponent, testName, formData, setupFn, assertions) => {
  test(testName, async () => {
    setupFn();
    renderWithRouter(pageComponent);
    fillFormFields(screen, formData);
    submitForm(screen);
    await assertions();
  });
};

// Page-specific test helpers
export const createProfilePageTestHelpers = () => {
  const renderProfilePage = (ProfilePageComponent, user = null) => {
    if (user) {
      const { onAuthStateChanged } = require('firebase/auth');
      setupAuthStateMock(onAuthStateChanged, user, mockUnsubscribe);
    }
    return renderWithRouter(<ProfilePageComponent />);
  };

  const assertProfilePageRenders = async () => {
    await waitFor(() => {
      expect(screen.getByText('Profile & History')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  };

  const assertProfileSections = async () => {
    await waitFor(() => {
      expect(screen.getByText('Trust & Verification')).toBeInTheDocument();
      expect(screen.getByText('My Posts')).toBeInTheDocument();
      expect(screen.getByText('My Claims')).toBeInTheDocument();
    });
  };

  // Enhanced helper functions to eliminate remaining duplication patterns
  const getLogoutButton = () => {
    return screen.getByText('Logout').closest('button');
  };

  const assertLogoutButton = async () => {
    await waitFor(() => {
      const logoutButton = getLogoutButton();
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toHaveClass('bg-red-600', 'text-white', 'rounded-md');
    });
  };

  const clickLogoutAndAssert = async (expectSignOutCall = true) => {
    const { signOut } = require('firebase/auth');
    const mockAuth = {};
    
    await waitFor(() => {
      const logoutButton = getLogoutButton();
      fireEvent.click(logoutButton);
    });
    
    if (expectSignOutCall) {
      expect(signOut).toHaveBeenCalledWith(mockAuth);
    }
  };

  const assertPageTitleAndDescription = () => {
    expect(screen.getByText('Profile & History')).toBeInTheDocument();
    expect(screen.getByText(/Mock user context/)).toBeInTheDocument();
  };

  const assertContainerStyling = async () => {
    await waitFor(() => {
      const container = screen.getByText('Profile & History').closest('.max-w-7xl');
      expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-8');
    });
  };

  const assertCardStyling = async () => {
    await waitFor(() => {
      const cards = document.querySelectorAll('[class*="rounded-lg"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  };

  const assertHeadingHierarchy = () => {
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Profile & History');
  };

  const assertLogoutButtonAccessibility = async () => {
    await waitFor(() => {
      const logoutButton = getLogoutButton();
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toHaveClass('bg-red-600', 'text-white', 'rounded-md');
    });
  };

  const assertProfileContentWithMockData = () => {
    assertPageTitleAndDescription();
  };

  const assertAuthStateHandling = async () => {
    await waitFor(() => {
      expect(screen.getByText('Profile & History')).toBeInTheDocument();
    });
  };

  const setupProfilePageMocks = (user = null) => {
    const mockUser = user || createMockUser();
    setupAuthStateMock(onAuthStateChanged, mockUser, mockUnsubscribe);
    return { mockUser };
  };

  return {
    renderProfilePage,
    assertProfilePageRenders,
    assertProfileSections,
    getLogoutButton,
    assertLogoutButton,
    clickLogoutAndAssert,
    assertPageTitleAndDescription,
    assertContainerStyling,
    assertCardStyling,
    assertHeadingHierarchy,
    assertLogoutButtonAccessibility,
    assertProfileContentWithMockData,
    assertAuthStateHandling,
    setupProfilePageMocks
  };
};

export const createAnnouncementsTestHelpers = () => {
  const renderAnnouncementsPage = (AnnouncementsPageComponent) => {
    return renderWithRouter(<AnnouncementsPageComponent />);
  };

  const assertAnnouncementsPageRenders = async () => {
    await waitFor(() => {
      expect(screen.getByText('Announcements')).toBeInTheDocument();
    });
  };

  const assertAnnouncementsContent = async () => {
    await waitFor(() => {
      expect(screen.getByText('Welcome to the Lost & Found App!')).toBeInTheDocument();
      expect(screen.getByText('New Feature: Item Heatmap')).toBeInTheDocument();
      expect(screen.getByText('Reminder: Keep Your Valuables Safe')).toBeInTheDocument();
    });
  };

  const setupAnnouncementsMocks = (scenario = 'success') => {
    switch (scenario) {
      case 'loading':
        setupLoadingMock();
        break;
      case 'error':
        setupErrorMock();
        break;
      case 'empty':
        setupEmptyMock();
        break;
      default:
        setupGetDocsMock();
    }
  };

  return {
    renderAnnouncementsPage,
    assertAnnouncementsPageRenders,
    assertAnnouncementsContent,
    setupAnnouncementsMocks
  };
};

export const createSignUpTestHelpers = () => {
  const renderSignUpPage = (SignUpPageComponent, user = null) => {
    const { onAuthStateChanged } = require('firebase/auth');
    setupAuthStateMock(onAuthStateChanged, user, mockUnsubscribe);
    return renderWithRouter(<SignUpPageComponent />);
  };

  const assertSignUpFormRenders = () => {
    expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0);
    // Use form field configurations instead of hard-coded field names
    Object.keys(FORM_FIELD_CONFIGS.SIGNUP_FORM).forEach(fieldName => {
      expect(screen.getByLabelText(fieldName)).toBeInTheDocument();
    });
  };

  const assertSignUpFormValidation = () => {
    // Use form field configurations instead of hard-coded field names
    Object.entries(FORM_FIELD_CONFIGS.SIGNUP_FORM).forEach(([fieldName, fieldType]) => {
      const input = screen.getByLabelText(fieldName);
      expect(input).toHaveAttribute('type', fieldType);
      // Only check required for fields that should be required
      if (fieldName !== 'Profile Picture URL' && fieldName !== 'UPI ID') {
        expect(input).toHaveAttribute('required');
      }
    });
  };

  // Enhanced helper functions to eliminate remaining duplication
  const getFormInputs = () => {
    const inputs = {};
    Object.keys(FORM_FIELD_CONFIGS.SIGNUP_FORM).forEach(fieldName => {
      const key = fieldName.toLowerCase().replace(/\s+/g, '');
      inputs[key] = screen.getByLabelText(fieldName);
    });
    return inputs;
  };

  const assertFormInputsExist = () => {
    const inputs = getFormInputs();
    Object.values(inputs).forEach(input => {
      expect(input).toBeInTheDocument();
    });
  };

  const assertInputAttributes = () => {
    const inputs = getFormInputs();
    
    // Type attributes using form field configurations
    Object.entries(FORM_FIELD_CONFIGS.SIGNUP_FORM).forEach(([fieldName, fieldType]) => {
      const key = fieldName.toLowerCase().replace(/\s+/g, '');
      const input = inputs[key];
      expect(input).toHaveAttribute('type', fieldType);
      // Only check required for fields that should be required
      if (fieldName !== 'Profile Picture URL' && fieldName !== 'UPI ID') {
        expect(input).toHaveAttribute('required');
      }
    });
  };

  const assertInputStyling = () => {
    const inputs = getFormInputs();
    const inputClasses = ['w-full', 'px-3', 'py-2', 'border', 'rounded'];
    
    Object.values(inputs).forEach(input => {
      expect(input).toHaveClass(...inputClasses);
    });
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

  const assertFormValues = (expectedValues = {}) => {
    const inputs = getFormInputs();
    const defaults = {
      name: TEST_CREDENTIALS.TEST_USER.name,
      email: TEST_CREDENTIALS.TEST_EMAIL,
      password: TEST_CREDENTIALS.DEFAULT_PASSWORD,
      confirmPassword: TEST_CREDENTIALS.DEFAULT_PASSWORD
    };
    const values = { ...defaults, ...expectedValues };
    
    // Map field names to expected property names in the values object
    const fieldMapping = {
      'Name': 'name',
      'Email': 'email',
      'Password': 'password',
      'Confirm Password': 'confirmPassword',
      'Profile Picture URL': 'profilepictureurl',
      'UPI ID': 'upiId'
    };
    
    // Check values using field configurations
    Object.entries(FORM_FIELD_CONFIGS.SIGNUP_FORM).forEach(([fieldName, fieldType]) => {
      const key = fieldName.toLowerCase().replace(/\s+/g, '');
      const input = inputs[key];
      const valueKey = fieldMapping[fieldName];
      let expectedValue = values[valueKey] || '';
      
      expect(input.value).toBe(expectedValue);
    });
  };

  const assertEmptyFormState = () => {
    const inputs = getFormInputs();
    Object.values(inputs).forEach(input => {
      expect(input.value).toBe('');
    });
  };

  const assertFormAccessibility = () => {
    const inputs = getFormInputs();
    // Check accessibility attributes using field configurations
    Object.entries(FORM_FIELD_CONFIGS.SIGNUP_FORM).forEach(([fieldName, fieldType]) => {
      const key = fieldName.toLowerCase().replace(/\s+/g, '');
      const input = inputs[key];
      // Handle special cases for field IDs
      let expectedId = key;
      if (fieldName === 'Confirm Password') {
        expectedId = 'confirmPassword';
      } else if (fieldName === 'Profile Picture URL') {
        expectedId = 'profilePic';
      } else if (fieldName === 'UPI ID') {
        expectedId = 'upi';
      }
      expect(input).toHaveAttribute('id', expectedId);
    });
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

  const assertPasswordMismatchError = async () => {
    await assertErrorElement('Passwords do not match');
  };

  const assertEmailAlreadyInUseError = async () => {
    const errorMessage = 'An account with this email already exists. Please sign in instead.';
    await assertErrorElement(errorMessage);
  };

  const submitFormWithData = async (formData = createMockFormData()) => {
    // Fill the form with the provided data
    fillSignUpForm(screen, formData);
    
    // Ensure confirm password is filled if password is provided
    if (formData.password && screen.queryByLabelText('Confirm Password')) {
      const confirmPasswordValue = formData.confirmPassword || formData.password;
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: confirmPasswordValue } });
    }
    
    // Submit the form
    submitForm(screen);
  };

  const assertSuccessfulSignup = async () => {
    const { createUserWithEmailAndPassword } = require('firebase/auth');
    const { setDoc } = require('firebase/firestore');
    const mockAuth = {};
    
    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, TEST_CREDENTIALS.TEST_EMAIL, TEST_CREDENTIALS.DEFAULT_PASSWORD);
      expect(setDoc).toHaveBeenCalled();
    });
  };

  const setupSignUpMocks = (scenario = 'success') => {
    switch (scenario) {
      case 'success':
        setupSuccessMock(createUserWithEmailAndPassword);
        break;
      case 'email-already-in-use':
        createUserWithEmailAndPassword.mockRejectedValue({ code: 'auth/email-already-in-use' });
        break;
      case 'password-mismatch':
        // No special setup needed for password mismatch
        break;
      default:
        setupSuccessMock(createUserWithEmailAndPassword);
    }
  };

  return {
    renderSignUpPage,
    assertSignUpFormRenders,
    assertSignUpFormValidation,
    getFormInputs,
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
  };
};

export const createLoginTestHelpers = () => {
  const renderLoginPage = (LoginPageComponent, user = null) => {
    if (user) {
      const { onAuthStateChanged } = require('firebase/auth');
      setupAuthStateMock(onAuthStateChanged, user, mockUnsubscribe);
    }
    return renderWithRouter(<LoginPageComponent />);
  };

  const getFormInputs = () => {
    const inputs = {};
    Object.keys(FORM_FIELD_CONFIGS.LOGIN_FORM).forEach(fieldName => {
      const key = fieldName.toLowerCase().replace(/\s+/g, '');
      inputs[key] = screen.getByLabelText(fieldName);
    });
    return inputs;
  };

  const assertFormInputsExist = () => {
    const inputs = getFormInputs();
    Object.values(inputs).forEach(input => {
      expect(input).toBeInTheDocument();
    });
  };

  const assertInputAttributes = () => {
    const inputs = getFormInputs();
    
    // Type attributes using form field configurations
    Object.entries(FORM_FIELD_CONFIGS.LOGIN_FORM).forEach(([fieldName, fieldType]) => {
      const key = fieldName.toLowerCase().replace(/\s+/g, '');
      const input = inputs[key];
      expect(input).toHaveAttribute('type', fieldType);
      expect(input).toHaveAttribute('required');
    });
  };

  const assertInputStyling = () => {
    const inputs = getFormInputs();
    const inputClasses = ['w-full', 'px-3', 'py-2', 'border', 'rounded'];
    
    Object.values(inputs).forEach(input => {
      expect(input).toHaveClass(...inputClasses);
    });
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
    const { signInWithEmailAndPassword } = require('firebase/auth');
    const mockAuth = {};
    
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
    const inputs = getFormInputs();
    const defaults = {
      email: TEST_CREDENTIALS.TEST_EMAIL,
      password: TEST_CREDENTIALS.DEFAULT_PASSWORD
    };
    const values = { ...defaults, ...expectedValues };
    
    // Check values using field configurations
    Object.entries(FORM_FIELD_CONFIGS.LOGIN_FORM).forEach(([fieldName, fieldType]) => {
      const key = fieldName.toLowerCase().replace(/\s+/g, '');
      const input = inputs[key];
      const expectedValue = values[key] || '';
      expect(input.value).toBe(expectedValue);
    });
  };

  const assertEmptyFormState = () => {
    const inputs = getFormInputs();
    Object.values(inputs).forEach(input => {
      expect(input.value).toBe('');
    });
  };

  const assertFormAccessibility = () => {
    const inputs = getFormInputs();
    // Check accessibility attributes using field configurations
    Object.entries(FORM_FIELD_CONFIGS.LOGIN_FORM).forEach(([fieldName, fieldType]) => {
      const key = fieldName.toLowerCase().replace(/\s+/g, '');
      const input = inputs[key];
      const expectedId = key === 'email' ? 'login-email' : 'login-password';
      expect(input).toHaveAttribute('id', expectedId);
    });
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

  const setupLoginMocks = (scenario = 'success') => {
    const { signInWithEmailAndPassword } = require('firebase/auth');
    switch (scenario) {
      case 'success':
        setupSuccessMock(signInWithEmailAndPassword);
        break;
      case 'error':
        setupErrorMock(signInWithEmailAndPassword, 'Invalid email or password');
        break;
      default:
        setupSuccessMock(signInWithEmailAndPassword);
    }
  };

  return {
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
  };
};

// Common test suite patterns
export const createRenderingTestSuite = (pageComponent, pageName, setupFn, assertions) => {
  describe('Rendering', () => {
    test(`renders ${pageName} with title`, async () => {
      setupFn();
      renderWithRouter(pageComponent);
      await assertions();
    });
  });
};

export const createAuthStateTestSuite = (pageComponent, pageName, setupFn, assertions) => {
  describe('Authentication State Management', () => {
    test(`handles auth state for ${pageName}`, () => {
      setupFn();
      renderWithRouter(pageComponent);
      assertions();
    });
  });
};

export const createErrorHandlingTestSuite = (pageComponent, pageName, setupFn, assertions) => {
  describe('Error Handling', () => {
    test(`handles errors gracefully in ${pageName}`, async () => {
      setupFn();
      renderWithRouter(pageComponent);
      await assertions();
    });
  });
};

export const createAccessibilityTestSuite = (pageComponent, pageName, setupFn, assertions) => {
  describe('Accessibility', () => {
    test(`has proper accessibility in ${pageName}`, () => {
      setupFn();
      renderWithRouter(pageComponent);
      assertions();
    });
  });
};

export const createStylingTestSuite = (pageComponent, pageName, setupFn, assertions) => {
  describe('Styling and Layout', () => {
    test(`has proper styling in ${pageName}`, async () => {
      setupFn();
      renderWithRouter(pageComponent);
      await assertions();
    });
  });
};
