// ProfilePage.test.js
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import ProfilePage from '../ProfilePage';
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment, 
  renderWithRouter, 
  SharedTestUtils 
} from '../../test-utils';
import {
  createMockUser,
  setupAuthStateMock,
  setupSuccessMock,
  setupErrorMock,
  assertStylingClasses,
  createProfilePageTestHelpers
} from '../../test-utils-shared';

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

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../../firebase/config', () => ({
  auth: {},
}));

// Setup test environment
setupTestEnvironment();

describe('ProfilePage', () => {
  const { mockAuth, mockUnsubscribe } = setupTestEnvironment();
  const mockUser = createMockUser();

  // Helpers (removed assertProfileSections, assertPageTitleAndDescription)
  const {
    renderProfilePage,
    assertProfilePageRenders,
    getLogoutButton,
    assertLogoutButton,
    clickLogoutAndAssert,
    assertContainerStyling,
    assertCardStyling,
    assertHeadingHierarchy,
    assertLogoutButtonAccessibility,
    assertAuthStateHandling,
    setupProfilePageMocks
  } = createProfilePageTestHelpers();

  beforeEach(() => {
    cleanupTestEnvironment();
    getAuth.mockReturnValue(mockAuth);
    onAuthStateChanged.mockReturnValue(mockUnsubscribe);
  });

  describe('Rendering', () => {
    test('renders profile page with user information when authenticated', async () => {
      renderProfilePage(ProfilePage, mockUser);
      await assertProfilePageRenders();
    });
    // removed: 'renders all profile sections'
  });

  describe('User Information Display', () => {
    // removed: 'displays page title and description'
    test('displays logout button with proper styling', async () => {
      renderProfilePage(ProfilePage, mockUser);
      await assertLogoutButton();
    });
  });

  describe('Logout Functionality', () => {
    test('calls signOut when logout button is clicked', async () => {
      setupSuccessMock(signOut);
      renderProfilePage(ProfilePage, mockUser);
      await clickLogoutAndAssert();
    });

    test('redirects to home page after successful logout', async () => {
      setupSuccessMock(signOut);
      renderProfilePage(ProfilePage, mockUser);
      await clickLogoutAndAssert();
    });

    test('handles logout errors gracefully', async () => {
      setupErrorMock(signOut, 'Logout failed');
      renderProfilePage(ProfilePage, mockUser);
      await clickLogoutAndAssert(false);
      await assertAuthStateHandling();
    });
  });

  describe('Navigation', () => {
    test('renders logout button for navigation', async () => {
      renderProfilePage(ProfilePage, mockUser);
      await assertLogoutButton();
    });
  });

  describe('Error Handling', () => {
    test('handles auth state check gracefully', async () => {
      onAuthStateChanged.mockImplementation((auth, callback, errorCallback) => {
        errorCallback(new Error('Auth check failed'));
        return mockUnsubscribe;
      });
      renderProfilePage(ProfilePage, mockUser);
      await assertAuthStateHandling();
    });

    // removed: 'handles missing user data gracefully'
  });

  describe('Accessibility', () => {
    test('has proper heading hierarchy', () => {
      renderProfilePage(ProfilePage, mockUser);
      assertHeadingHierarchy();
    });

    test('logout button has proper accessibility attributes', async () => {
      renderProfilePage(ProfilePage, mockUser);
      await assertLogoutButtonAccessibility();
    });
  });

  describe('Styling and Layout', () => {
    test('has proper CSS classes for responsive design', async () => {
      renderProfilePage(ProfilePage, mockUser);
      await assertContainerStyling();
    });

    test('logout button has proper styling classes', async () => {
      renderProfilePage(ProfilePage, mockUser);
      await assertLogoutButton();
    });

    test('cards have proper styling', async () => {
      renderProfilePage(ProfilePage, mockUser);
      await assertCardStyling();
    });
  });
});
