import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

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
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  confirmPassword: 'password123',
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

// Common mock setup functions
export const setupAuthStateMock = (onAuthStateChanged, user = null, mockUnsubscribe) => {
  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback(user);
    return mockUnsubscribe;
  });
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
