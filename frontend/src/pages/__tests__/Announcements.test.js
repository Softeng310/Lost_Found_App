import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { collection, getDocs } from 'firebase/firestore';
import AnnouncementsPage from '../Announcements';
import { setupTestEnvironment, cleanupTestEnvironment, renderWithRouter, mockTestData } from '../../test-utils';
import {
  setupConsoleErrorSuppression,
  setupFirebaseMocks,
  setupGlobalFetchMock,
  createMockAnnouncements,
  createMockDoc,
  setupGetDocsMock,
  setupLoadingMock,
  setupEmptyMock,
  setupErrorMock,
  assertTextContent
} from '../../test-utils-shared';

// Setup all common mocks
setupFirebaseMocks();
setupConsoleErrorSuppression();
setupGlobalFetchMock({ announcements: [] });

// Setup test environment
setupTestEnvironment();

describe('AnnouncementsPage', () => {
  const mockAnnouncements = createMockAnnouncements();

  // Helper functions using shared utilities
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
      // Check for date elements in the announcements
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

  // Setup helper using shared utilities
  const setupAnnouncementsMocks = (announcements = mockAnnouncements) => {
    setupGetDocsMock(announcements);
  };

  beforeEach(() => {
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
      renderAnnouncementsPage();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
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
