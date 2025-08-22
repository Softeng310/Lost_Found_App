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
export const fillFormFields = (screen, formData) => {
  if (formData.name && screen.queryByLabelText('Name')) {
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: formData.name } });
  }
  if (formData.email && screen.queryByLabelText('Email')) {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: formData.email } });
  }
  if (formData.password && screen.queryByLabelText('Password')) {
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: formData.password } });
  }
  if (formData.confirmPassword && screen.queryByLabelText('Confirm Password')) {
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: formData.confirmPassword } });
  }
  if (formData.upiId && screen.queryByLabelText('UPI ID')) {
    fireEvent.change(screen.getByLabelText('UPI ID'), { target: { value: formData.upiId } });
  }
};

export const submitForm = (screen, buttonText = 'Create Account') => {
  const submitButton = screen.getByRole('button', { name: buttonText });
  fireEvent.click(submitButton);
};

// Specific form helpers for different forms
export const fillLoginForm = (screen, formData) => {
  if (formData.email) {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: formData.email } });
  }
  if (formData.password) {
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: formData.password } });
  }
};

export const fillSignUpForm = (screen, formData) => {
  if (formData.name) {
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: formData.name } });
  }
  if (formData.email) {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: formData.email } });
  }
  if (formData.password) {
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: formData.password } });
  }
  if (formData.confirmPassword) {
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: formData.confirmPassword } });
  }
  if (formData.upiId && screen.queryByLabelText('UPI ID')) {
    fireEvent.change(screen.getByLabelText('UPI ID'), { target: { value: formData.upiId } });
  }
};

// Common test assertions
export const assertFormRenders = (screen, expectedFields = []) => {
  const defaultFields = ['Name', 'Email', 'Password', 'Confirm Password'];
  const fieldsToCheck = expectedFields.length > 0 ? expectedFields : defaultFields;
  
  fieldsToCheck.forEach(field => {
    expect(screen.getByLabelText(field)).toBeInTheDocument();
  });
};

export const assertFormValidation = (screen, requiredFields = []) => {
  const defaultRequired = ['Name', 'Email', 'Password', 'Confirm Password'];
  const fieldsToCheck = requiredFields.length > 0 ? requiredFields : defaultRequired;
  
  fieldsToCheck.forEach(field => {
    expect(screen.getByLabelText(field)).toHaveAttribute('required');
  });
};

// Common field type constants for forms
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
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

// Common form field configurations
export const FORM_FIELD_CONFIGS = {
  LOGIN_FORM: {
    'Email': FIELD_TYPES.EMAIL,
    'Password': FIELD_TYPES.PASSWORD
  },
  SIGNUP_FORM: {
    'Name': FIELD_TYPES.TEXT,
    'Email': FIELD_TYPES.EMAIL,
    'Password': FIELD_TYPES.PASSWORD,
    'Confirm Password': FIELD_TYPES.PASSWORD
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
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  };

  const assertSignUpFormValidation = () => {
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
  };

  // Enhanced helper functions to eliminate remaining duplication
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
    
    // Type attributes using constants
    expect(name).toHaveAttribute('type', FIELD_TYPES.TEXT);
    expect(email).toHaveAttribute('type', FIELD_TYPES.EMAIL);
    expect(password).toHaveAttribute('type', FIELD_TYPES.PASSWORD);
    expect(confirmPassword).toHaveAttribute('type', FIELD_TYPES.PASSWORD);
    
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

  const assertPasswordMismatchError = async () => {
    await assertErrorElement('Passwords do not match');
  };

  const assertEmailAlreadyInUseError = async () => {
    const errorMessage = 'An account with this email already exists. Please sign in instead.';
    await assertErrorElement(errorMessage);
  };

  const submitFormWithData = async (formData = createMockFormData()) => {
    fillSignUpForm(screen, formData);
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
    
    // Type attributes using constants
    expect(email).toHaveAttribute('type', FIELD_TYPES.EMAIL);
    expect(password).toHaveAttribute('type', FIELD_TYPES.PASSWORD);
    
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
