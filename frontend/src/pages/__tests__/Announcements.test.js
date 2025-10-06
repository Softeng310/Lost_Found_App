import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AnnouncementsPage from '../Announcements';
import { setupTestEnvironment, cleanupTestEnvironment, renderWithRouter } from '../../test-utils';
import {
  setupConsoleErrorSuppression,
  setupFirebaseMocks,
  setupGlobalFetchMock,
  createMockDoc,
  setupGetDocsMock,
  setupLoadingMock,
  assertTextContent
} from '../../test-utils-shared';

// Mock Firebase modules
jest.mock('firebase/firestore');
jest.mock('firebase/auth');
jest.mock('../../firebase/config', () => ({
  db: {},
}));

// Setup all common mocks
setupConsoleErrorSuppression();
setupGlobalFetchMock({ announcements: [] });

// Setup test environment
setupTestEnvironment();

describe('AnnouncementsPage', () => {
  const mockAnnouncements = [
    {
      id: '1',
      title: 'iPad Pro Found',
      announcement: 'An iPad Pro was found in the Business School lecture theatre OGGB3. Please contact lost and found with a description to claim.',
      datePosted: '2024-01-01T10:00:00.000Z',
    },
    {
      id: '2',
      title: 'Umbrella Reported',
      announcement: 'Umbrella near elevator on Engineering lvl 4 has been reported.',
      datePosted: '2024-01-02T10:00:00.000Z',
    },
  ];

  const mockStaffUser = {
    uid: 'staff-uid',
    email: 'staff@example.com',
  };

  const mockStudentUser = {
    uid: 'student-uid',
    email: 'student@example.com',
  };

  const mockUnsubscribe = jest.fn();

  // Helper functions
  const renderAnnouncementsPage = () => renderWithRouter(<AnnouncementsPage />);
  
  const assertPageTitle = async () => await assertTextContent('Announcements');
  
  const assertAllAnnouncementsRendered = async () => {
    await assertTextContent('iPad Pro Found');
    await assertTextContent('Umbrella Reported');
  };

  const assertAnnouncementContent = async () => {
    await assertTextContent('An iPad Pro was found in the Business School lecture theatre OGGB3. Please contact lost and found with a description to claim.');
    await assertTextContent('Umbrella near elevator on Engineering lvl 4 has been reported.');
  };

  const assertAnnouncementDates = async () => {
    await waitFor(() => {
      const dateElements = document.querySelectorAll('[class*="bg-emerald-100"]');
      expect(dateElements.length).toBeGreaterThan(0);
    });
  };

  const assertAnnouncementCards = async () => {
    await waitFor(() => {
      const cards = document.querySelectorAll('.bg-white.border.border-emerald-200');
      expect(cards.length).toBeGreaterThan(0);
    });
  };

  const assertPageContainer = async () => {
    await waitFor(() => {
      const container = document.querySelector('.min-h-screen.bg-white');
      expect(container).toBeInTheDocument();
    });
  };

  const setupAnnouncementsMocks = (announcements = mockAnnouncements, user = null, userRole = 'student') => {
    // Mock getDocs for announcements
    getDocs.mockResolvedValue({
      docs: announcements.map(item => ({
        id: item.id,
        data: () => item,
      })),
    });

    // Mock auth
    getAuth.mockReturnValue({});
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(user);
      return mockUnsubscribe;
    });

    // Mock getDoc for user role
    if (user) {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: userRole }),
      });
    } else {
      getDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      });
    }

    collection.mockReturnValue('mock-collection');
    doc.mockReturnValue('mock-doc');
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cleanupTestEnvironment();
    setupAnnouncementsMocks();
  });

  describe('Rendering', () => {
    test('renders announcements page with title', async () => {
      renderAnnouncementsPage();
      await assertPageTitle();
    });

    test('renders all announcements from mock data', async () => {
      renderAnnouncementsPage();
      await assertAllAnnouncementsRendered();
    });

    test('renders announcement content', async () => {
      renderAnnouncementsPage();
      await assertAnnouncementContent();
    });

    test('renders announcement dates', async () => {
      renderAnnouncementsPage();
      await assertAnnouncementDates();
    });
  });

  describe('Loading State', () => {
    test('shows loading state initially', () => {
      setupLoadingMock();
      setupAnnouncementsMocks([], null);
      renderAnnouncementsPage();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('shows empty message when no announcements', async () => {
      setupAnnouncementsMocks([]);
      renderAnnouncementsPage();
      
      await waitFor(() => {
        expect(screen.getByText('No announcements found.')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    test('does not show Add button when not logged in', async () => {
      setupAnnouncementsMocks(mockAnnouncements, null);
      renderAnnouncementsPage();
      
      await assertPageTitle();
      await waitFor(() => {
        expect(screen.queryByText('Add Announcement')).not.toBeInTheDocument();
      });
    });

    test('does not show Edit buttons when not logged in', async () => {
      setupAnnouncementsMocks(mockAnnouncements, null);
      renderAnnouncementsPage();
      
      await assertAllAnnouncementsRendered();
      await waitFor(() => {
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      });
    });

    test('does not show Add button for student users', async () => {
      setupAnnouncementsMocks(mockAnnouncements, mockStudentUser, 'student');
      renderAnnouncementsPage();
      
      await assertPageTitle();
      await waitFor(() => {
        expect(screen.queryByText('Add Announcement')).not.toBeInTheDocument();
      });
    });

    test('shows Add button for staff users', async () => {
      setupAnnouncementsMocks(mockAnnouncements, mockStaffUser, 'staff');
      renderAnnouncementsPage();
      
      await assertPageTitle();
      await waitFor(() => {
        expect(screen.getByText('Add Announcement')).toBeInTheDocument();
      });
    });

    test('shows Edit buttons for staff users', async () => {
      setupAnnouncementsMocks(mockAnnouncements, mockStaffUser, 'staff');
      renderAnnouncementsPage();
      
      await assertAllAnnouncementsRendered();
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        expect(editButtons.length).toBe(mockAnnouncements.length);
      });
    });
  });

  describe('Styling and Layout', () => {
    test('page has proper background and spacing', async () => {
      renderAnnouncementsPage();
      await assertPageContainer();
    });

    test('announcement cards have proper styling', async () => {
      renderAnnouncementsPage();
      await assertAnnouncementCards();
    });
  });

  describe('Accessibility', () => {
    test('announcement cards have proper semantic structure', async () => {
      renderAnnouncementsPage();
      await assertAnnouncementCards();
    });

    test('announcement titles are properly structured', async () => {
      renderAnnouncementsPage();
      
      await waitFor(() => {
        expect(screen.getByText('iPad Pro Found')).toBeInTheDocument();
      });
    });

    test('announcement content is readable and well-formatted', async () => {
      renderAnnouncementsPage();
      
      await waitFor(() => {
        expect(screen.getByText('An iPad Pro was found in the Business School lecture theatre OGGB3. Please contact lost and found with a description to claim.')).toBeInTheDocument();
      });
    });
  });
});
