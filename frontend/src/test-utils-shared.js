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

export const assertInputTypes = (screen, expectedTypes = {}) => {
  const defaultTypes = {
    'Name': 'text',
    'Email': 'email',
    'Password': 'password',
    'Confirm Password': 'password',
  };
  const typesToCheck = { ...defaultTypes, ...expectedTypes };
  
  Object.entries(typesToCheck).forEach(([field, type]) => {
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

  const setupProfilePageMocks = (user = null) => {
    const mockUser = user || createMockUser();
    setupAuthStateMock(onAuthStateChanged, mockUser, mockUnsubscribe);
    return { mockUser };
  };

  return {
    renderProfilePage,
    assertProfilePageRenders,
    assertProfileSections,
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
    setupSignUpMocks
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
